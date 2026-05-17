import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type AgeGroup = 'primary' | 'secondary'

function getAgeGroup(gradeLevel: string | null): AgeGroup {
  if (!gradeLevel) return 'secondary'
  if (gradeLevel.startsWith('Primary')) return 'primary'
  return 'secondary'
}

export async function askCody({
  studentName,
  gradeLevel,
  topic,
  question,
  contextChunks,
  history,
}: {
  studentName: string
  gradeLevel: string | null
  topic: string
  question: string
  contextChunks: string[]
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}): Promise<string> {
  const ageGroup = getAgeGroup(gradeLevel)
  const isPrimary = ageGroup === 'primary'

  const systemPrompt = `You are Cody, a friendly and encouraging coding tutor for Nigerian school students.

CONTEXT FROM TEACHER'S MATERIALS:
${contextChunks.length > 0 ? contextChunks.map((c, i) => `[Source ${i + 1}]: ${c}`).join('\n\n') : 'No specific materials available for this topic yet. Use your general knowledge but keep it curriculum-appropriate.'}

STUDENT PROFILE:
- Name: ${studentName}
- Grade: ${gradeLevel ?? 'Unknown'}
- Age group: ${ageGroup} (${isPrimary ? 'ages 6–11' : 'ages 12–18'})
- Current topic: ${topic}

BEHAVIOUR RULES:
- NEVER give the answer directly. Ask guiding questions first.
- ${isPrimary ? 'Use VERY simple language. Max 2 short sentences. Use emojis to make it fun! 🎉' : 'Use clear language. Max 200 words. Be encouraging and clear.'}
- Use local Nigerian analogies where helpful (e.g. market, danfo bus, jollof rice, suya, Eko Atlantic, NEPA light).
- If the student is frustrated, acknowledge it warmly before continuing.
- If the question is NOT covered in the teacher's materials, say: "That's a great question! Your teacher hasn't covered that yet — let's focus on what we know from today's lesson."
- Always end with an encouraging phrase or a follow-up question.
- ${isPrimary ? 'Max 60 words.' : 'Max 200 words.'}
- You teach coding (Python, Scratch, web development, algorithms). Stay on topic.`

  const messages = [
    ...history,
    { role: 'user' as const, content: question },
  ]

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: isPrimary ? 200 : 500,
    system: systemPrompt,
    messages,
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export async function generateQuiz({
  lessonTitle,
  topic,
  gradeLevel,
  contextChunks,
  numQuestions = 10,
}: {
  lessonTitle: string
  topic: string
  gradeLevel: string
  contextChunks: string[]
  numQuestions?: number
}): Promise<GeneratedQuiz> {
  const isPrimary = gradeLevel.startsWith('Primary')

  const prompt = `You are generating a coding quiz for Nigerian school students.

LESSON: ${lessonTitle}
TOPIC: ${topic}
GRADE: ${gradeLevel}
DIFFICULTY: ${isPrimary ? 'Simple, age 6-11, use Scratch or basic concepts' : 'Intermediate, age 12-18, use Python or web concepts'}

MATERIALS:
${contextChunks.slice(0, 5).map((c, i) => `[${i + 1}]: ${c}`).join('\n\n')}

Generate exactly ${numQuestions} quiz questions as a JSON array. Each question must have:
- id: number (1 to ${numQuestions})
- type: "mcq" (use only mcq for reliability)
- question: clear question text
- options: array of exactly 4 strings
- correct_index: 0-3 (index of correct answer)
- explanation: brief explanation (1-2 sentences)
- xp: 10

Return ONLY valid JSON array. No markdown, no explanation. Start with [ and end with ].`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const questions = JSON.parse(jsonMatch?.[0] ?? '[]')
    return {
      title: `${lessonTitle} Quiz`,
      timeLimitSeconds: numQuestions * 30,
      totalXp: numQuestions * 10,
      questions,
    }
  } catch {
    return { title: `${lessonTitle} Quiz`, timeLimitSeconds: 300, totalXp: 100, questions: [] }
  }
}

export type GeneratedQuiz = {
  title: string
  timeLimitSeconds: number
  totalXp: number
  questions: Array<{
    id: number
    type: string
    question: string
    options: string[]
    correct_index: number
    explanation: string
    xp: number
  }>
}
