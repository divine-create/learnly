import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import StatCard from '@/components/StatCard'
import Link from 'next/link'
import { Users, BookOpen, GraduationCap, Trophy, Plus, ArrowRight, BarChart2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function AdminDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'SCHOOL_ADMIN') redirect('/login')

  const schoolId = session.user.schoolId!

  const [students, teachers, classes, quizAttempts, recentClasses, school] = await Promise.all([
    prisma.user.count({ where: { schoolId, role: 'STUDENT' } }),
    prisma.user.count({ where: { schoolId, role: 'TEACHER' } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.quizAttempt.count({ where: { quiz: { school: { id: schoolId } } } }),
    prisma.class.findMany({
      where: { schoolId },
      include: {
        teacher: { select: { name: true } },
        _count: { select: { students: true, lessons: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.school.findUnique({ where: { id: schoolId } }),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Dashboard</h1>
          <p className="text-gray-500 mt-1">{school?.name} · Code: <span className="font-mono font-bold text-brand-600">{school?.code}</span></p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/teachers" className="btn-secondary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Teacher
          </Link>
          <Link href="/admin/students" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Student
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Students" value={students} icon={<Users size={22} />} color="bg-blue-100 text-blue-600" />
        <StatCard label="Teachers" value={teachers} icon={<GraduationCap size={22} />} color="bg-brand-100 text-brand-600" />
        <StatCard label="Classes" value={classes} icon={<BookOpen size={22} />} color="bg-green-100 text-green-600" />
        <StatCard label="Quiz Attempts" value={quizAttempts} icon={<Trophy size={22} />} color="bg-yellow-100 text-yellow-600" />
      </div>

      {/* Onboarding checklist */}
      {(teachers === 0 || students === 0 || classes === 0) && (
        <div className="card border-brand-200 bg-brand-50 mb-8">
          <h2 className="font-semibold text-brand-900 mb-4">🚀 Getting started checklist</h2>
          <div className="space-y-3">
            {[
              { done: teachers > 0, label: 'Invite your first teacher', href: '/admin/teachers', cta: 'Add Teacher' },
              { done: students > 0, label: 'Add students to your school', href: '/admin/students', cta: 'Add Students' },
              { done: classes > 0, label: 'Teachers create their first class', href: '/admin/classes', cta: 'View Classes' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${item.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {item.done ? '✓' : '?'}
                  </div>
                  <span className={`text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.label}</span>
                </div>
                {!item.done && (
                  <Link href={item.href} className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
                    {item.cta} <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent classes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Classes</h2>
          <Link href="/admin/classes" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recentClasses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p>No classes yet. Teachers can create classes from their dashboard.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentClasses.map(cls => (
              <div key={cls.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{cls.name}</div>
                  <div className="text-xs text-gray-500">{cls.gradeLevel} · {cls.subject} · Teacher: {cls.teacher.name}</div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>{cls._count.students} students</div>
                  <div>{cls._count.lessons} lessons</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
