import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isAdmin, sameSchool, type Actor } from '@/lib/authz'

const EDITABLE_FIELDS = ['title', 'timeLimitSeconds', 'status', 'totalXp'] as const

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
  if (!sameSchool(session.user as Actor, quiz.schoolId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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

  const actor = session.user as Actor
  if (actor.role !== 'TEACHER' && !isAdmin(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const quiz = await prisma.quiz.findUnique({ where: { id: params.id }, select: { schoolId: true } })
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!sameSchool(actor, quiz.schoolId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}
  for (const f of EDITABLE_FIELDS) if (f in body) data[f] = body[f]

  const updated = await prisma.quiz.update({ where: { id: params.id }, data })
  return NextResponse.json(updated)
}
