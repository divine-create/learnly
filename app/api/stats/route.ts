import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const schoolId = session.user.schoolId

  if (session.user.role === 'SUPER_ADMIN') {
    const [schools, users, classes, quizAttempts] = await Promise.all([
      prisma.school.count(),
      prisma.user.count(),
      prisma.class.count(),
      prisma.quizAttempt.count(),
    ])
    return NextResponse.json({ schools, users, classes, quizAttempts })
  }

  if (!schoolId) return NextResponse.json({})

  const [students, teachers, classes, lessons, quizAttempts, materials] = await Promise.all([
    prisma.user.count({ where: { schoolId, role: 'STUDENT' } }),
    prisma.user.count({ where: { schoolId, role: 'TEACHER' } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.lesson.count({ where: { class: { schoolId } } }),
    prisma.quizAttempt.count({ where: { quiz: { school: { id: schoolId } } } }),
    prisma.material.count({ where: { lesson: { class: { schoolId } } } }),
  ])

  return NextResponse.json({ students, teachers, classes, lessons, quizAttempts, materials })
}
