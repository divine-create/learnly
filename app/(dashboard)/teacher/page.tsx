import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import StatCard from '@/components/StatCard'
import Link from 'next/link'
import { BookOpen, Users, Trophy, FileText, Plus, ArrowRight } from 'lucide-react'

export default async function TeacherDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'TEACHER') redirect('/login')

  const teacherId = session.user.id

  const [classes, quizCount, materialCount, recentAttempts] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId },
      include: {
        _count: { select: { students: true, lessons: true } },
        lessons: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.quiz.count({ where: { lesson: { class: { teacherId } } } }),
    prisma.material.count({ where: { teacherId } }),
    prisma.quizAttempt.findMany({
      where: { quiz: { lesson: { class: { teacherId } } } },
      include: {
        student: { select: { name: true } },
        quiz: { select: { title: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    }),
  ])

  const totalStudents = classes.reduce((s, c) => s + c._count.students, 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {session.user.name?.split(' ')[0]}!</h1>
          <p className="text-gray-500 mt-1">Here's what's happening in your classes today.</p>
        </div>
        <Link href="/teacher/classes/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Class
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="My Classes" value={classes.length} icon={<BookOpen size={22} />} color="bg-brand-100 text-brand-600" />
        <StatCard label="Total Students" value={totalStudents} icon={<Users size={22} />} color="bg-blue-100 text-blue-600" />
        <StatCard label="Quizzes Created" value={quizCount} icon={<Trophy size={22} />} color="bg-yellow-100 text-yellow-600" />
        <StatCard label="Materials Uploaded" value={materialCount} icon={<FileText size={22} />} color="bg-green-100 text-green-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My classes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My Classes</h2>
            <Link href="/teacher/classes" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm mb-3">No classes yet</p>
              <Link href="/teacher/classes/new" className="btn-primary text-sm">Create your first class</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.slice(0, 4).map(cls => (
                <Link key={cls.id} href={`/teacher/classes/${cls.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{cls.name}</div>
                    <div className="text-xs text-gray-500">{cls._count.students} students · {cls._count.lessons} lessons</div>
                  </div>
                  <ArrowRight size={16} className="text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent quiz attempts */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Quiz Attempts</h2>
          {recentAttempts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Trophy size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No quiz attempts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAttempts.map(a => (
                <div key={a.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{a.student.name}</div>
                    <div className="text-xs text-gray-500">{a.quiz.title}</div>
                  </div>
                  <span className={`badge ${a.score >= 70 ? 'bg-green-100 text-green-700' : a.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {a.score}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
