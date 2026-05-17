import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')!

  const [students, quizAttempts, submissions] = await Promise.all([
    prisma.classStudent.findMany({
      where: { classId },
      include: { student: { select: { id: true, name: true, gradeLevel: true } } },
    }),
    prisma.quizAttempt.findMany({
      where: { quiz: { lessonId: { in: (await prisma.lesson.findMany({ where: { classId }, select: { id: true } })).map(l => l.id) } } },
      select: { studentId: true, score: true, quizId: true, completedAt: true },
    }),
    prisma.assignmentSubmission.findMany({
      where: { assignment: { classId } },
      select: { studentId: true, score: true, assignmentId: true },
    }),
  ])

  const gradebook = students.map(({ student }) => {
    const studentAttempts = quizAttempts.filter(a => a.studentId === student.id)
    const studentSubmissions = submissions.filter(s => s.studentId === student.id)
    const avgQuiz = studentAttempts.length > 0
      ? Math.round(studentAttempts.reduce((s, a) => s + a.score, 0) / studentAttempts.length) : null
    const avgAssignment = studentSubmissions.filter(s => s.score !== null).length > 0
      ? Math.round(studentSubmissions.filter(s => s.score !== null).reduce((s, a) => s + (a.score ?? 0), 0) / studentSubmissions.filter(s => s.score !== null).length) : null

    return {
      studentId: student.id,
      name: student.name,
      gradeLevel: student.gradeLevel,
      quizzes: studentAttempts.length,
      avgQuizScore: avgQuiz,
      assignments: studentSubmissions.length,
      avgAssignmentScore: avgAssignment,
      overallAvg: avgQuiz !== null ? Math.round(((avgQuiz ?? 0) + (avgAssignment ?? avgQuiz ?? 0)) / (avgAssignment !== null ? 2 : 1)) : null,
    }
  })

  return NextResponse.json(gradebook)
}
