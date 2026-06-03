import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isPlanActive } from '@/lib/plans'

export async function GET() {
  const session = await auth()
  if (!session?.user?.schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
    select: { plan: true, planExpiry: true },
  })
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  return NextResponse.json({
    plan: school.plan,
    planExpiry: school.planExpiry?.toISOString() ?? null,
    isActive: isPlanActive(school.planExpiry),
  })
}
