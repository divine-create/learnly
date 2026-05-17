import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')!
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  const records = await prisma.attendance.findMany({
    where: { classId, date },
    include: { student: { select: { id: true, name: true, gradeLevel: true } } },
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { classId, date, records } = await req.json()
  // records: [{ studentId, status, note }]

  const ops = records.map((r: { studentId: string; status: string; note?: string }) =>
    prisma.attendance.upsert({
      where: { classId_studentId_date: { classId, studentId: r.studentId, date } },
      create: { classId, studentId: r.studentId, date, status: r.status, note: r.note },
      update: { status: r.status, note: r.note },
    })
  )
  await prisma.$transaction(ops)
  return NextResponse.json({ ok: true })
}
