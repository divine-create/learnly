import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { students } = await req.json()
  // students: [{ name, email, gradeLevel, password? }]

  const results = { created: 0, skipped: 0, errors: [] as string[] }

  for (const s of students) {
    try {
      const existing = await prisma.user.findUnique({ where: { email: s.email } })
      if (existing) { results.skipped++; continue }

      const passwordHash = await bcrypt.hash(s.password ?? 'codebridge123', 10)
      const user = await prisma.user.create({
        data: {
          schoolId: session.user.schoolId!,
          role: 'STUDENT',
          name: s.name,
          email: s.email,
          passwordHash,
          gradeLevel: s.gradeLevel,
        },
      })
      await prisma.studentXP.create({ data: { studentId: user.id } })
      results.created++
    } catch (err: any) {
      results.errors.push(`${s.email}: ${err.message}`)
    }
  }

  return NextResponse.json(results)
}
