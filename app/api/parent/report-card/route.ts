import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  const link = await prisma.parentChild.findFirst({ where: { parentId: session.user.id, childId: studentId, status: 'approved' } })
  if (!link) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [student, xpRecord, badgeCount, enrollments, currentTerm, allAttendance] = await Promise.all([
    prisma.user.findUnique({ where: { id: studentId }, select: { name: true, gradeLevel: true } }),
    prisma.studentXP.findFirst({ where: { studentId } }),
    prisma.studentBadge.count({ where: { studentId } }),
    prisma.classStudent.findMany({ where: { studentId }, select: { classId: true } }),
    prisma.termPeriod.findFirst({
      where: { schoolId: session.user.schoolId ?? '', startDate: { lte: new Date() }, endDate: { gte: new Date() } },
    }),
    prisma.attendance.findMany({ where: { studentId }, select: { status: true } }),
  ])

  const attendanceRate = allAttendance.length > 0
    ? Math.round((allAttendance.filter(a => a.status === 'present').length / allAttendance.length) * 100)
    : null

  const classIds = enrollments.map(e => e.classId)

  const [classes, quizAttempts, submissionsData] = await Promise.all([
    prisma.class.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } }),
    prisma.quizAttempt.findMany({
      where: { studentId, quiz: { lesson: { classId: { in: classIds } } } },
      include: { quiz: { include: { lesson: { select: { classId: true } } } } },
    }),
    prisma.assignmentSubmission.findMany({
      where: { studentId, assignment: { classId: { in: classIds } } },
      include: { assignment: { select: { classId: true } } },
    }),
  ])

  const subjects = classes.map(cls => {
    const clsQuizzes = quizAttempts.filter(q => q.quiz.lesson?.classId === cls.id)
    const clsAssignments = submissionsData.filter(a => a.assignment.classId === cls.id)

    const validQuiz = clsQuizzes.filter(q => q.score !== null)
    const validAssign = clsAssignments.filter(a => a.score !== null)

    const avgQuizScore = validQuiz.length > 0
      ? Math.round(validQuiz.reduce((s, q) => s + (q.score ?? 0), 0) / validQuiz.length)
      : null
    const avgAssignmentScore = validAssign.length > 0
      ? Math.round(validAssign.reduce((s, a) => s + (a.score ?? 0), 0) / validAssign.length)
      : null

    const scores = [...(avgQuizScore !== null ? [avgQuizScore] : []), ...(avgAssignmentScore !== null ? [avgAssignmentScore] : [])]
    const overallAvg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null

    return { className: cls.name, quizzes: validQuiz.length, avgQuizScore, assignments: validAssign.length, avgAssignmentScore, overallAvg }
  })

  return NextResponse.json({
    student,
    term: currentTerm ? { name: currentTerm.name, startDate: currentTerm.startDate.toISOString(), endDate: currentTerm.endDate.toISOString() } : null,
    subjects,
    totalXp: xpRecord?.totalXp ?? 0,
    badgesEarned: badgeCount,
    attendanceRate,
  })
}
