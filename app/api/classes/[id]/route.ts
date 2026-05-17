import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: {
      teacher: { select: { name: true, email: true } },
      students: {
        include: {
          student: { select: { id: true, name: true, email: true, gradeLevel: true } },
        },
      },
      lessons: {
        orderBy: { orderIndex: 'asc' },
        include: { _count: { select: { materials: true } } },
      },
    },
  })

  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(cls)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.class.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
