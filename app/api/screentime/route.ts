import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { studentId, minutes } = await req.json()
  const targetId = studentId ?? session.user.id
  const today = new Date().toISOString().split('T')[0]

  await prisma.screenTime.upsert({
    where: { studentId_date: { studentId: targetId, date: today } },
    create: { studentId: targetId, date: today, minutes },
    update: { minutes: { increment: minutes } },
  })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId') ?? session.user.id
  const days = parseInt(searchParams.get('days') ?? '14')

  const records = await prisma.screenTime.findMany({
    where: { studentId },
    orderBy: { date: 'asc' },
    take: days,
  })
  return NextResponse.json(records.map(r => ({ date: r.date, minutes: r.minutes })))
}
