import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function TeacherStudentsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'TEACHER') redirect('/login')

  const enrollments = await prisma.classStudent.findMany({
    where: { class: { teacherId: session.user.id } },
    include: {
      student: { select: { id: true, name: true, gradeLevel: true } },
      class: { select: { name: true } },
    },
  })

  const uniqueStudents = new Map<string, { name: string; gradeLevel: string | null; classes: string[] }>()
  for (const e of enrollments) {
    const s = uniqueStudents.get(e.student.id)
    if (s) s.classes.push(e.class.name)
    else uniqueStudents.set(e.student.id, { name: e.student.name, gradeLevel: e.student.gradeLevel, classes: [e.class.name] })
  }

  const students = Array.from(uniqueStudents.entries())

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Students</h1>

      <div className="card">
        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No students enrolled in your classes yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="pb-3 font-medium text-gray-500">Student</th>
                <th className="pb-3 font-medium text-gray-500">Grade</th>
                <th className="pb-3 font-medium text-gray-500">Enrolled In</th>
              </tr>
            </thead>
            <tbody>
              {students.map(([id, s]) => (
                <tr key={id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold text-xs">
                      {s.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{s.name}</span>
                  </td>
                  <td className="py-3 text-gray-500">{s.gradeLevel ?? '—'}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.classes.map(c => (
                        <span key={c} className="badge bg-brand-100 text-brand-700">{c}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
