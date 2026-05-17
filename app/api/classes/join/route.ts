import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'STUDENT') return NextResponse.json({ error: 'Only students can join classes' }, { status: 403 })

  const { code } = await req.json()

  const cls = await prisma.class.findUnique({ where: { code: code.trim().toUpperCase() } })
  if (!cls) return NextResponse.json({ error: 'Invalid class code' }, { status: 404 })

  const existing = await prisma.classStudent.findUnique({
    where: { classId_studentId: { classId: cls.id, studentId: session.user.id } },
  })
  if (existing) return NextResponse.json({ error: 'Already enrolled in this class' }, { status: 400 })

  await prisma.classStudent.create({
    data: { classId: cls.id, studentId: session.user.id },
  })

  return NextResponse.json({ classId: cls.id, className: cls.name })
}
