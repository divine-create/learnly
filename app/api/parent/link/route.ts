import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST — link parent to a child by the child's email
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { childEmail } = await req.json()
  if (!childEmail?.trim()) {
    return NextResponse.json({ error: 'Child email is required' }, { status: 400 })
  }

  const child = await prisma.user.findUnique({
    where: { email: childEmail.trim().toLowerCase() },
    select: { id: true, name: true, role: true, schoolId: true, gradeLevel: true },
  })

  if (!child) return NextResponse.json({ error: 'No account found with that email' }, { status: 404 })
  if (child.role !== 'STUDENT') return NextResponse.json({ error: 'That account is not a student' }, { status: 400 })
  if (child.id === session.user.id) return NextResponse.json({ error: 'Cannot link to yourself' }, { status: 400 })
  // A parent may only link to a student in their own school — prevents harvesting
  // arbitrary students' data by guessing emails across tenants.
  if (session.user.schoolId && child.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: 'No account found with that email' }, { status: 404 })
  }

  const existing = await prisma.parentChild.findUnique({
    where: { parentId_childId: { parentId: session.user.id, childId: child.id } },
  })
  if (existing) return NextResponse.json({ error: 'Already linked to this child' }, { status: 409 })

  await prisma.parentChild.create({
    data: { parentId: session.user.id, childId: child.id },
  })

  return NextResponse.json({ success: true, child: { name: child.name, gradeLevel: child.gradeLevel } })
}

// DELETE — unlink a child
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { childId } = await req.json()
  await prisma.parentChild.deleteMany({
    where: { parentId: session.user.id, childId },
  })

  return NextResponse.json({ success: true })
}
