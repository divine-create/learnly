import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId') ?? session.user.id

  const [xp, badges, attempts, progress] = await Promise.all([
    prisma.studentXP.findUnique({ where: { studentId } }),
    prisma.studentBadge.findMany({
      where: { studentId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: { select: { title: true } } },
      orderBy: { completedAt: 'desc' },
      take: 10,
    }),
    prisma.lessonProgress.findMany({
      where: { studentId },
      include: { lesson: { select: { title: true } } },
    }),
  ])

  return NextResponse.json({ xp, badges, attempts, progress })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, completed, timeSpent } = await req.json()

  const lp = await prisma.lessonProgress.upsert({
    where: { lessonId_studentId: { lessonId, studentId: session.user.id } },
    create: {
      lessonId,
      studentId: session.user.id,
      completed: completed ?? false,
      completedAt: completed ? new Date() : null,
      timeSpent: timeSpent ?? 0,
    },
    update: {
      completed: completed ?? false,
      completedAt: completed ? new Date() : null,
      timeSpent: { increment: timeSpent ?? 0 },
    },
  })

  return NextResponse.json(lp)
}
