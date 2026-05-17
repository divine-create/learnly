import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Trophy, CheckCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function TeacherQuizzesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'TEACHER') redirect('/login')

  const quizzes = await prisma.quiz.findMany({
    where: { lesson: { class: { teacherId: session.user.id } } },
    include: {
      lesson: { select: { title: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Quizzes</h1>

      {quizzes.length === 0 ? (
        <div className="card text-center py-16">
          <Trophy size={56} className="mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-700 mb-2">No quizzes yet</h3>
          <p className="text-gray-500 text-sm">Go to a lesson and click "Gen Quiz" to auto-generate a quiz with AI.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left bg-gray-50">
                <th className="px-4 py-3 font-medium text-gray-500">Quiz</th>
                <th className="px-4 py-3 font-medium text-gray-500">Lesson</th>
                <th className="px-4 py-3 font-medium text-gray-500">Questions</th>
                <th className="px-4 py-3 font-medium text-gray-500">Attempts</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map(q => (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{q.title}</td>
                  <td className="px-4 py-3 text-gray-600">{q.lesson.title}</td>
                  <td className="px-4 py-3 text-gray-600">{q._count.questions}</td>
                  <td className="px-4 py-3 text-gray-600">{q._count.attempts}</td>
                  <td className="px-4 py-3">
                    <span className={`badge flex items-center gap-1 w-fit ${q.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {q.status === 'published' ? <CheckCircle size={11} /> : <Clock size={11} />}
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(q.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
