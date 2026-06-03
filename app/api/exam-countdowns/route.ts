import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const exams = await prisma.examCountdown.findMany({
    where: { studentId: session.user.id },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(exams)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, date, time, notes } = await req.json()
  const exam = await prisma.examCountdown.create({
    data: { studentId: session.user.id, subject, date, time: time || '09:00', notes: notes || null },
  })
  return NextResponse.json(exam)
}
