'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { GRADE_LEVELS, SUBJECTS } from '@/lib/utils'

export default function NewClassPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', gradeLevel: '', subject: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Class created!')
    router.push(`/teacher/classes/${data.id}`)
  }

  return (
    <div className="p-8 max-w-xl">
      <Link href="/teacher/classes" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft size={16} /> Back to classes
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
          <BookOpen size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Class</h1>
          <p className="text-gray-500 text-sm">Set up a class and start adding lessons</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Class Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              required
              placeholder="e.g. Python for Beginners — JSS 2"
            />
          </div>
          <div>
            <label className="label">Grade Level *</label>
            <select className="input" value={form.gradeLevel} onChange={e => setForm({...form, gradeLevel: e.target.value})} required>
              <option value="">Select grade…</option>
              {GRADE_LEVELS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subject *</label>
            <select className="input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required>
              <option value="">Select subject…</option>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
              {loading ? 'Creating…' : 'Create Class'}
            </button>
            <Link href="/teacher/classes" className="btn-secondary flex-1 py-2.5 text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
