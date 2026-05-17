import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const inbox = searchParams.get('inbox') !== 'false'

  const messages = await prisma.message.findMany({
    where: inbox ? { recipientId: session.user.id } : { senderId: session.user.id },
    include: {
      sender: { select: { name: true, role: true } },
      recipient: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(messages)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recipientId, subject, content } = await req.json()

  const message = await prisma.message.create({
    data: { senderId: session.user.id, recipientId, subject, content },
  })
  return NextResponse.json(message)
}
