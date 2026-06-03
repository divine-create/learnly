import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { awardBadge, checkXpBadges, updateStreak } from '@/lib/badges'
import { generateDailyChallenge } from '@/lib/cody'

const FALLBACK_CHALLENGES = [
  {
    title: 'Hello Nigeria!',
    description: 'Write a Python program that prints "Hello from Nigeria!" to the screen.',
    language: 'python',
    starterCode: '# Write your code here\n',
    solution: 'print("Hello from Nigeria!")',
    xp: 30,
    difficulty: 'easy',
  },
  {
    title: 'Sum of Two Numbers',
    description: 'Create a variable called "sum" that stores the result of 15 + 27, then print it.',
    language: 'python',
    starterCode: '# Calculate the sum of 15 and 27\n',
    solution: 'sum = 15 + 27\nprint(sum)',
    xp: 40,
    difficulty: 'easy',
  },
  {
    title: 'Count to 5',
    description: 'Use a for loop to print the numbers 1 through 5, each on a new line.',
    language: 'python',
    starterCode: '# Use a for loop\n',
    solution: 'for i in range(1, 6):\n    print(i)',
    xp: 50,
    difficulty: 'medium',
  },
]

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  let challenge = await prisma.dailyChallenge.findUnique({
    where: { date: today },
    include: {
      attempts: { where: { studentId: session.user.id }, select: { passed: true, code: true } },
    },
  })

  if (!challenge) {
    // Try AI generation first, fall back to hardcoded
    let challengeData: (typeof FALLBACK_CHALLENGES)[number]
    try {
      challengeData = await generateDailyChallenge(today)
    } catch {
      challengeData = FALLBACK_CHALLENGES[new Date().getDay() % FALLBACK_CHALLENGES.length]
    }

    challenge = await prisma.dailyChallenge.create({
      data: { ...challengeData, date: today },
      include: { attempts: { where: { studentId: session.user.id }, select: { passed: true, code: true } } },
    })
  }

  return NextResponse.json(challenge)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { challengeId, code, output } = await req.json()

  const challenge = await prisma.dailyChallenge.findUnique({ where: { id: challengeId } })
  if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })

  // If Pyodide ran the code client-side, trust the output comparison
  // Otherwise fall back to keyword heuristic
  let passed: boolean
  if (typeof output === 'string' && output.trim().length > 0) {
    // Compare normalised output against solution keywords (solution output not stored, so check structural match)
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
    const solutionLines = challenge.solution.split('\n').map(l => l.trim()).filter(l => l.length > 2)
    // Check code structure AND that some meaningful output was produced
    passed = solutionLines.some(kw => code.includes(kw.split('(')[0].trim())) && output.trim().length > 0
  } else {
    const solutionKeywords = challenge.solution.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 3)
    passed = solutionKeywords.some(kw => code.includes(kw.split('(')[0].trim()))
  }

  const attempt = await prisma.dailyChallengeAttempt.upsert({
    where: { challengeId_studentId: { challengeId, studentId: session.user.id } },
    create: { challengeId, studentId: session.user.id, code, passed },
    update: { code, passed },
  })

  const earnedBadges: string[] = []

  if (passed) {
    const xpRecord = await prisma.studentXP.upsert({
      where: { studentId: session.user.id },
      create: { studentId: session.user.id, totalXp: challenge.xp },
      update: { totalXp: { increment: challenge.xp } },
    })
    const newTotalXp = (xpRecord.totalXp || 0) + challenge.xp

    const streakDays = await updateStreak(session.user.id)

    const b = await awardBadge(session.user.id, 'daily_champ')
    if (b) earnedBadges.push(`${b.icon} ${b.name}`)
    if (streakDays >= 3) {
      const s = await awardBadge(session.user.id, 'streak_3')
      if (s) earnedBadges.push(`${s.icon} ${s.name}`)
    }
    const xpBadges = await checkXpBadges(session.user.id, newTotalXp)
    earnedBadges.push(...xpBadges)
  }

  return NextResponse.json({
    passed,
    xpEarned: passed ? challenge.xp : 0,
    solution: passed ? null : challenge.solution,
    earnedBadges,
  })
}
