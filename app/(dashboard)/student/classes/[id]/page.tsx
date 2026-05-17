import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ArrowLeft, BookOpen, FileText, Trophy, CheckCircle, Lock } from 'lucide-react'

export default async function StudentClassPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'STUDENT') redirect('/login')

  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: {
      teacher: { select: { name: true } },
      lessons: {
        where: { isPublished: true },
        orderBy: { orderIndex: 'asc' },
        include: {
          materials: { select: { id: true, fileName: true, status: true } },
          quizzes: { where: { status: 'published' }, include: { _count: { select: { questions: true } } } },
          progress: {
            where: { studentId: session.user.id },
          },
        },
      },
    },
  })

  if (!cls) redirect('/student/classes')

  const completedCount = cls.lessons.filter(l => l.progress[0]?.completed).length

  return (
    <div className="p-6 md:p-8">
      <Link href="/student/classes" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={16} /> Back to classes
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl p-6 text-white mb-6">
        <h1 className="text-2xl font-extrabold mb-1">{cls.name}</h1>
        <p className="text-white/80">{cls.subject} · {cls.gradeLevel}</p>
        <p className="text-white/70 text-sm mt-1">Teacher: {cls.teacher.name}</p>
        {cls.lessons.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>{completedCount} of {cls.lessons.length} lessons done</span>
              <span>{Math.round((completedCount / cls.lessons.length) * 100)}%</span>
            </div>
            <div className="bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-full"
                style={{ width: `${(completedCount / cls.lessons.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lessons */}
      <h2 className="font-bold text-gray-900 text-lg mb-4">Lessons</h2>

      {cls.lessons.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-3">📖</div>
          <p className="text-gray-500">Your teacher hasn't published any lessons yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cls.lessons.map((lesson, i) => {
            const completed = lesson.progress[0]?.completed
            const hasQuiz = lesson.quizzes.length > 0

            return (
              <div key={lesson.id} className={`card border-2 transition-all ${completed ? 'border-green-200 bg-green-50' : 'border-gray-100 hover:border-brand-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      completed ? 'bg-green-500 text-white' : 'bg-brand-100 text-brand-600'
                    }`}>
                      {completed ? <CheckCircle size={20} /> : i + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{lesson.title}</h3>
                      <p className="text-sm text-gray-500">{lesson.topic}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {lesson.materials.length > 0 && (
                          <span className="badge bg-blue-100 text-blue-700 flex items-center gap-1">
                            <FileText size={11} />{lesson.materials.length} file{lesson.materials.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {hasQuiz && (
                          <span className="badge bg-yellow-100 text-yellow-700 flex items-center gap-1">
                            <Trophy size={11} />Quiz available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link href={`/student/learn/${lesson.id}`} className="btn-primary text-xs px-3 py-1.5">
                      {completed ? 'Review' : 'Learn'}
                    </Link>
                    {hasQuiz && (
                      <Link href={`/student/quiz/${lesson.quizzes[0].id}`} className="btn-secondary text-xs px-3 py-1.5 text-center">
                        Take Quiz
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
