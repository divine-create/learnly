import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const enrollments = await prisma.classStudent.findMany({
    where: { studentId: session.user.id },
    include: {
      class: {
        select: {
          name: true,
          lessons: {
            where: { isPublished: true },
            select: { id: true, title: true, topic: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
  })

  const lessons = enrollments.flatMap(e =>
    e.class.lessons.map(l => ({ ...l, class: { name: e.class.name } }))
  )
  return NextResponse.json(lessons)
}
