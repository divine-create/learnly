'use client'
import { useState, useEffect } from 'react'
import { Megaphone, Plus, X, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

type Announcement = { id: string; title: string; content: string; priority: string; createdAt: string; author: { name: string; role: string }; class?: { name: string } | null }

interface Props { classId?: string; canPost?: boolean }

export default function AnnouncementBoard({ classId, canPost = false }: Props) {
  const [items, setItems] = useState<Announcement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const params = classId ? `?classId=${classId}` : ''
    fetch(`/api/announcements${params}`).then(r => r.json()).then(setItems)
  }, [classId])

  async function post(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, classId }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Failed to post'); return }
    toast.success('Announcement posted!')
    setShowForm(false)
    setForm({ title: '', content: '', priority: 'normal' })
    const data = await res.json()
    setItems(prev => [data, ...prev])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Megaphone size={18} className="text-brand-600" /> Announcements
        </h3>
        {canPost && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
            <Plus size={13} /> Post
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4">
          <form onSubmit={post} className="space-y-3">
            <input className="input text-sm" placeholder="Announcement title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <textarea className="input text-sm" rows={3} placeholder="Message content…" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
            <div className="flex gap-2">
              {['normal', 'urgent'].map(p => (
                <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize border transition-colors ${form.priority === p ? (p === 'urgent' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-brand-100 border-brand-300 text-brand-700') : 'border-gray-200 text-gray-500'}`}>
                  {p === 'urgent' && <AlertTriangle size={11} className="inline mr-1" />}{p}
                </button>
              ))}
              <div className="flex-1" />
              <button type="submit" disabled={saving} className="btn-primary text-xs px-3">{saving ? 'Posting…' : 'Post'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs px-3">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">No announcements yet</p>
      ) : (
        <div className="space-y-3">
          {items.map(a => (
            <div key={a.id} className={`p-4 rounded-xl border ${a.priority === 'urgent' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
              <div className="flex items-start gap-2">
                {a.priority === 'urgent' && <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm">{a.title}</div>
                  <p className="text-gray-600 text-sm mt-1">{a.content}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    {a.author.name} · {formatDate(a.createdAt)} {a.class && `· ${a.class.name}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
