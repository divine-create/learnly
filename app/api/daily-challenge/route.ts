import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
    // Generate or use fallback
    const fallback = FALLBACK_CHALLENGES[new Date().getDay() % FALLBACK_CHALLENGES.length]
    challenge = await prisma.dailyChallenge.create({
      data: { ...fallback, date: today },
      include: { attempts: { where: { studentId: session.user.id }, select: { passed: true, code: true } } },
    })
  }

  return NextResponse.json(challenge)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { challengeId, code } = await req.json()

  const challenge = await prisma.dailyChallenge.findUnique({ where: { id: challengeId } })
  if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })

  // Simple check: code contains key parts of solution
  const solutionKeywords = challenge.solution.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 3)
  const passed = solutionKeywords.some(kw => code.includes(kw.split('(')[0].trim()))

  const attempt = await prisma.dailyChallengeAttempt.upsert({
    where: { challengeId_studentId: { challengeId, studentId: session.user.id } },
    create: { challengeId, studentId: session.user.id, code, passed },
    update: { code, passed },
  })

  if (passed) {
    await prisma.studentXP.upsert({
      where: { studentId: session.user.id },
      create: { studentId: session.user.id, totalXp: challenge.xp },
      update: { totalXp: { increment: challenge.xp } },
    })
  }

  return NextResponse.json({ passed, xpEarned: passed ? challenge.xp : 0, solution: passed ? null : challenge.solution })
}
