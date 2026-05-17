import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const terms = await prisma.termPeriod.findMany({
    where: { schoolId: session.user.schoolId! },
    orderBy: { startDate: 'desc' },
  })
  return NextResponse.json(terms)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, startDate, endDate, isCurrent } = await req.json()

  if (isCurrent) {
    await prisma.termPeriod.updateMany({ where: { schoolId: session.user.schoolId! }, data: { isCurrent: false } })
  }

  const term = await prisma.termPeriod.create({
    data: { schoolId: session.user.schoolId!, name, startDate: new Date(startDate), endDate: new Date(endDate), isCurrent: isCurrent ?? false },
  })
  return NextResponse.json(term)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, isCurrent } = await req.json()
  if (isCurrent) {
    await prisma.termPeriod.updateMany({ where: { schoolId: session.user.schoolId! }, data: { isCurrent: false } })
  }
  const term = await prisma.termPeriod.update({ where: { id }, data: { isCurrent } })
  return NextResponse.json(term)
}
