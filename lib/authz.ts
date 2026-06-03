// Centralized authorization helpers for API routes.
//
// Next.js middleware only guards page routes (see middleware.ts), so every
// /api route must enforce its own authorization. These helpers keep that
// enforcement consistent: verify the caller's role and that the entity they
// reference actually belongs to their school (and, where relevant, to them).

import { prisma } from '@/lib/db'

export interface Actor {
  id: string
  role: string
  schoolId: string | null
}

export function isAdmin(role: string) {
  return role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN'
}

/** A SUPER_ADMIN sees everything; otherwise the school must match. */
export function sameSchool(actor: Actor, schoolId: string | null | undefined) {
  if (actor.role === 'SUPER_ADMIN') return true
  return !!schoolId && actor.schoolId === schoolId
}

// --- Entity loaders (only the fields needed for authorization) ---

export async function loadClassForAuthz(classId: string) {
  return prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, schoolId: true, teacherId: true },
  })
}

export async function loadLessonForAuthz(lessonId: string) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, classId: true, class: { select: { schoolId: true, teacherId: true } } },
  })
}

export async function loadAssignmentForAuthz(assignmentId: string) {
  return prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, classId: true, class: { select: { schoolId: true, teacherId: true } } },
  })
}

export async function loadQuizForAuthz(quizId: string) {
  return prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      lesson: { select: { classId: true, class: { select: { schoolId: true, teacherId: true } } } },
    },
  })
}

// --- Relationship checks ---

type ClassRef = { schoolId: string; teacherId: string }

/** Can the actor manage (create/edit/delete within) this class? */
export function canManageClass(actor: Actor, cls: ClassRef) {
  if (actor.role === 'SUPER_ADMIN') return true
  if (actor.role === 'SCHOOL_ADMIN') return actor.schoolId === cls.schoolId
  if (actor.role === 'TEACHER') return actor.id === cls.teacherId
  return false
}

/** Is this student enrolled in the class? */
export async function isEnrolled(studentId: string, classId: string) {
  const e = await prisma.classStudent.findUnique({
    where: { classId_studentId: { classId, studentId } },
    select: { classId: true },
  })
  return !!e
}

/** Can the actor read content within this class (any member of the school, or an enrolled student)? */
export async function canAccessClass(actor: Actor, classId: string, cls: ClassRef) {
  if (actor.role === 'SUPER_ADMIN') return true
  if (actor.schoolId !== cls.schoolId) return false
  if (isAdmin(actor.role)) return true
  if (actor.role === 'TEACHER') return true // same-school teacher; tighten to owner-only if desired
  if (actor.role === 'STUDENT') return isEnrolled(actor.id, classId)
  return false
}
