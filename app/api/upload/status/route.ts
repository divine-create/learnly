import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const materialId = searchParams.get('materialId')
  if (!materialId) return NextResponse.json({ error: 'materialId required' }, { status: 400 })

  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: { status: true, _count: { select: { chunks: true } } },
  })

  if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ status: material.status, chunks: material._count.chunks })
}
