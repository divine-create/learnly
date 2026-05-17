import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: {
      questions: { orderBy: { orderIndex: 'asc' } },
      lesson: { select: { title: true, topic: true } },
    },
  })

  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Hide correct answers from students
  if (session.user.role === 'STUDENT') {
    return NextResponse.json({
      ...quiz,
      questions: quiz.questions.map(q => ({ ...q, correctIndex: -1, explanation: '' })),
    })
  }

  return NextResponse.json(quiz)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()
  const quiz = await prisma.quiz.update({ where: { id: params.id }, data })
  return NextResponse.json(quiz)
}
