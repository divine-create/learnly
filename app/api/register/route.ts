import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { generateSchoolCode } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { schoolName, state, lga, schoolType, adminName, adminEmail, adminPassword } = await req.json()

    if (!schoolName || !state || !lga || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const schoolCode = generateSchoolCode(schoolName)
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: { name: schoolName, state, lga, type: schoolType, code: schoolCode },
      })

      await tx.user.create({
        data: {
          schoolId: school.id,
          role: 'SCHOOL_ADMIN',
          name: adminName,
          email: adminEmail,
          passwordHash,
        },
      })

      return school
    })

    return NextResponse.json({ schoolCode: result.code, schoolId: result.id })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
