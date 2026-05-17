import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import StatCard from '@/components/StatCard'
import { School, Users, BookOpen, Trophy, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function SuperAdminPage() {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') redirect('/login')

  const [schoolCount, userCount, classCount, quizCount, recentSchools] = await Promise.all([
    prisma.school.count(),
    prisma.user.count(),
    prisma.class.count(),
    prisma.quizAttempt.count(),
    prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { _count: { select: { users: true, classes: true } } },
    }),
  ])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-500 mt-1">CodeBridge Nigeria · Super Admin</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Schools" value={schoolCount} icon={<School size={22} />} color="bg-brand-100 text-brand-600" />
        <StatCard label="Total Users" value={userCount} icon={<Users size={22} />} color="bg-blue-100 text-blue-600" />
        <StatCard label="Classes" value={classCount} icon={<BookOpen size={22} />} color="bg-green-100 text-green-600" />
        <StatCard label="Quiz Attempts" value={quizCount} icon={<Trophy size={22} />} color="bg-yellow-100 text-yellow-600" />
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Registered Schools</h2>
        {recentSchools.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No schools registered yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="pb-3 font-medium text-gray-500">School</th>
                <th className="pb-3 font-medium text-gray-500">Code</th>
                <th className="pb-3 font-medium text-gray-500">State</th>
                <th className="pb-3 font-medium text-gray-500">Plan</th>
                <th className="pb-3 font-medium text-gray-500">Users</th>
                <th className="pb-3 font-medium text-gray-500">Registered</th>
              </tr>
            </thead>
            <tbody>
              {recentSchools.map(school => (
                <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{school.name}</td>
                  <td className="py-3 font-mono text-xs bg-gray-100 px-1 rounded text-gray-600">{school.code}</td>
                  <td className="py-3 text-gray-600">{school.state}</td>
                  <td className="py-3">
                    <span className={`badge ${
                      school.plan === 'institution' ? 'bg-brand-100 text-brand-700' :
                      school.plan === 'growth' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{school.plan}</span>
                  </td>
                  <td className="py-3 text-gray-600">{school._count.users}</td>
                  <td className="py-3 text-gray-400">{formatDate(school.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
