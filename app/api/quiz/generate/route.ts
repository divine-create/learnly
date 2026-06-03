import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateQuiz } from '@/lib/cody'
import { retrieveRelevantChunks } from '@/lib/rag'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!rateLimit(`quiz-gen:${session.user.id}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many quiz generations — wait a minute.' }, { status: 429 })
  }

  const { lessonId, numQuestions = 10 } = await req.json()

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { class: { select: { gradeLevel: true, schoolId: true } } },
  })

  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const contextChunks = await retrieveRelevantChunks(lesson.topic, lessonId, 8)

  let generated
  try {
    generated = await generateQuiz({
      lessonTitle: lesson.title,
      topic: lesson.topic,
      gradeLevel: lesson.class.gradeLevel,
      contextChunks,
      numQuestions,
    })
  } catch {
    return NextResponse.json({ error: 'AI quiz generation failed. Please check your API key.' }, { status: 500 })
  }

  const quiz = await prisma.quiz.create({
    data: {
      lessonId,
      schoolId: lesson.class.schoolId,
      title: generated.title,
      timeLimitSeconds: generated.timeLimitSeconds,
      totalXp: generated.totalXp,
      status: 'draft',
      questions: {
        create: generated.questions.map((q, i) => ({
          type: q.type,
          question: q.question,
          options: JSON.stringify(q.options),
          correctIndex: q.correct_index,
          explanation: q.explanation,
          xp: q.xp,
          orderIndex: i,
        })),
      },
    },
    include: { questions: true },
  })

  return NextResponse.json(quiz)
}
