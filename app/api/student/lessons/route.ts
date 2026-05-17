import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const enrollments = await db.classStudent.findMany({
    where: { studentId: session.user.id },
    include: {
      class: {
        include: {
          lessons: { select: { id: true, title: true }, orderBy: { createdAt: 'desc' } },
        },
      },
    },
  })

  const lessons = enrollments.flatMap(e => e.class.lessons)
  return NextResponse.json(lessons)
}
