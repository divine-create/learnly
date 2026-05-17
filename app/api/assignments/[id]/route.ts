import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: {
      class: { select: { name: true, gradeLevel: true } },
      submissions: {
        include: { student: { select: { id: true, name: true, gradeLevel: true } } },
        orderBy: { submittedAt: 'desc' },
      },
    },
  })
  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(assignment)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await req.json()
  const assignment = await prisma.assignment.update({ where: { id: params.id }, data })
  return NextResponse.json(assignment)
}
