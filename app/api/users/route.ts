import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateClassCode } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const schoolId = session.user.schoolId

  if (!schoolId && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'No school' }, { status: 400 })
  }

  const users = await prisma.user.findMany({
    where: {
      ...(schoolId ? { schoolId } : {}),
      ...(role ? { role } : {}),
    },
    select: { id: true, name: true, email: true, role: true, gradeLevel: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, email, password, role, gradeLevel } = await req.json()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

  const passwordHash = await bcrypt.hash(password ?? 'codebridge123', 12)

  const user = await prisma.user.create({
    data: {
      schoolId: session.user.schoolId,
      name,
      email,
      passwordHash,
      role,
      gradeLevel: gradeLevel ?? null,
    },
  })

  if (role === 'STUDENT') {
    await prisma.studentXP.create({ data: { studentId: user.id } })
  }

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role })
}
