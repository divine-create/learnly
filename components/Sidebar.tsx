'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, Users, BarChart2, School,
  GraduationCap, UserCheck, LogOut, Trophy, Brain,
  ChevronRight, Mail, Zap, Layers, ClipboardList,
  CalendarCheck, BookMarked, AlertTriangle, Wand2,
  FileUp, Clock, Calendar, Award, FileText, Timer,
  NotebookPen, Monitor, BarChart, CreditCard,
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
    { href: '/admin/terms', label: 'Academic Terms', icon: <Calendar size={18} /> },
    { href: '/admin/announcements', label: 'Announcements', icon: <Layers size={18} /> },
    { href: '/admin/bulk-import', label: 'Bulk Import', icon: <FileUp size={18} /> },
    { href: '/admin/teacher-performance', label: 'Teacher Stats', icon: <BarChart size={18} /> },
    { href: '/admin/reports', label: 'Reports', icon: <BarChart2 size={18} /> },
    { href: '/admin/billing', label: 'Billing', icon: <CreditCard size={18} /> },
    { href: '/messages', label: 'Messages', icon: <Mail size={18} /> },
  ],
  TEACHER: [
    { href: '/teacher', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/teacher/classes', label: 'My Classes', icon: <BookOpen size={18} /> },
    { href: '/teacher/students', label: 'Students', icon: <Users size={18} /> },
    { href: '/teacher/quizzes', label: 'Quizzes', icon: <Trophy size={18} /> },
    { href: '/teacher/assignments', label: 'Assignments', icon: <ClipboardList size={18} /> },
    { href: '/teacher/attendance', label: 'Attendance', icon: <CalendarCheck size={18} /> },
    { href: '/teacher/gradebook', label: 'Grade Book', icon: <BookMarked size={18} /> },
    { href: '/teacher/struggle-alerts', label: 'Struggle Alerts', icon: <AlertTriangle size={18} /> },
    { href: '/teacher/lesson-planner', label: 'Lesson Planner', icon: <Wand2 size={18} /> },
    { href: '/messages', label: 'Messages', icon: <Mail size={18} /> },
  ],
  STUDENT: [
    { href: '/student', label: 'Home', icon: <LayoutDashboard size={18} /> },
    { href: '/student/classes', label: 'My Classes', icon: <BookOpen size={18} /> },
    { href: '/student/assignments', label: 'Assignments', icon: <ClipboardList size={18} /> },
    { href: '/student/tutor', label: 'Ask Cody', icon: <Brain size={18} /> },
    { href: '/student/daily-challenge', label: 'Daily Challenge', icon: <Zap size={18} /> },
    { href: '/student/leaderboard', label: 'Leaderboard', icon: <Trophy size={18} /> },
    { href: '/student/badges', label: 'Badges & XP', icon: <Award size={18} /> },
    { href: '/student/certificates', label: 'Certificates', icon: <FileText size={18} /> },
    { href: '/student/exam-countdown', label: 'Exam Countdown', icon: <Timer size={18} /> },
    { href: '/student/notes', label: 'Study Notes', icon: <NotebookPen size={18} /> },
    { href: '/messages', label: 'Messages', icon: <Mail size={18} /> },
  ],
  PARENT: [
    { href: '/parent', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { href: '/parent/progress', label: "Child's Progress", icon: <BarChart2 size={18} /> },
    { href: '/parent/report-card', label: 'Report Card', icon: <FileText size={18} /> },
    { href: '/parent/screen-time', label: 'Screen Time', icon: <Monitor size={18} /> },
    { href: '/parent/attendance', label: 'Attendance', icon: <CalendarCheck size={18} /> },
    { href: '/messages', label: 'Messages', icon: <Mail size={18} /> },
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
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/messages' && item.href !== '/' && pathname.startsWith(item.href + '/'))
            || pathname === item.href
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
