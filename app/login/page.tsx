'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Eye, EyeOff, BookOpen } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { role: 'Super Admin', email: 'super@codebridge.ng', password: 'super123', color: 'bg-red-100 text-red-700 border-red-200' },
  { role: 'School Admin', email: 'admin@greenfield.ng', password: 'admin123', color: 'bg-brand-100 text-brand-700 border-brand-200' },
  { role: 'Teacher', email: 'teacher@greenfield.ng', password: 'teacher123', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { role: 'Student', email: 'student@greenfield.ng', password: 'student123', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { role: 'Parent', email: 'parent@gmail.com', password: 'parent123', color: 'bg-green-100 text-green-700 border-green-200' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)

    if (res?.error) {
      toast.error('Invalid email or password')
      return
    }

    toast.success('Welcome back!')
    // Fetch session to determine redirect
    const sessionRes = await fetch('/api/auth/session')
    const session = await sessionRes.json()
    const roleRedirects: Record<string, string> = {
      SUPER_ADMIN: '/super-admin',
      SCHOOL_ADMIN: '/admin',
      TEACHER: '/teacher',
      STUDENT: '/student',
      PARENT: '/parent',
    }
    router.push(roleRedirects[session?.user?.role] ?? '/')
    router.refresh()
  }

  function fillDemo(acc: typeof DEMO_ACCOUNTS[0]) {
    setEmail(acc.email)
    setPassword(acc.password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CodeBridge Nigeria</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600 text-sm mt-1">Sign in to your school dashboard</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@school.edu.ng"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            New school?{' '}
            <Link href="/register" className="text-brand-600 font-medium hover:underline">Register here</Link>
          </div>
        </div>

        {/* Demo accounts */}
        <div className="mt-6">
          <p className="text-xs text-center text-gray-500 mb-3 font-medium uppercase tracking-wide">Demo accounts — click to fill</p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.role}
                onClick={() => fillDemo(acc)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition-opacity hover:opacity-80 ${acc.color}`}
              >
                <span className="font-semibold">{acc.role}</span>
                <span className="ml-2 opacity-70">{acc.email}</span>
                <span className="ml-2 opacity-50">/ {acc.password}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
