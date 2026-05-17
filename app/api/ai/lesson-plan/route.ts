import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { topic, gradeLevel, subject, duration } = await req.json()

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(`Create a detailed lesson plan for a Nigerian school teacher.

Topic: ${topic}
Subject: ${subject}
Grade Level: ${gradeLevel}
Duration: ${duration ?? '45'} minutes

Structure it as HTML with these sections:
- Learning Objectives (3-4 bullet points)
- Materials Needed
- Introduction/Hook (5 mins) - use a Nigerian real-world example
- Main Teaching Activity (25 mins) - step by step
- Student Practice (10 mins)
- Wrap-up & Assessment (5 mins)
- Homework Assignment

Use proper HTML tags (h2, h3, ul, li, p, strong). Keep it practical for Nigerian classrooms. Reference NERDC ICT curriculum where relevant.`)

    return NextResponse.json({ content: result.response.text() })
  } catch {
    return NextResponse.json({
      content: `<h2>Lesson Plan: ${topic}</h2><p>AI generation unavailable. Please check your API key and try again.</p>`,
    })
  }
}
