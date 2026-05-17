import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const attempts = await prisma.quizAttempt.findMany({
    where: { studentId: session.user.id, score: { gte: 70 } },
    include: {
      quiz: {
        include: {
          lesson: {
            include: { class: true },
          },
        },
      },
    },
    orderBy: { completedAt: 'desc' },
  })

  const certificates = attempts.map(a => ({
    id: a.id,
    lessonTitle: a.quiz.lesson?.title ?? a.quiz.title,
    className: a.quiz.lesson?.class?.name ?? 'N/A',
    score: a.score ?? 0,
    completedAt: a.completedAt.toISOString(),
    type: 'quiz' as const,
  }))

  return NextResponse.json(certificates)
}
