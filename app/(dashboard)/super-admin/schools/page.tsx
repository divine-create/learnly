import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'

export default async function SuperAdminSchoolsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') redirect('/login')

  const schools = await prisma.school.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true, classes: true } } },
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Schools ({schools.length})</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">School</th>
              <th className="px-4 py-3 font-medium text-gray-500">Code</th>
              <th className="px-4 py-3 font-medium text-gray-500">Location</th>
              <th className="px-4 py-3 font-medium text-gray-500">Plan</th>
              <th className="px-4 py-3 font-medium text-gray-500">Users</th>
              <th className="px-4 py-3 font-medium text-gray-500">Classes</th>
              <th className="px-4 py-3 font-medium text-gray-500">Registered</th>
            </tr>
          </thead>
          <tbody>
            {schools.map(s => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3 font-mono text-xs bg-gray-100 rounded">{s.code}</td>
                <td className="px-4 py-3 text-gray-600">{s.lga}, {s.state}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${s.plan === 'institution' ? 'bg-brand-100 text-brand-700' : s.plan === 'growth' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {s.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{s._count.users}</td>
                <td className="px-4 py-3 text-gray-600">{s._count.classes}</td>
                <td className="px-4 py-3 text-gray-400">{formatDate(s.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
