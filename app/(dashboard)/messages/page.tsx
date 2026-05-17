'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Send, Mail, MailOpen, Inbox, PenSquare } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Message = { id: string; subject: string; content: string; isRead: boolean; createdAt: string; sender: { name: string; role: string }; recipient: { name: string; role: string } }
type User = { id: string; name: string; role: string }

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<Message | null>(null)
  const [view, setView] = useState<'inbox' | 'sent'>('inbox')
  const [showCompose, setShowCompose] = useState(false)
  const [contacts, setContacts] = useState<User[]>([])
  const [form, setForm] = useState({ recipientId: '', subject: '', content: '' })
  const [sending, setSending] = useState(false)

  useEffect(() => { fetchMessages() }, [view])
  useEffect(() => { fetch('/api/users').then(r => r.json()).then(setContacts) }, [])

  async function fetchMessages() {
    const res = await fetch(`/api/messages?inbox=${view === 'inbox'}`)
    setMessages(await res.json())
  }

  async function markRead(id: string) {
    await fetch(`/api/messages/${id}/read`, { method: 'POST' })
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m))
  }

  async function openMessage(msg: Message) {
    setSelected(msg)
    if (!msg.isRead && view === 'inbox') markRead(msg.id)
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSending(false)
    if (!res.ok) { toast.error('Failed to send'); return }
    toast.success('Message sent!')
    setShowCompose(false)
    setForm({ recipientId: '', subject: '', content: '' })
    if (view === 'sent') fetchMessages()
  }

  const unread = messages.filter(m => !m.isRead).length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <button onClick={() => setShowCompose(true)} className="btn-primary flex items-center gap-2"><PenSquare size={16} /> Compose</button>
      </div>

      {showCompose && (
        <div className="card mb-6 bg-brand-50 border-brand-200">
          <h2 className="font-semibold text-gray-900 mb-4">New Message</h2>
          <form onSubmit={send} className="space-y-3">
            <div>
              <label className="label">To</label>
              <select className="input" value={form.recipientId} onChange={e => setForm({ ...form, recipientId: e.target.value })} required>
                <option value="">Select recipient…</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.role.replace('_', ' ')})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject</label>
              <input className="input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required placeholder="What is this about?" />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea className="input" rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required placeholder="Write your message…" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2"><Send size={15} />{sending ? 'Sending…' : 'Send'}</button>
              <button type="button" onClick={() => setShowCompose(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Message list */}
        <div className="card lg:col-span-1">
          <div className="flex gap-1 mb-4">
            {(['inbox', 'sent'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${view === v ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {v} {v === 'inbox' && unread > 0 && <span className="ml-1 bg-white text-brand-600 text-xs px-1.5 py-0.5 rounded-full">{unread}</span>}
              </button>
            ))}
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Inbox size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No messages</p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${selected?.id === msg.id ? 'bg-brand-50 border border-brand-200' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {view === 'inbox' && (!msg.isRead ? <Mail size={14} className="text-brand-600 shrink-0" /> : <MailOpen size={14} className="text-gray-400 shrink-0" />)}
                      <span className={`text-sm truncate ${!msg.isRead && view === 'inbox' ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                        {view === 'inbox' ? msg.sender.name : msg.recipient.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(msg.createdAt)}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">{msg.subject}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="card flex flex-col items-center justify-center h-64 border-dashed">
              <Mail size={36} className="text-gray-300 mb-3" />
              <p className="text-gray-400">Select a message to read</p>
            </div>
          ) : (
            <div className="card">
              <h2 className="font-bold text-gray-900 text-lg mb-1">{selected.subject}</h2>
              <div className="text-sm text-gray-500 mb-4">
                <span>From: {selected.sender.name}</span>
                <span className="mx-2">·</span>
                <span>To: {selected.recipient.name}</span>
                <span className="mx-2">·</span>
                <span>{formatDate(selected.createdAt)}</span>
              </div>
              <div className="text-gray-700 whitespace-pre-wrap border-t border-gray-100 pt-4">{selected.content}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
