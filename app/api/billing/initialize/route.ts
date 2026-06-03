import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PLAN_PRICES_KOBO, Plan } from '@/lib/plans'

// Initialise a Paystack transaction for a school subscription
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'SCHOOL_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { plan } = await req.json() as { plan: Plan }
  const amount = PLAN_PRICES_KOBO[plan]
  if (!amount) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId! },
    select: { name: true },
  })
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: admin!.email,
      amount,
      currency: 'NGN',
      metadata: {
        schoolId: session.user.schoolId,
        plan,
        schoolName: school?.name,
      },
      callback_url: `${process.env.NEXTAUTH_URL}/admin?payment=success`,
    }),
  })

  const data = await res.json()
  if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 })

  return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference: data.data.reference })
}
