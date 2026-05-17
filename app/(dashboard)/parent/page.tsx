import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { xpToLevel, formatDate } from '@/lib/utils'
import { Trophy, BookOpen, Clock, Star } from 'lucide-react'

export default async function ParentDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const parentId = session.user.id

  const childLinks = await prisma.parentChild.findMany({
    where: { parentId },
    include: {
      child: {
        include: {
          classEnrollments: { include: { class: { include: { teacher: { select: { name: true } } } } } },
          studentXp: true,
          studentBadges: { include: { badge: true }, orderBy: { earnedAt: 'desc' }, take: 5 },
          quizAttempts: {
            include: { quiz: { select: { title: true } } },
            orderBy: { completedAt: 'desc' },
            take: 5,
          },
        },
      },
    },
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your child's coding journey</p>
      </div>

      {childLinks.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">👨‍👩‍👧</div>
          <h3 className="font-semibold text-gray-700 text-xl mb-2">No child linked yet</h3>
          <p className="text-gray-500 mb-4">Ask your school admin to link your account to your child.</p>
          <p className="text-xs text-gray-400">Your account email: {session.user.email}</p>
        </div>
      ) : (
        childLinks.map(({ child }) => {
          const { level, title } = xpToLevel(child.studentXp?.totalXp ?? 0)
          const avgScore = child.quizAttempts.length > 0
            ? Math.round(child.quizAttempts.reduce((s, a) => s + a.score, 0) / child.quizAttempts.length)
            : 0

          return (
            <div key={child.id} className="mb-10">
              {/* Child header */}
              <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-6 text-white mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                    {child.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold">{child.name}</h2>
                    <p className="text-white/80">{child.gradeLevel}</p>
                    <p className="text-white/70 text-sm">Level {level}: {title}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-3xl font-extrabold">{child.studentXp?.totalXp ?? 0}</div>
                    <div className="text-white/70 text-sm">Total XP</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card text-center">
                  <BookOpen size={24} className="mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{child.classEnrollments.length}</div>
                  <div className="text-xs text-gray-500">Classes enrolled</div>
                </div>
                <div className="card text-center">
                  <Trophy size={24} className="mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold">{child.quizAttempts.length}</div>
                  <div className="text-xs text-gray-500">Quizzes taken</div>
                </div>
                <div className="card text-center">
                  <Star size={24} className="mx-auto mb-2 text-brand-500" />
                  <div className="text-2xl font-bold">{avgScore}%</div>
                  <div className="text-xs text-gray-500">Avg quiz score</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl mb-2">🏅</div>
                  <div className="text-2xl font-bold">{child.studentBadges.length}</div>
                  <div className="text-xs text-gray-500">Badges earned</div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Classes */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-4">📚 Enrolled Classes</h3>
                  {child.classEnrollments.length === 0 ? (
                    <p className="text-gray-400 text-sm">Not enrolled in any classes</p>
                  ) : (
                    <div className="space-y-3">
                      {child.classEnrollments.map(e => (
                        <div key={e.classId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{e.class.name}</div>
                            <div className="text-xs text-gray-500">{e.class.subject} · {e.class.gradeLevel}</div>
                          </div>
                          <div className="text-xs text-gray-400">{e.class.teacher.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent quizzes */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-4">📝 Recent Quiz Results</h3>
                  {child.quizAttempts.length === 0 ? (
                    <p className="text-gray-400 text-sm">No quizzes taken yet</p>
                  ) : (
                    <div className="space-y-3">
                      {child.quizAttempts.map(a => (
                        <div key={a.id} className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{a.quiz.title}</div>
                            <div className="text-xs text-gray-400">{formatDate(a.completedAt)} · +{a.xpEarned} XP</div>
                          </div>
                          <span className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-sm ${
                            a.score >= 70 ? 'bg-green-100 text-green-700' : a.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {a.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="card lg:col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-4">🏆 Badges Earned</h3>
                  {child.studentBadges.length === 0 ? (
                    <p className="text-gray-400 text-sm">No badges yet — encourage them to take quizzes!</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {child.studentBadges.map(b => (
                        <div key={b.badgeId} className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
                          <span className="text-2xl">{b.badge.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-gray-800">{b.badge.name}</div>
                            <div className="text-xs text-gray-500">{formatDate(b.earnedAt)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
