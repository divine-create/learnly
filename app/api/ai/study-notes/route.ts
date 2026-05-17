import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId } = await req.json()
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 })

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { materials: { include: { chunks: { take: 10 } } } },
  })

  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const chunks = lesson.materials.flatMap(m => m.chunks).map(c => c.chunkText).join('\n\n')
  const context = chunks || lesson.title

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(`Create concise study notes for a Nigerian student learning about "${lesson.title}".

Based on this lesson content:
${context.slice(0, 3000)}

Format the notes with:
- Key concepts (bullet points)
- Important definitions
- Key things to remember
- 2-3 practice tips

Keep it student-friendly and clear. Use simple Nigerian English where helpful.`)

    return NextResponse.json({ summary: result.response.text() })
  } catch {
    const fallback = `# Study Notes: ${lesson.title}\n\n## Key Points\n- Review the lesson material carefully\n- Take notes while reading\n- Practice the exercises provided\n\n## Remember\n- Ask Cody (AI tutor) if you have questions\n- Complete quizzes to test your understanding`
    return NextResponse.json({ summary: fallback })
  }
}
