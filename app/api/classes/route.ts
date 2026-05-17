import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateClassCode } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const schoolId = session.user.schoolId
  const userId = session.user.id
  const role = session.user.role

  let classes

  if (role === 'TEACHER') {
    classes = await prisma.class.findMany({
      where: { teacherId: userId },
      include: {
        _count: { select: { students: true, lessons: true } },
        teacher: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  } else if (role === 'STUDENT') {
    const enrollments = await prisma.classStudent.findMany({
      where: { studentId: userId },
      include: {
        class: {
          include: {
            teacher: { select: { name: true } },
            _count: { select: { students: true, lessons: true } },
          },
        },
      },
    })
    classes = enrollments.map(e => e.class)
  } else {
    classes = await prisma.class.findMany({
      where: { schoolId: schoolId! },
      include: {
        _count: { select: { students: true, lessons: true } },
        teacher: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  return NextResponse.json(classes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['TEACHER', 'SCHOOL_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, gradeLevel, subject, teacherId } = await req.json()

  const cls = await prisma.class.create({
    data: {
      schoolId: session.user.schoolId!,
      teacherId: teacherId ?? session.user.id,
      name,
      gradeLevel,
      subject,
      code: generateClassCode(),
    },
  })

  return NextResponse.json(cls)
}
