import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  const link = await db.parentChild.findFirst({ where: { parentId: session.user.id, childId: studentId } })
  if (!link) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const records = await db.attendance.findMany({
    where: { studentId },
    include: { class: { select: { name: true } } },
    orderBy: { date: 'desc' },
    take: 60,
  })

  return NextResponse.json(records.map(r => ({
    date: r.date,
    status: r.status,
    note: r.note ?? '',
    className: r.class.name,
  })))
}
