'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, Calendar, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Term = { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean }

export default function TermsPage() {
  const [terms, setTerms] = useState<Term[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch('/api/terms').then(r => r.json()).then(setTerms) }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Term saved!')
    setTerms(prev => [data, ...prev])
    setShowForm(false)
    setForm({ name: '', startDate: '', endDate: '', isCurrent: false })
  }

  async function setCurrent(id: string) {
    await fetch('/api/terms', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isCurrent: true }) })
    setTerms(prev => prev.map(t => ({ ...t, isCurrent: t.id === id })))
    toast.success('Current term updated!')
  }

  const TERM_NAMES = ['First Term', 'Second Term', 'Third Term']

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Term / Academic Calendar</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Term</button>
      </div>

      {showForm && (
        <div className="card mb-6 bg-brand-50 border-brand-200">
          <h2 className="font-semibold text-gray-900 mb-4">New Term</h2>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Term Name</label>
              <select className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required>
                <option value="">Select…</option>
                {TERM_NAMES.map(n => <option key={n}>{n} {new Date().getFullYear()}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date</label>
                <input type="date" className="input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" className="input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.isCurrent} onChange={e => setForm({ ...form, isCurrent: e.target.checked })} />
              Set as current term
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Term'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {terms.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No terms set up yet. Add your first term above.</p>
          </div>
        ) : terms.map(term => (
          <div key={term.id} className={`card flex items-center justify-between ${term.isCurrent ? 'border-2 border-brand-400 bg-brand-50' : ''}`}>
            <div className="flex items-center gap-3">
              {term.isCurrent && <CheckCircle size={20} className="text-brand-600 shrink-0" />}
              <div>
                <div className="font-semibold text-gray-900">{term.name}</div>
                <div className="text-sm text-gray-500">{formatDate(term.startDate)} — {formatDate(term.endDate)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {term.isCurrent ? (
                <span className="badge bg-brand-100 text-brand-700">Current</span>
              ) : (
                <button onClick={() => setCurrent(term.id)} className="btn-secondary text-xs py-1">Set Current</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
