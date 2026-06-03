import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canAccessClass, canManageClass, loadLessonForAuthz, type Actor } from '@/lib/authz'

// Fields a teacher/admin is allowed to change via PATCH (prevents mass-assignment).
const EDITABLE_FIELDS = ['title', 'topic', 'description', 'richContent', 'orderIndex', 'isPublished'] as const

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ref = await loadLessonForAuthz(params.id)
  if (!ref) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(await canAccessClass(session.user as Actor, ref.classId, ref.class))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: {
      materials: { orderBy: { createdAt: 'asc' } },
      quizzes: { where: { status: 'published' }, include: { _count: { select: { questions: true } } } },
      class: { select: { id: true, name: true, subject: true, gradeLevel: true } },
    },
  })

  return NextResponse.json(lesson)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ref = await loadLessonForAuthz(params.id)
  if (!ref) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canManageClass(session.user as Actor, ref.class)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}
  for (const f of EDITABLE_FIELDS) if (f in body) data[f] = body[f]

  const lesson = await prisma.lesson.update({ where: { id: params.id }, data })
  return NextResponse.json(lesson)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ref = await loadLessonForAuthz(params.id)
  if (!ref) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canManageClass(session.user as Actor, ref.class)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.lesson.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
