'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, UserCheck } from 'lucide-react'
import { GRADE_LEVELS, formatDate } from '@/lib/utils'

type Student = { id: string; name: string; email: string; gradeLevel: string | null; createdAt: string }

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', gradeLevel: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchStudents() }, [])

  async function fetchStudents() {
    const res = await fetch('/api/users?role=STUDENT')
    setStudents(await res.json())
    setLoading(false)
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role: 'STUDENT' }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Student added!')
    setShowForm(false)
    setForm({ name: '', email: '', password: '', gradeLevel: '' })
    fetchStudents()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-1">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Student
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 border-brand-200 bg-brand-50">
          <h2 className="font-semibold text-gray-900 mb-4">New Student Account</h2>
          <form onSubmit={addStudent} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Chidi Okafor" />
            </div>
            <div>
              <label className="label">Email / School ID</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="chidi@greenfield.ng" />
            </div>
            <div>
              <label className="label">Grade Level</label>
              <select className="input" value={form.gradeLevel} onChange={e => setForm({...form, gradeLevel: e.target.value})} required>
                <option value="">Select grade…</option>
                {GRADE_LEVELS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Temporary Password</label>
              <input type="password" className="input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Adding…' : 'Add Student'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading…</div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No students yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="pb-3 font-medium text-gray-500">Student</th>
                <th className="pb-3 font-medium text-gray-500">Grade</th>
                <th className="pb-3 font-medium text-gray-500">Email</th>
                <th className="pb-3 font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold text-xs">
                      {s.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{s.name}</span>
                  </td>
                  <td className="py-3">
                    <span className="badge bg-brand-100 text-brand-700">{s.gradeLevel ?? '—'}</span>
                  </td>
                  <td className="py-3 text-gray-600">{s.email}</td>
                  <td className="py-3 text-gray-400">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
