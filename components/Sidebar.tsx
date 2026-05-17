'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, Users, Settings,
  LogOut, Trophy, Brain, BarChart2, School,
  GraduationCap, UserCheck, ChevronRight,
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: React.ReactNode }

const NAV: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { href: '/super-admin', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { href: '/super-admin/schools', label: 'Schools', icon: <School size={18} /> },
    { href: '/super-admin/users', label: 'All Users', icon: <Users size={18} /> },
  ],
  SCHOOL_ADMIN: [
    { href: '/admin', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { href: '/admin/teachers', label: 'Teachers', icon: <GraduationCap size={18} /> },
    { href: '/admin/students', label: 'Students', icon: <UserCheck size={18} /> },
    { href: '/admin/classes', label: 'Classes', icon: <BookOpen size={18} /> },
    { href: '/admin/reports', label: 'Reports', icon: <BarChart2 size={18} /> },
  ],
  TEACHER: [
    { href: '/teacher', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/teacher/classes', label: 'My Classes', icon: <BookOpen size={18} /> },
    { href: '/teacher/students', label: 'Students', icon: <Users size={18} /> },
    { href: '/teacher/quizzes', label: 'Quizzes', icon: <Trophy size={18} /> },
  ],
  STUDENT: [
    { href: '/student', label: 'Home', icon: <LayoutDashboard size={18} /> },
    { href: '/student/classes', label: 'My Classes', icon: <BookOpen size={18} /> },
    { href: '/student/tutor', label: 'Ask Cody', icon: <Brain size={18} /> },
    { href: '/student/badges', label: 'Badges & XP', icon: <Trophy size={18} /> },
  ],
  PARENT: [
    { href: '/parent', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { href: '/parent/progress', label: "Child's Progress", icon: <BarChart2 size={18} /> },
  ],
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-600',
  SCHOOL_ADMIN: 'bg-brand-600',
  TEACHER: 'bg-blue-600',
  STUDENT: 'bg-yellow-500',
  PARENT: 'bg-green-600',
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  SCHOOL_ADMIN: 'School Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
}

interface Props {
  role: string
  userName: string
  schoolName?: string | null
}

export default function Sidebar({ role, userName, schoolName }: Props) {
  const pathname = usePathname()
  const navItems = NAV[role] ?? []
  const color = ROLE_COLORS[role] ?? 'bg-brand-600'

  return (
    <aside className="w-64 min-h-screen bg-gray-900 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">CB</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">CodeBridge</div>
            <div className="text-gray-400 text-xs">Nigeria</div>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-800">
        <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-white font-bold text-sm mb-2`}>
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="text-white font-medium text-sm truncate">{userName}</div>
        <div className="text-gray-400 text-xs">{ROLE_LABELS[role]}</div>
        {schoolName && <div className="text-gray-500 text-xs mt-0.5 truncate">{schoolName}</div>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
