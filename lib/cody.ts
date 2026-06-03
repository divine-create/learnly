import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

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

  const systemInstruction = `You are Cody, a friendly and encouraging coding tutor for Nigerian school students.

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

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction,
  })

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
    generationConfig: { maxOutputTokens: isPrimary ? 200 : 500 },
  })

  const result = await chat.sendMessage(question)
  return result.response.text()
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

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await model.generateContent(prompt)
  const text = result.response.text()

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

export async function gradeCode({
  title,
  description,
  language,
  maxScore,
  starterCode,
  studentCode,
  gradeLevel,
}: {
  title: string
  description: string
  language: string
  maxScore: number
  starterCode?: string | null
  studentCode: string
  gradeLevel?: string | null
}): Promise<{ score: number; feedback: string }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are grading a coding assignment for a Nigerian school student.

Assignment: ${title}
Instructions: ${description}
Language: ${language}
Grade Level: ${gradeLevel ?? 'Secondary'}
Max Score: ${maxScore}
${starterCode ? `Starter Code:\n${starterCode}` : ''}

Student's Submission:
\`\`\`${language}
${studentCode}
\`\`\`

Grade this submission on a scale of 0–${maxScore}. Consider:
- Correctness: Does it solve the problem?
- Code quality: Is it readable and well-structured?
- Effort: Did the student attempt the task meaningfully?

Return ONLY valid JSON (no markdown):
{
  "score": <integer 0–${maxScore}>,
  "feedback": "<2-3 encouraging sentences explaining the score, pointing out what was good and one specific improvement. Use a warm, teacher tone. Mention something specific from their code.>"
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  const parsed = JSON.parse(match[0])
  return {
    score: Math.min(maxScore, Math.max(0, parseInt(parsed.score))),
    feedback: parsed.feedback,
  }
}

export async function generateDailyChallenge(date: string): Promise<{
  title: string
  description: string
  language: string
  starterCode: string
  solution: string
  xp: number
  difficulty: string
}> {
  const dayOfWeek = new Date(date).getDay()
  const difficulties = ['easy', 'easy', 'medium', 'medium', 'hard', 'medium', 'easy']
  const difficulty = difficulties[dayOfWeek]
  const xpMap = { easy: 30, medium: 50, hard: 80 } as const

  const prompt = `Generate a Python coding challenge for Nigerian secondary school students (ages 12-18).

Date: ${date}
Difficulty: ${difficulty}
Theme: Use a Nigerian context (market, NEPA light, danfo bus, suya, football, etc.)

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "title": "short catchy title",
  "description": "1-2 sentence problem statement using Nigerian context",
  "language": "python",
  "starterCode": "# starter code with comments\\n",
  "solution": "complete working solution code",
  "xp": ${xpMap[difficulty as keyof typeof xpMap]},
  "difficulty": "${difficulty}"
}

Rules:
- The solution must be runnable Python 3, max 10 lines
- starterCode should have the function signature and helpful comments
- description must be solvable by a beginner knowing print, variables, loops, if-else
- For hard: may use functions or lists`

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await model.generateContent(prompt)
  const text = result.response.text()

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')
  return JSON.parse(jsonMatch[0])
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
