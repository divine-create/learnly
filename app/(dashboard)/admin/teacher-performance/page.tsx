import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { GraduationCap, BookOpen, FileText, Trophy, TrendingUp } from 'lucide-react'

export default async function TeacherPerformancePage() {
  const session = await auth()
  if (!session || session.user.role !== 'SCHOOL_ADMIN') redirect('/login')

  const teachers = await prisma.user.findMany({
    where: { schoolId: session.user.schoolId!, role: 'TEACHER' },
    include: {
      taughtClasses: {
        include: {
          _count: { select: { students: true, lessons: true } },
          lessons: {
            include: {
              materials: { select: { id: true } },
              quizzes: { include: { _count: { select: { attempts: true } }, attempts: { select: { score: true } } } },
            },
          },
        },
      },
    },
  })

  const data = teachers.map(t => {
    const totalStudents = t.taughtClasses.reduce((s, c) => s + c._count.students, 0)
    const totalLessons = t.taughtClasses.reduce((s, c) => s + c._count.lessons, 0)
    const totalMaterials = t.taughtClasses.reduce((s, c) => s + c.lessons.reduce((ls, l) => ls + l.materials.length, 0), 0)
    const allAttempts = t.taughtClasses.flatMap(c => c.lessons.flatMap(l => l.quizzes.flatMap(q => q.attempts)))
    const avgScore = allAttempts.length > 0 ? Math.round(allAttempts.reduce((s, a) => s + a.score, 0) / allAttempts.length) : null
    const totalQuizAttempts = allAttempts.length

    return { id: t.id, name: t.name, email: t.email, totalStudents, totalLessons, totalMaterials, avgScore, totalQuizAttempts, classes: t.taughtClasses.length }
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Teacher Performance</h1>

      {data.length === 0 ? (
        <div className="card text-center py-12">
          <GraduationCap size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No teachers registered yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.sort((a, b) => b.totalStudents - a.totalStudents).map(t => (
            <div key={t.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{t.name}</h3>
                  <p className="text-gray-500 text-sm">{t.email}</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    {[
                      { icon: <BookOpen size={14} />, label: 'Classes', value: t.classes, color: 'text-brand-600' },
                      { icon: <GraduationCap size={14} />, label: 'Students', value: t.totalStudents, color: 'text-blue-600' },
                      { icon: <FileText size={14} />, label: 'Lessons', value: t.totalLessons, color: 'text-green-600' },
                      { icon: <TrendingUp size={14} />, label: 'Materials', value: t.totalMaterials, color: 'text-purple-600' },
                      { icon: <Trophy size={14} />, label: 'Avg Quiz %', value: t.avgScore !== null ? `${t.avgScore}%` : '—', color: t.avgScore !== null && t.avgScore >= 60 ? 'text-green-600' : 'text-yellow-600' },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className={`flex items-center justify-center gap-1 text-xs text-gray-500 mb-1`}>{item.icon} {item.label}</div>
                        <div className={`text-xl font-extrabold ${item.color}`}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
