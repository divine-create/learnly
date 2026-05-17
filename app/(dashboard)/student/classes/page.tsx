'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { BookOpen, Plus, ArrowRight } from 'lucide-react'

type Class = { id: string; name: string; subject: string; gradeLevel: string; code: string; teacher: { name: string }; _count: { students: number; lessons: number } }

const GRADIENTS = [
  'from-purple-500 to-indigo-600',
  'from-orange-400 to-pink-500',
  'from-green-400 to-teal-500',
  'from-blue-400 to-cyan-500',
  'from-red-400 to-orange-500',
  'from-pink-400 to-rose-500',
]

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showJoin, setShowJoin] = useState(false)
  const [classCode, setClassCode] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => { fetchClasses() }, [])

  async function fetchClasses() {
    const res = await fetch('/api/classes')
    setClasses(await res.json())
    setLoading(false)
  }

  async function joinClass(e: React.FormEvent) {
    e.preventDefault()
    setJoining(true)
    // Find class by code
    const res = await fetch(`/api/classes/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: classCode }),
    })
    const data = await res.json()
    setJoining(false)
    if (!res.ok) { toast.error(data.error ?? 'Invalid class code'); return }
    toast.success('Joined class! 🎉')
    setShowJoin(false)
    setClassCode('')
    fetchClasses()
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
        <button onClick={() => setShowJoin(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Join Class
        </button>
      </div>

      {showJoin && (
        <div className="card mb-6 bg-brand-50 border-brand-200">
          <h2 className="font-semibold text-gray-900 mb-3">Join a Class</h2>
          <form onSubmit={joinClass} className="flex gap-3">
            <input
              className="input flex-1"
              value={classCode}
              onChange={e => setClassCode(e.target.value.toUpperCase())}
              required
              placeholder="Enter class code (e.g. ABCD12)"
              maxLength={8}
            />
            <button type="submit" disabled={joining} className="btn-primary whitespace-nowrap">
              {joining ? 'Joining…' : 'Join'}
            </button>
            <button type="button" onClick={() => setShowJoin(false)} className="btn-secondary">Cancel</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎒</div>
          <h3 className="font-bold text-gray-700 text-xl mb-2">No classes yet!</h3>
          <p className="text-gray-500 mb-6">Ask your teacher for the class code to join your first class.</p>
          <button onClick={() => setShowJoin(true)} className="btn-primary">Join a Class</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls, i) => (
            <Link key={cls.id} href={`/student/classes/${cls.id}`} className="group block">
              <div className={`bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} rounded-2xl p-6 text-white hover:shadow-xl hover:-translate-y-1 transition-all`}>
                <div className="text-4xl mb-3">📚</div>
                <h3 className="font-extrabold text-xl mb-1">{cls.name}</h3>
                <p className="text-white/80 text-sm">{cls.subject}</p>
                <p className="text-white/70 text-xs mt-1">{cls.gradeLevel} · {cls.teacher.name}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-white/70 text-xs">{cls._count.lessons} lessons</span>
                  <span className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1">
                    Open <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
