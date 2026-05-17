import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const links = await db.parentChild.findMany({
    where: { parentId: session.user.id },
    include: { child: { select: { id: true, name: true, gradeLevel: true } } },
  })

  return NextResponse.json(links.map(l => l.child))
}
