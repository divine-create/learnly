import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { BarChart2, Download, Trophy, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function ReportsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'SCHOOL_ADMIN') redirect('/login')

  const schoolId = session.user.schoolId!

  const [topStudents, recentAttempts, teacherActivity] = await Promise.all([
    prisma.studentXP.findMany({
      where: { student: { schoolId } },
      include: { student: { select: { name: true, gradeLevel: true } } },
      orderBy: { totalXp: 'desc' },
      take: 10,
    }),
    prisma.quizAttempt.findMany({
      where: { quiz: { school: { id: schoolId } } },
      include: {
        student: { select: { name: true } },
        quiz: { select: { title: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    }),
    prisma.class.findMany({
      where: { schoolId },
      include: {
        teacher: { select: { name: true } },
        _count: { select: { lessons: true, students: true } },
        lessons: { include: { _count: { select: { materials: true } } } },
      },
    }),
  ])

  const avgScore = recentAttempts.length > 0
    ? Math.round(recentAttempts.reduce((s, a) => s + a.score, 0) / recentAttempts.length)
    : 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">School Reports</h1>
        <button className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <Trophy size={28} className="mx-auto mb-2 text-yellow-500" />
          <div className="text-3xl font-bold text-gray-900">{avgScore}%</div>
          <div className="text-sm text-gray-500">Average quiz score</div>
        </div>
        <div className="card text-center">
          <BarChart2 size={28} className="mx-auto mb-2 text-brand-500" />
          <div className="text-3xl font-bold text-gray-900">{recentAttempts.length}</div>
          <div className="text-sm text-gray-500">Total quiz attempts</div>
        </div>
        <div className="card text-center">
          <Clock size={28} className="mx-auto mb-2 text-blue-500" />
          <div className="text-3xl font-bold text-gray-900">{topStudents.reduce((s, x) => s + x.totalXp, 0)}</div>
          <div className="text-sm text-gray-500">Total XP earned</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top students */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">🏆 Top Students by XP</h2>
          {topStudents.length === 0 ? (
            <p className="text-gray-400 text-sm">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {topStudents.map((s, i) => (
                <div key={s.studentId} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-500'
                  }`}>{i + 1}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{s.student.name}</div>
                    <div className="text-xs text-gray-400">{s.student.gradeLevel}</div>
                  </div>
                  <div className="text-sm font-bold text-brand-600">{s.totalXp} XP</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent attempts */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">📝 Recent Quiz Attempts</h2>
          {recentAttempts.length === 0 ? (
            <p className="text-gray-400 text-sm">No quiz attempts yet</p>
          ) : (
            <div className="space-y-3">
              {recentAttempts.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{a.student.name}</div>
                    <div className="text-xs text-gray-400">{a.quiz.title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${a.score >= 70 ? 'bg-green-100 text-green-700' : a.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {a.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
