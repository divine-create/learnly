import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: {
      materials: { orderBy: { createdAt: 'asc' } },
      quizzes: { where: { status: 'published' }, include: { _count: { select: { questions: true } } } },
      class: { select: { id: true, name: true, subject: true, gradeLevel: true } },
    },
  })

  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(lesson)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()
  const lesson = await prisma.lesson.update({ where: { id: params.id }, data })
  return NextResponse.json(lesson)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.lesson.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
