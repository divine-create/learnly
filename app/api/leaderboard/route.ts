import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')
  const scope = searchParams.get('scope') ?? 'school' // school | class | global

  let studentIds: string[] = []

  if (classId) {
    const enrollments = await prisma.classStudent.findMany({ where: { classId }, select: { studentId: true } })
    studentIds = enrollments.map(e => e.studentId)
  } else if (scope === 'school' && session.user.schoolId) {
    const students = await prisma.user.findMany({
      where: { schoolId: session.user.schoolId, role: 'STUDENT' },
      select: { id: true },
    })
    studentIds = students.map(s => s.id)
  } else {
    const students = await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true }, take: 100 })
    studentIds = students.map(s => s.id)
  }

  const leaderboard = await prisma.studentXP.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      student: { select: { name: true, gradeLevel: true, avatarUrl: true } },
    },
    orderBy: { totalXp: 'desc' },
    take: 20,
  })

  return NextResponse.json(leaderboard.map((entry, i) => ({
    rank: i + 1,
    studentId: entry.studentId,
    name: entry.student.name,
    gradeLevel: entry.student.gradeLevel,
    totalXp: entry.totalXp,
    streakDays: entry.streakDays,
    isCurrentUser: entry.studentId === session.user.id,
  })))
}
