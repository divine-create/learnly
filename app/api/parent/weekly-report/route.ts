import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendParentWeeklyReport } from '@/lib/email'

// POST — trigger a weekly report email for the calling parent
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const links = await prisma.parentChild.findMany({
    where: { parentId: session.user.id },
    include: {
      child: {
        include: {
          studentXp: true,
          quizAttempts: {
            where: { completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            select: { score: true },
          },
          lessonProgress: {
            where: { completed: true, completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          },
          studentBadges: {
            where: { earnedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            include: { badge: { select: { icon: true, name: true } } },
          },
        },
      },
    },
  })

  if (links.length === 0) {
    return NextResponse.json({ error: 'No children linked' }, { status: 404 })
  }

  const parent = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  })
  if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

  await Promise.all(
    links.map(({ child }) => {
      const attempts = child.quizAttempts
      const avgScore = attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
        : 0

      return sendParentWeeklyReport({
        to: parent.email,
        parentName: parent.name,
        childName: child.name,
        stats: {
          totalXp: child.studentXp?.totalXp ?? 0,
          streakDays: child.studentXp?.streakDays ?? 0,
          quizzesTaken: attempts.length,
          avgScore,
          lessonsCompleted: child.lessonProgress.length,
          badges: child.studentBadges.map(b => `${b.badge.icon} ${b.badge.name}`),
        },
      })
    })
  )

  return NextResponse.json({ sent: links.length })
}
