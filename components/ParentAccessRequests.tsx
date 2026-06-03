'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ShieldQuestion, Check, X, Loader2 } from 'lucide-react'

interface LinkRequest {
  parentId: string
  childId: string
  parentName: string
  parentEmail: string
}

export default function ParentAccessRequests() {
  const [requests, setRequests] = useState<LinkRequest[]>([])
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/parent/requests')
      .then(r => (r.ok ? r.json() : []))
      .then((data: LinkRequest[]) => setRequests(data))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  async function decide(req: LinkRequest, action: 'approve' | 'reject') {
    setBusy(req.parentId)
    const res = await fetch('/api/parent/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId: req.parentId, childId: req.childId, action }),
    })
    setBusy(null)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Something went wrong')
      return
    }
    setRequests(prev => prev.filter(r => r.parentId !== req.parentId))
    toast.success(action === 'approve' ? `${req.parentName} can now see your progress` : 'Request declined')
  }

  if (!loaded || requests.length === 0) return null

  return (
    <div className="card mb-8 border-l-4 border-amber-400 bg-amber-50">
      <div className="flex items-center gap-2 mb-3">
        <ShieldQuestion size={20} className="text-amber-500" />
        <h3 className="font-semibold text-gray-800">Parent access requests</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        These people asked to follow your learning progress. Only approve people you know.
      </p>
      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.parentId} className="flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-3">
            <div className="min-w-0">
              <div className="font-medium text-gray-900 text-sm truncate">{req.parentName}</div>
              <div className="text-xs text-gray-500 truncate">{req.parentEmail}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => decide(req, 'approve')}
                disabled={busy === req.parentId}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-3 py-1.5 disabled:opacity-50"
              >
                {busy === req.parentId ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Approve
              </button>
              <button
                onClick={() => decide(req, 'reject')}
                disabled={busy === req.parentId}
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg px-3 py-1.5 disabled:opacity-50"
              >
                <X size={14} />
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
