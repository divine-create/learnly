import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { studentId, classCode } = await req.json()

  const cls = await prisma.class.findUnique({ where: { id: params.id } })
  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  const targetStudentId = studentId ?? session.user.id

  const existing = await prisma.classStudent.findUnique({
    where: { classId_studentId: { classId: params.id, studentId: targetStudentId } },
  })
  if (existing) return NextResponse.json({ error: 'Already enrolled' }, { status: 400 })

  await prisma.classStudent.create({
    data: { classId: params.id, studentId: targetStudentId },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { studentId } = await req.json()
  const targetStudentId = studentId ?? session.user.id

  await prisma.classStudent.delete({
    where: { classId_studentId: { classId: params.id, studentId: targetStudentId } },
  })

  return NextResponse.json({ ok: true })
}
