import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Leaderboard from '@/components/Leaderboard'

export default async function LeaderboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'STUDENT') redirect('/login')

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏆 Leaderboard</h1>
        <p className="text-gray-500 mt-1">See who's earning the most XP in your school</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">🏫 School Ranking</h2>
          <Leaderboard scope="school" />
        </div>
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">🌍 Global Ranking</h2>
          <Leaderboard scope="global" />
        </div>
      </div>
    </div>
  )
}
