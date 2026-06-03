import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canAccessClass, canManageClass, isAdmin, loadAssignmentForAuthz, type Actor } from '@/lib/authz'

const EDITABLE_FIELDS = ['title', 'description', 'starterCode', 'dueDate', 'maxScore', 'language', 'isPublished'] as const

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ref = await loadAssignmentForAuthz(params.id)
  if (!ref) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const actor = session.user as Actor
  if (!(await canAccessClass(actor, ref.classId, ref.class))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Teachers/admins see every submission; a student sees only their own.
  const canSeeAll = isAdmin(actor.role) || actor.role === 'TEACHER'

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: {
      class: { select: { name: true, gradeLevel: true } },
      submissions: {
        where: canSeeAll ? undefined : { studentId: actor.id },
        include: { student: { select: { id: true, name: true, gradeLevel: true } } },
        orderBy: { submittedAt: 'desc' },
      },
    },
  })
  return NextResponse.json(assignment)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ref = await loadAssignmentForAuthz(params.id)
  if (!ref) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canManageClass(session.user as Actor, ref.class)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}
  for (const f of EDITABLE_FIELDS) if (f in body) data[f] = body[f]

  const assignment = await prisma.assignment.update({ where: { id: params.id }, data })
  return NextResponse.json(assignment)
}
