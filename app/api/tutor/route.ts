import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { askCody } from '@/lib/cody'
import { retrieveRelevantChunks } from '@/lib/rag'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, lessonId, question, history } = await req.json()

  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 })
  }

  const student = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, gradeLevel: true },
  })

  const lesson = lessonId
    ? await prisma.lesson.findUnique({ where: { id: lessonId }, select: { topic: true, title: true } })
    : null

  const contextChunks = lessonId
    ? await retrieveRelevantChunks(question, lessonId)
    : []

  let tutorSessionId = sessionId
  if (!tutorSessionId) {
    const newSession = await prisma.tutorSession.create({
      data: { studentId: session.user.id, lessonId: lessonId ?? null },
    })
    tutorSessionId = newSession.id
  }

  // Save user message
  await prisma.tutorMessage.create({
    data: {
      sessionId: tutorSessionId,
      studentId: session.user.id,
      role: 'user',
      content: question,
    },
  })

  let answer: string
  try {
    answer = await askCody({
      studentName: student?.name ?? 'Student',
      gradeLevel: student?.gradeLevel ?? null,
      topic: lesson?.topic ?? 'Coding',
      question,
      contextChunks,
      history: (history ?? []).slice(-10),
    })
  } catch (err: any) {
    // Fallback if API key not configured
    answer = `Great question about ${lesson?.topic ?? 'coding'}! I'm Cody, your AI tutor. To activate me fully, the school admin needs to add the AI API key. In the meantime, check your lesson materials for the answer! 📚`
  }

  await prisma.tutorMessage.create({
    data: {
      sessionId: tutorSessionId,
      studentId: session.user.id,
      role: 'assistant',
      content: answer,
      chunksUsed: JSON.stringify(contextChunks.map((_, i) => i)),
    },
  })

  return NextResponse.json({ answer, sessionId: tutorSessionId })
}
