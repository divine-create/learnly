import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { BookOpen, Users, FileText } from 'lucide-react'

export default async function AdminClassesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'SCHOOL_ADMIN') redirect('/login')

  const classes = await prisma.class.findMany({
    where: { schoolId: session.user.schoolId! },
    include: {
      teacher: { select: { name: true } },
      _count: { select: { students: true, lessons: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Classes</h1>

      {classes.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No classes yet. Teachers create classes from their dashboard.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div key={cls.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-xs text-gray-500">{cls.subject} · {cls.gradeLevel}</p>
                </div>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{cls.code}</span>
              </div>
              <div className="text-sm text-gray-600 mb-4">Teacher: {cls.teacher.name}</div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Users size={14} />{cls._count.students} students</span>
                <span className="flex items-center gap-1"><FileText size={14} />{cls._count.lessons} lessons</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
