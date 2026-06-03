import { prisma } from '@/lib/db'

const BADGE_CONDITIONS = [
  'first_quiz',
  'perfect_score',
  'speed_demon',
  'xp_100',
  'xp_300',
  'streak_3',
  'daily_champ',
] as const

export async function awardBadge(studentId: string, condition: string) {
  try {
    const badge = await prisma.badge.findFirst({ where: { condition } })
    if (!badge) return
    await prisma.studentBadge.upsert({
      where: { studentId_badgeId: { studentId, badgeId: badge.id } },
      create: { studentId, badgeId: badge.id },
      update: {},
    })
    return badge
  } catch {}
}

export async function checkXpBadges(studentId: string, totalXp: number) {
  const badges: string[] = []
  if (totalXp >= 100) {
    const b = await awardBadge(studentId, 'xp_100')
    if (b) badges.push(`${b.icon} ${b.name}`)
  }
  if (totalXp >= 300) {
    const b = await awardBadge(studentId, 'xp_300')
    if (b) badges.push(`${b.icon} ${b.name}`)
  }
  return badges
}

export async function updateStreak(studentId: string): Promise<number> {
  const record = await prisma.studentXP.findUnique({ where: { studentId } })
  if (!record) return 1

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const lastActive = record.lastActive ? new Date(record.lastActive) : null
  if (lastActive) lastActive.setHours(0, 0, 0, 0)

  let newStreak: number
  if (lastActive?.getTime() === today.getTime()) {
    newStreak = record.streakDays // already logged in today
  } else if (lastActive?.getTime() === yesterday.getTime()) {
    newStreak = record.streakDays + 1 // consecutive day
  } else {
    newStreak = 1 // streak broken or first time
  }

  await prisma.studentXP.update({
    where: { studentId },
    data: { streakDays: newStreak, lastActive: new Date() },
  })

  return newStreak
}
