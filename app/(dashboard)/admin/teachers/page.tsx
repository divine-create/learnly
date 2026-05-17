'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, GraduationCap, Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Teacher = { id: string; name: string; email: string; createdAt: string }

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchTeachers() }, [])

  async function fetchTeachers() {
    const res = await fetch('/api/users?role=TEACHER')
    const data = await res.json()
    setTeachers(data)
    setLoading(false)
  }

  async function addTeacher(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role: 'TEACHER' }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Teacher added!')
    setShowForm(false)
    setForm({ name: '', email: '', password: '' })
    fetchTeachers()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 text-sm mt-1">{teachers.length} teacher{teachers.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 border-brand-200 bg-brand-50">
          <h2 className="font-semibold text-gray-900 mb-4">New Teacher Account</h2>
          <form onSubmit={addTeacher} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Mrs. Adaeze Okonkwo" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="teacher@school.ng" />
            </div>
            <div>
              <label className="label">Temporary Password</label>
              <input type="password" className="input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} placeholder="Min 6 chars" />
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Adding…' : 'Add Teacher'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading…</div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No teachers yet. Add your first teacher above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="pb-3 font-medium text-gray-500">Name</th>
                <th className="pb-3 font-medium text-gray-500">Email</th>
                <th className="pb-3 font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                      {t.name.charAt(0)}
                    </div>
                    {t.name}
                  </td>
                  <td className="py-3 text-gray-600 flex items-center gap-1">
                    <Mail size={12} className="text-gray-400" />{t.email}
                  </td>
                  <td className="py-3 text-gray-400">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
