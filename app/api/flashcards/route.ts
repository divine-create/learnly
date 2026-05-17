import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { retrieveRelevantChunks } from '@/lib/rag'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const lessonId = searchParams.get('lessonId')!

  const flashcards = await prisma.flashcard.findMany({
    where: { lessonId },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(flashcards)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { lessonId } = await req.json()

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { title: true, topic: true } })
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const chunks = await retrieveRelevantChunks(lesson.topic, lessonId, 6)

  let cards: Array<{ front: string; back: string }> = []

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(`Generate 8 flashcards from these lesson materials about "${lesson.topic}".
Materials: ${chunks.join('\n\n')}
Return ONLY a JSON array: [{"front": "question or term", "back": "answer or definition"}]
Make each card concise and educational. No markdown, just JSON.`)

    const text = result.response.text()
    const match = text.match(/\[[\s\S]*\]/)
    cards = JSON.parse(match?.[0] ?? '[]')
  } catch {
    cards = chunks.slice(0, 5).map((chunk, i) => ({
      front: `Key concept ${i + 1} from ${lesson.topic}`,
      back: chunk.slice(0, 200),
    }))
  }

  await prisma.flashcard.deleteMany({ where: { lessonId } })
  await prisma.flashcard.createMany({
    data: cards.map((c, i) => ({ lessonId, front: c.front, back: c.back, order: i })),
  })

  const created = await prisma.flashcard.findMany({ where: { lessonId }, orderBy: { order: 'asc' } })
  return NextResponse.json(created)
}
