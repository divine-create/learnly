import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')
  const schoolId = session.user.schoolId

  let where: any = {}
  if (classId) {
    where = { classId }
  } else if (session.user.role === 'STUDENT') {
    const enrollments = await prisma.classStudent.findMany({ where: { studentId: session.user.id }, select: { classId: true } })
    where = { OR: [{ schoolId }, { classId: { in: enrollments.map(e => e.classId) } }] }
  } else {
    where = { OR: [{ schoolId }, { class: { schoolId } }] }
  }

  const announcements = await prisma.announcement.findMany({
    where,
    include: { author: { select: { name: true, role: true } }, class: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(announcements)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, content, classId, priority } = await req.json()

  const announcement = await prisma.announcement.create({
    data: {
      title, content, priority: priority ?? 'normal',
      authorId: session.user.id,
      classId: classId ?? null,
      schoolId: classId ? null : session.user.schoolId,
    },
  })
  return NextResponse.json(announcement)
}
