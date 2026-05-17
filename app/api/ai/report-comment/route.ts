import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

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

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(`Write a brief, encouraging end-of-term report comment for a Nigerian school student.

Student: ${student.name}
Grade: ${student.gradeLevel}
Average Quiz Score: ${avgScore}%
Total XP Earned: ${xp?.totalXp ?? 0}
Quizzes Taken: ${attempts.length}

Write 2-3 sentences. Be warm, specific, and constructive. Mention coding/ICT skills. Keep it professional like a Nigerian school report card comment.`)

    return NextResponse.json({ comment: result.response.text() })
  } catch {
    return NextResponse.json({
      comment: `${student.name} has shown consistent effort in the ICT curriculum this term with an average score of ${avgScore}%. We encourage continued practice and engagement with coding activities.`,
    })
  }
}
