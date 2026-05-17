import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !['TEACHER', 'SCHOOL_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { studentId } = await req.json()

  const [student, xp, attempts] = await Promise.all([
    prisma.user.findUnique({ where: { id: studentId }, select: { name: true, gradeLevel: true } }),
    prisma.studentXP.findUnique({ where: { studentId } }),
    prisma.quizAttempt.findMany({
      where: { studentId },
      select: { score: true },
      orderBy: { completedAt: 'desc' },
      take: 10,
    }),
  ])

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Write a brief, encouraging end-of-term report comment for a Nigerian school student.

Student: ${student.name}
Grade: ${student.gradeLevel}
Average Quiz Score: ${avgScore}%
Total XP Earned: ${xp?.totalXp ?? 0}
Quizzes Taken: ${attempts.length}

Write 2-3 sentences. Be warm, specific, and constructive. Mention coding/ICT skills. Keep it professional like a Nigerian school report card comment.`,
      }],
    })
    const comment = res.content[0].type === 'text' ? res.content[0].text : ''
    return NextResponse.json({ comment })
  } catch {
    return NextResponse.json({
      comment: `${student.name} has shown consistent effort in the ICT curriculum this term with an average score of ${avgScore}%. We encourage continued practice and engagement with coding activities.`,
    })
  }
}
