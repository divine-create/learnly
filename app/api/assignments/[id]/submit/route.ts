import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { gradeCode } from '@/lib/cody'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { code } = await req.json()

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: { class: { select: { gradeLevel: true } } },
  })
  if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId: params.id, studentId: session.user.id } },
    create: { assignmentId: params.id, studentId: session.user.id, code },
    update: { code, submittedAt: new Date(), score: null, feedback: null, gradedAt: null },
  })

  // AI grade in background — don't block the response
  autoGrade(submission.id, assignment, code, session.user.id).catch(console.error)

  return NextResponse.json(submission)
}

async function autoGrade(
  submissionId: string,
  assignment: { title: string; description: string; language: string; maxScore: number; starterCode: string | null; class: { gradeLevel: string } },
  code: string,
  studentId: string
) {
  try {
    const { score, feedback } = await gradeCode({
      title: assignment.title,
      description: assignment.description,
      language: assignment.language,
      maxScore: assignment.maxScore,
      starterCode: assignment.starterCode,
      studentCode: code,
      gradeLevel: assignment.class.gradeLevel,
    })

    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { score, feedback: `[AI] ${feedback}`, gradedAt: new Date() },
    })

    // Award XP for completing an assignment
    await prisma.studentXP.upsert({
      where: { studentId },
      create: { studentId, totalXp: Math.round(score * 0.5) },
      update: { totalXp: { increment: Math.round(score * 0.5) } },
    })
  } catch {
    // Silently fail — teacher can still grade manually
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { submissionId, score, feedback } = await req.json()
  const submission = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: { score, feedback, gradedAt: new Date() },
  })
  return NextResponse.json(submission)
}
