import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import ScreenTimeTracker from '@/components/ScreenTimeTracker'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={session.user.role}
        userName={session.user.name ?? 'User'}
        schoolName={session.user.schoolName}
      />
      <main className="flex-1 overflow-auto">
        {session.user.role === 'STUDENT' && <ScreenTimeTracker />}
        {children}
      </main>
    </div>
  )
}
