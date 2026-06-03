import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canAccessClass, canManageClass, loadClassForAuthz, type Actor } from '@/lib/authz'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  const cls = await loadClassForAuthz(classId)
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(await canAccessClass(session.user as Actor, cls.id, cls))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const lessons = await prisma.lesson.findMany({
    where: { classId },
    include: {
      _count: { select: { materials: true, quizzes: true } },
      materials: { select: { id: true, fileName: true, status: true, fileType: true } },
    },
    orderBy: { orderIndex: 'asc' },
  })

  return NextResponse.json(lessons)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { classId, title, topic, description, orderIndex } = await req.json()

  const cls = await loadClassForAuthz(classId)
  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  if (!canManageClass(session.user as Actor, cls)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const lesson = await prisma.lesson.create({
    data: { classId, title, topic, description, orderIndex: orderIndex ?? 0 },
  })

  return NextResponse.json(lesson)
}
