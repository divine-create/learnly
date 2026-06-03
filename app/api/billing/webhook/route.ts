import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const secret = process.env.PAYSTACK_SECRET_KEY ?? ''

  // Verify webhook signature
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex')
  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.event === 'charge.success') {
    const { schoolId, plan } = event.data.metadata ?? {}
    if (!schoolId || !plan) return NextResponse.json({ ok: true })

    // Grant 1 term (4 months) from now
    const expiry = new Date()
    expiry.setMonth(expiry.getMonth() + 4)

    await prisma.school.update({
      where: { id: schoolId },
      data: { plan, planExpiry: expiry },
    })
  }

  return NextResponse.json({ ok: true })
}
