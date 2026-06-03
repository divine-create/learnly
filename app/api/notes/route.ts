import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notes = await prisma.studentNote.findMany({
    where: { studentId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(notes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, lessonId, isAI } = await req.json()
  const note = await prisma.studentNote.create({
    data: { studentId: session.user.id, title, content, lessonId: lessonId || null, isAI: !!isAI },
  })
  return NextResponse.json(note)
}
