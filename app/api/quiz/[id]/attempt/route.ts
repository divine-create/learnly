import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const BADGES = [
  { name: 'First Quiz', condition: 'first_quiz', icon: '🎯' },
  { name: 'Perfect Score', condition: 'perfect_score', icon: '⭐' },
  { name: 'Speed Demon', condition: 'speed_demon', icon: '⚡' },
]

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { answers, timeTaken } = await req.json()
  const studentId = session.user.id

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { orderIndex: 'asc' } } },
  })
  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

  // Score calculation
  let correct = 0
  const results = quiz.questions.map((q, i) => {
    const isCorrect = answers[i] === q.correctIndex
    if (isCorrect) correct++
    return {
      questionId: q.id,
      selected: answers[i],
      correct: q.correctIndex,
      isCorrect,
      explanation: q.explanation,
      xp: isCorrect ? q.xp : 0,
    }
  })

  const score = Math.round((correct / quiz.questions.length) * 100)
  const xpEarned = results.reduce((s, r) => s + r.xp, 0)

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: params.id,
      studentId,
      score,
      xpEarned,
      timeTaken,
      answers: JSON.stringify(answers),
    },
  })

  // Update XP
  await prisma.studentXP.upsert({
    where: { studentId },
    create: { studentId, totalXp: xpEarned, lastActive: new Date() },
    update: { totalXp: { increment: xpEarned }, lastActive: new Date() },
  })

  // Check and award badges
  const earnedBadges: string[] = []

  const prevAttempts = await prisma.quizAttempt.count({ where: { studentId } })
  if (prevAttempts === 1) {
    await awardBadge(studentId, 'first_quiz')
    earnedBadges.push('First Quiz 🎯')
  }
  if (score === 100) {
    await awardBadge(studentId, 'perfect_score')
    earnedBadges.push('Perfect Score ⭐')
  }
  if (timeTaken < quiz.timeLimitSeconds * 0.3) {
    await awardBadge(studentId, 'speed_demon')
    earnedBadges.push('Speed Demon ⚡')
  }

  return NextResponse.json({ attemptId: attempt.id, score, xpEarned, correct, total: quiz.questions.length, results, earnedBadges })
}

async function awardBadge(studentId: string, condition: string) {
  try {
    const badge = await prisma.badge.findFirst({ where: { condition } })
    if (!badge) return
    const existing = await prisma.studentBadge.findUnique({
      where: { studentId_badgeId: { studentId, badgeId: badge.id } },
    })
    if (!existing) {
      await prisma.studentBadge.create({ data: { studentId, badgeId: badge.id } })
    }
  } catch {}
}
