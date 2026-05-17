import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AnnouncementBoard from '@/components/AnnouncementBoard'

export default async function AdminAnnouncementsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'SCHOOL_ADMIN') redirect('/login')

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">School Notice Board</h1>
      <div className="card">
        <AnnouncementBoard canPost />
      </div>
    </div>
  )
}
