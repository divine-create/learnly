'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { UserPlus, Loader2 } from 'lucide-react'

export default function LinkChildForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function link(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/parent/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childEmail: email }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error); return }
    toast.success(`Linked to ${data.child.name}! Refresh to see their dashboard.`)
    setEmail('')
    // Reload to show the child's data
    setTimeout(() => window.location.reload(), 1500)
  }

  return (
    <form onSubmit={link} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your child's school email"
        required
        className="input flex-1"
      />
      <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 whitespace-nowrap">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
        Link Child
      </button>
    </form>
  )
}
