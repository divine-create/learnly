import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')

  const role = session.user.role

  if (role === 'STUDENT') {
    const enrollments = await prisma.classStudent.findMany({ where: { studentId: session.user.id }, select: { classId: true } })
    const classIds = classId ? [classId] : enrollments.map(e => e.classId)
    const assignments = await prisma.assignment.findMany({
      where: { classId: { in: classIds }, isPublished: true },
      include: {
        class: { select: { name: true, subject: true } },
        submissions: { where: { studentId: session.user.id }, select: { id: true, score: true, submittedAt: true } },
      },
      orderBy: { dueDate: 'asc' },
    })
    return NextResponse.json(assignments)
  }

  const assignments = await prisma.assignment.findMany({
    where: classId ? { classId } : { class: { teacherId: session.user.id } },
    include: {
      class: { select: { name: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(assignments)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { classId, title, description, dueDate, maxScore, language, starterCode } = await req.json()

  const assignment = await prisma.assignment.create({
    data: { classId, title, description, dueDate: new Date(dueDate), maxScore: maxScore ?? 100, language: language ?? 'python', starterCode, isPublished: true },
  })
  return NextResponse.json(assignment)
}
