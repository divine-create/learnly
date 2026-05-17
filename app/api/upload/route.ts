import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { extractTextFromFile, getFileType } from '@/lib/fileParser'
import { embedAndStoreChunks } from '@/lib/rag'
import path from 'path'
import fs from 'fs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const lessonId = formData.get('lessonId') as string | null

    if (!file || !lessonId) {
      return NextResponse.json({ error: 'File and lessonId are required' }, { status: 400 })
    }

    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
    }

    const fileType = getFileType(file.name)
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

    const filePath = path.join(uploadDir, safeName)
    const arrayBuffer = await file.arrayBuffer()
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer))

    const relPath = `uploads/${safeName}`

    const material = await prisma.material.create({
      data: {
        lessonId,
        teacherId: session.user.id,
        fileName: file.name,
        fileUrl: relPath,
        fileType,
        fileSize: file.size,
        status: 'processing',
      },
    })

    // Process in background (async, don't await)
    processFile(material.id, relPath, fileType).catch(console.error)

    return NextResponse.json({ materialId: material.id, status: 'processing' })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function processFile(materialId: string, filePath: string, fileType: string) {
  try {
    const text = await extractTextFromFile(filePath, fileType)
    if (text.trim().length > 0) {
      await embedAndStoreChunks(materialId, text)
    } else {
      await prisma.material.update({ where: { id: materialId }, data: { status: 'ready' } })
    }
  } catch (err) {
    console.error('Processing error:', err)
    await prisma.material.update({ where: { id: materialId }, data: { status: 'failed' } })
  }
}
