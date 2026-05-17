import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')!

  const lessons = await prisma.lesson.findMany({ where: { classId }, select: { id: true } })
  const lessonIds = lessons.map(l => l.id)

  const [lowScoreAttempts, repeatedQuestions] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { quiz: { lessonId: { in: lessonIds } }, score: { lt: 50 } },
      include: {
        student: { select: { id: true, name: true, gradeLevel: true } },
        quiz: { select: { title: true } },
      },
      orderBy: { completedAt: 'desc' },
    }),
    // Students who asked tutor same topic 3+ times
    prisma.tutorMessage.groupBy({
      by: ['studentId'],
      where: { session: { lessonId: { in: lessonIds } }, role: 'user' },
      _count: { id: true },
      having: { id: { _count: { gte: 5 } } },
    }),
  ])

  // Group low scorers
  const lowScoreMap = new Map<string, { name: string; gradeLevel: string | null; attempts: number; avgScore: number }>()
  for (const attempt of lowScoreAttempts) {
    const id = attempt.student.id
    const existing = lowScoreMap.get(id)
    if (existing) {
      existing.attempts++
      existing.avgScore = Math.round((existing.avgScore * (existing.attempts - 1) + attempt.score) / existing.attempts)
    } else {
      lowScoreMap.set(id, { name: attempt.student.name, gradeLevel: attempt.student.gradeLevel, attempts: 1, avgScore: attempt.score })
    }
  }

  const highActivityIds = new Set(repeatedQuestions.map(r => r.studentId))

  const alerts = Array.from(lowScoreMap.entries())
    .filter(([, data]) => data.avgScore < 50)
    .map(([studentId, data]) => ({
      studentId,
      name: data.name,
      gradeLevel: data.gradeLevel,
      avgScore: data.avgScore,
      quizzesFailed: data.attempts,
      repeatedlyAsking: highActivityIds.has(studentId),
      severity: data.avgScore < 30 ? 'high' : 'medium',
    }))

  return NextResponse.json(alerts)
}
