import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { BookOpen, Brain, Trophy, Zap, ArrowRight, Star } from 'lucide-react'
import { xpToLevel } from '@/lib/utils'
import ParentAccessRequests from '@/components/ParentAccessRequests'

export default async function StudentDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'STUDENT') redirect('/login')

  const studentId = session.user.id

  const [xp, badges, enrollments, recentAttempts] = await Promise.all([
    prisma.studentXP.findUnique({ where: { studentId } }),
    prisma.studentBadge.findMany({
      where: { studentId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
      take: 4,
    }),
    prisma.classStudent.findMany({
      where: { studentId },
      include: { class: { include: { teacher: { select: { name: true } } } } },
      take: 3,
    }),
    prisma.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: { select: { title: true } } },
      orderBy: { completedAt: 'desc' },
      take: 3,
    }),
  ])

  const { level, title } = xpToLevel(xp?.totalXp ?? 0)
  const nextLevelXp = [100, 300, 600, 1000, 1500, 9999][level - 1] ?? 9999
  const progress = Math.min(100, Math.round(((xp?.totalXp ?? 0) / nextLevelXp) * 100))

  const GREETINGS = ['Hey', 'Welcome back', 'Hello', 'Good to see you']
  const greeting = GREETINGS[new Date().getHours() % GREETINGS.length]
  const firstName = session.user.name?.split(' ')[0] ?? 'Student'

  const CLASS_GRADIENTS = [
    'from-purple-500 to-indigo-600',
    'from-orange-400 to-pink-500',
    'from-green-400 to-teal-500',
    'from-blue-400 to-cyan-500',
  ]

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-brand-50 via-white to-accent-50 min-h-full">
      {/* Hero greeting */}
      <div className="mb-8">
        <div className="text-4xl mb-1">👋</div>
        <h1 className="text-3xl font-extrabold text-gray-900">{greeting}, {firstName}!</h1>
        <p className="text-gray-600 mt-1">Ready to code something amazing today?</p>
      </div>

      <ParentAccessRequests />

      {/* XP card */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm opacity-80">Your Level</div>
            <div className="text-2xl font-extrabold">{title}</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold">{xp?.totalXp ?? 0}</div>
            <div className="text-sm opacity-80">XP earned</div>
          </div>
        </div>
        <div className="bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className="bg-white rounded-full h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 opacity-70">
          <span>Level {level}</span>
          <span>{nextLevelXp - (xp?.totalXp ?? 0)} XP to next level</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { href: '/student/classes', icon: '📚', label: 'My Classes', color: 'bg-blue-100' },
          { href: '/student/tutor', icon: '🤖', label: 'Ask Cody', color: 'bg-purple-100' },
          { href: '/student/badges', icon: '🏆', label: 'Badges', color: 'bg-yellow-100' },
          { href: '/student/classes', icon: '✏️', label: 'Take Quiz', color: 'bg-green-100' },
        ].map(a => (
          <Link key={a.href} href={a.href} className={`${a.color} rounded-2xl p-4 text-center hover:opacity-80 transition-opacity`}>
            <div className="text-3xl mb-2">{a.icon}</div>
            <div className="font-semibold text-gray-800 text-sm">{a.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My classes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-lg">My Classes</h2>
            <Link href="/student/classes" className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
              All <ArrowRight size={14} />
            </Link>
          </div>
          {enrollments.length === 0 ? (
            <div className="card text-center py-10">
              <div className="text-4xl mb-3">🎒</div>
              <p className="text-gray-500 text-sm">Not enrolled in any classes yet.<br />Ask your teacher for the class code!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map(({ class: cls }, i) => (
                <Link key={cls.id} href={`/student/classes/${cls.id}`} className="group block">
                  <div className={`bg-gradient-to-r ${CLASS_GRADIENTS[i % CLASS_GRADIENTS.length]} rounded-2xl p-5 text-white hover:opacity-95 transition-opacity`}>
                    <h3 className="font-bold text-lg">{cls.name}</h3>
                    <p className="text-white/80 text-sm">{cls.subject} · {cls.gradeLevel}</p>
                    <p className="text-white/70 text-xs mt-1">Teacher: {cls.teacher.name}</p>
                    <div className="mt-3 flex items-center gap-1 text-sm font-medium opacity-80 group-hover:opacity-100">
                      Open class <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Badges and recent */}
        <div className="space-y-6">
          {/* Badges */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg">My Badges</h2>
              <Link href="/student/badges" className="text-sm text-brand-600 font-medium hover:underline">All →</Link>
            </div>
            {badges.length === 0 ? (
              <div className="card text-center py-8">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-gray-500 text-sm">Take your first quiz to earn badges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {badges.map(b => (
                  <div key={b.badgeId} className="card text-center py-4">
                    <div className="text-3xl mb-1">{b.badge.icon}</div>
                    <div className="font-bold text-gray-900 text-sm">{b.badge.name}</div>
                    <div className="text-xs text-gray-400">{b.badge.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent quiz scores */}
          {recentAttempts.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-900 text-lg mb-4">Recent Quiz Scores</h2>
              <div className="space-y-2">
                {recentAttempts.map(a => (
                  <div key={a.id} className="card flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{a.quiz.title}</div>
                      <div className="text-xs text-gray-400">+{a.xpEarned} XP</div>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-extrabold ${
                      a.score >= 70 ? 'bg-green-100 text-green-700' : a.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {a.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
