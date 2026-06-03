import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/authz'

// GET — pending parent-link requests the caller can act on.
//   STUDENT: requests to access their own account.
//   SCHOOL_ADMIN: pending requests for students in their school.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role
  if (role !== 'STUDENT' && !isAdmin(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const where =
    role === 'STUDENT'
      ? { childId: session.user.id, status: 'pending' }
      : { status: 'pending', child: { schoolId: session.user.schoolId } }

  const requests = await prisma.parentChild.findMany({
    where,
    include: {
      parent: { select: { id: true, name: true, email: true } },
      child: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    requests.map(r => ({
      parentId: r.parentId,
      childId: r.childId,
      parentName: r.parent.name,
      parentEmail: r.parent.email,
      childName: r.child.name,
      createdAt: r.createdAt,
    }))
  )
}

// PATCH — approve or reject a pending request.
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { parentId, childId, action } = await req.json()
  if (!parentId || !childId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'parentId, childId and a valid action are required' }, { status: 400 })
  }

  const link = await prisma.parentChild.findUnique({
    where: { parentId_childId: { parentId, childId } },
    include: { child: { select: { schoolId: true } } },
  })
  if (!link) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  // Only the student themselves or a school admin of the child's school may decide.
  const role = session.user.role
  const isTheStudent = role === 'STUDENT' && childId === session.user.id
  const isTheirAdmin = isAdmin(role) && link.child.schoolId === session.user.schoolId
  if (!isTheStudent && !isTheirAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.parentChild.update({
    where: { parentId_childId: { parentId, childId } },
    data:
      action === 'approve'
        ? { status: 'approved', approvedAt: new Date() }
        : { status: 'rejected', approvedAt: null },
  })

  return NextResponse.json({ ok: true, status: action === 'approve' ? 'approved' : 'rejected' })
}
