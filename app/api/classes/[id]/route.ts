import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canAccessClass, canManageClass, loadClassForAuthz, type Actor } from '@/lib/authz'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ref = await loadClassForAuthz(params.id)
  if (!ref) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(await canAccessClass(session.user as Actor, ref.id, ref))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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

  return NextResponse.json(cls)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ref = await loadClassForAuthz(params.id)
  if (!ref) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canManageClass(session.user as Actor, ref)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.class.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
