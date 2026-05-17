'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Plus, FileCode, Clock, Users, ChevronRight } from 'lucide-react'
import { formatDate, GRADE_LEVELS } from '@/lib/utils'

type Class = { id: string; name: string; gradeLevel: string; subject: string }
type Assignment = { id: string; title: string; dueDate: string; maxScore: number; language: string; class: { name: string }; _count: { submissions: number } }

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ classId: '', title: '', description: '', dueDate: '', maxScore: '100', language: 'python', starterCode: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/assignments').then(r => r.json()),
      fetch('/api/classes').then(r => r.json()),
    ]).then(([a, c]) => { setAssignments(a); setClasses(c); setLoading(false) })
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, maxScore: parseInt(form.maxScore) }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Assignment created!')
    setShowForm(false)
    setAssignments(prev => [data, ...prev])
    setForm({ classId: '', title: '', description: '', dueDate: '', maxScore: '100', language: 'python', starterCode: '' })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Assignment</button>
      </div>

      {showForm && (
        <div className="card mb-6 bg-brand-50 border-brand-200">
          <h2 className="font-semibold text-gray-900 mb-4">New Assignment</h2>
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Build a Calculator" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description / Instructions</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="What should students do?" />
            </div>
            <div>
              <label className="label">Class</label>
              <select className="input" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} required>
                <option value="">Select class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="datetime-local" className="input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
            </div>
            <div>
              <label className="label">Language</label>
              <select className="input" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                {['python', 'javascript', 'html', 'scratch'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Max Score</label>
              <input type="number" className="input" value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} min="1" max="100" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Starter Code (optional)</label>
              <textarea className="input font-mono text-sm" rows={4} value={form.starterCode} onChange={e => setForm({ ...form, starterCode: e.target.value })} placeholder="# Starter code for students…" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating…' : 'Create Assignment'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading…</div>
      ) : assignments.length === 0 ? (
        <div className="card text-center py-16">
          <FileCode size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No assignments yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => (
            <Link key={a.id} href={`/teacher/assignments/${a.id}`} className="card flex items-center justify-between hover:shadow-md transition-shadow group">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600">{a.title}</h3>
                <div className="flex gap-4 text-xs text-gray-500 mt-1">
                  <span>{a.class.name}</span>
                  <span className="font-mono bg-gray-100 px-1 rounded">{a.language}</span>
                  <span className="flex items-center gap-1"><Clock size={11} />Due: {formatDate(a.dueDate)}</span>
                  <span className="flex items-center gap-1"><Users size={11} />{a._count.submissions} submissions</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-brand-600" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
