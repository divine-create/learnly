import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { xpToLevel } from '@/lib/utils'
import { Trophy } from 'lucide-react'

export default async function BadgesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'STUDENT') redirect('/login')

  const studentId = session.user.id

  const [xp, earnedBadges, allBadges] = await Promise.all([
    prisma.studentXP.findUnique({ where: { studentId } }),
    prisma.studentBadge.findMany({
      where: { studentId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.badge.findMany({ orderBy: { xpRequired: 'asc' } }),
  ])

  const earnedIds = new Set(earnedBadges.map(b => b.badgeId))
  const { level, title } = xpToLevel(xp?.totalXp ?? 0)

  return (
    <div className="p-6 md:p-8">
      {/* XP Summary */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/70 text-sm">Your level</div>
            <div className="text-3xl font-extrabold">{title}</div>
            <div className="text-white/80 text-sm mt-1">Level {level}</div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-extrabold">{xp?.totalXp ?? 0}</div>
            <div className="text-white/70 text-sm">Total XP</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm mb-1 text-white/80">{earnedBadges.length} / {allBadges.length} badges earned</div>
          <div className="bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-full"
              style={{ width: allBadges.length > 0 ? `${(earnedBadges.length / allBadges.length) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Streak */}
      {(xp?.streakDays ?? 0) > 0 && (
        <div className="card bg-orange-50 border-orange-200 mb-6 flex items-center gap-4">
          <div className="text-4xl">🔥</div>
          <div>
            <div className="font-bold text-orange-800 text-xl">{xp?.streakDays}-day streak!</div>
            <div className="text-orange-600 text-sm">Keep it up! Come back tomorrow to continue.</div>
          </div>
        </div>
      )}

      {/* All badges */}
      <h2 className="font-bold text-gray-900 text-lg mb-4">All Badges</h2>
      {allBadges.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Badges will appear here as you complete quizzes!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allBadges.map(badge => {
            const earned = earnedIds.has(badge.id)
            return (
              <div key={badge.id} className={`card text-center transition-all ${earned ? 'border-yellow-200 bg-yellow-50' : 'opacity-50'}`}>
                <div className={`text-5xl mb-3 ${earned ? '' : 'grayscale'}`}>{badge.icon}</div>
                <div className={`font-bold text-sm mb-1 ${earned ? 'text-gray-900' : 'text-gray-500'}`}>{badge.name}</div>
                <div className="text-xs text-gray-500">{badge.description}</div>
                {earned && (
                  <div className="mt-2 text-xs text-yellow-700 font-medium">✅ Earned!</div>
                )}
                {!earned && (
                  <div className="mt-2 text-xs text-gray-400">🔒 Locked</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
