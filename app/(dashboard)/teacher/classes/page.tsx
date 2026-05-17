import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { BookOpen, Users, Plus, ArrowRight, FileText } from 'lucide-react'

export default async function TeacherClassesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'TEACHER') redirect('/login')

  const classes = await prisma.class.findMany({
    where: { teacherId: session.user.id },
    include: {
      _count: { select: { students: true, lessons: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const COLORS = ['from-purple-500 to-indigo-600', 'from-blue-500 to-cyan-600', 'from-green-500 to-teal-600', 'from-orange-500 to-red-600', 'from-pink-500 to-rose-600']

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
        <Link href="/teacher/classes/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Class
        </Link>
      </div>

      {classes.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen size={56} className="mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-700 mb-2">No classes yet</h3>
          <p className="text-gray-500 text-sm mb-6">Create your first class to start uploading lessons and teaching students.</p>
          <Link href="/teacher/classes/new" className="btn-primary">Create First Class</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls, i) => (
            <Link key={cls.id} href={`/teacher/classes/${cls.id}`} className="group block">
              <div className="card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5">
                <div className={`h-3 bg-gradient-to-r ${COLORS[i % COLORS.length]} -mx-6 -mt-6 mb-5`} />
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{cls.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{cls.subject} · {cls.gradeLevel}</p>
                  </div>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{cls.code}</span>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><Users size={14} />{cls._count.students}</span>
                  <span className="flex items-center gap-1.5"><FileText size={14} />{cls._count.lessons} lessons</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-brand-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open class <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}

          <Link href="/teacher/classes/new" className="card border-2 border-dashed border-gray-200 hover:border-brand-300 flex flex-col items-center justify-center py-12 text-gray-400 hover:text-brand-600 transition-colors group">
            <Plus size={32} className="mb-2" />
            <span className="font-medium text-sm">New Class</span>
          </Link>
        </div>
      )}
    </div>
  )
}
