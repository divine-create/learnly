import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { awardBadge, checkXpBadges, updateStreak } from '@/lib/badges'
import { isEnrolled } from '@/lib/authz'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { answers, timeTaken } = await req.json()
  const studentId = session.user.id

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: {
      questions: { orderBy: { orderIndex: 'asc' } },
      lesson: { select: { classId: true } },
    },
  })
  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

  // Only students enrolled in the quiz's class (and only published quizzes) may attempt it.
  if (quiz.status !== 'published' || !(await isEnrolled(studentId, quiz.lesson.classId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
    data: { quizId: params.id, studentId, score, xpEarned, timeTaken, answers: JSON.stringify(answers) },
  })

  // Update XP
  const xpRecord = await prisma.studentXP.upsert({
    where: { studentId },
    create: { studentId, totalXp: xpEarned, lastActive: new Date() },
    update: { totalXp: { increment: xpEarned } },
  })
  const newTotalXp = (xpRecord.totalXp || 0) + xpEarned

  // Update streak
  const streakDays = await updateStreak(studentId)

  // Award badges
  const earnedBadges: string[] = []

  const prevAttempts = await prisma.quizAttempt.count({ where: { studentId } })
  if (prevAttempts === 1) {
    const b = await awardBadge(studentId, 'first_quiz')
    if (b) earnedBadges.push(`${b.icon} ${b.name}`)
  }
  if (score === 100) {
    const b = await awardBadge(studentId, 'perfect_score')
    if (b) earnedBadges.push(`${b.icon} ${b.name}`)
  }
  if (timeTaken < quiz.timeLimitSeconds * 0.3) {
    const b = await awardBadge(studentId, 'speed_demon')
    if (b) earnedBadges.push(`${b.icon} ${b.name}`)
  }
  if (streakDays >= 3) {
    const b = await awardBadge(studentId, 'streak_3')
    if (b) earnedBadges.push(`${b.icon} ${b.name}`)
  }

  const xpBadges = await checkXpBadges(studentId, newTotalXp)
  earnedBadges.push(...xpBadges)

  return NextResponse.json({
    attemptId: attempt.id, score, xpEarned, correct,
    total: quiz.questions.length, results, earnedBadges, streakDays,
  })
}
