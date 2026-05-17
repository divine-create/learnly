'use client'
import { useState, useEffect } from 'react'
import { AlertTriangle, MessageSquare, TrendingDown } from 'lucide-react'

type Class = { id: string; name: string }
type Alert = { studentId: string; name: string; gradeLevel: string | null; avgScore: number; quizzesFailed: number; repeatedlyAsking: boolean; severity: 'high' | 'medium' }

export default function StruggleAlertsPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selected, setSelected] = useState('')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/classes').then(r => r.json()).then(setClasses) }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/struggle-alerts?classId=${selected}`).then(r => r.json()).then(d => { setAlerts(d); setLoading(false) })
  }, [selected])

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Struggle Alerts</h1>
          <p className="text-gray-500 text-sm">Students who need extra attention based on their performance</p>
        </div>
      </div>

      <div className="card mb-6">
        <label className="label">Select Class</label>
        <select className="input max-w-xs" value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Choose a class…</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading && <div className="text-center py-8 text-gray-400">Analysing student data…</div>}

      {!loading && selected && alerts.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="font-semibold text-gray-700">All students are performing well!</h3>
          <p className="text-gray-500 text-sm mt-1">No struggling students detected in this class.</p>
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card bg-red-50 border-red-200 text-center">
              <div className="text-2xl font-bold text-red-700">{alerts.filter(a => a.severity === 'high').length}</div>
              <div className="text-sm text-red-600">High Priority</div>
            </div>
            <div className="card bg-yellow-50 border-yellow-200 text-center">
              <div className="text-2xl font-bold text-yellow-700">{alerts.filter(a => a.severity === 'medium').length}</div>
              <div className="text-sm text-yellow-600">Needs Attention</div>
            </div>
          </div>

          <div className="space-y-3">
            {alerts.sort((a, b) => (a.severity === 'high' ? -1 : 1)).map(alert => (
              <div key={alert.studentId} className={`card border-2 ${alert.severity === 'high' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.severity === 'high' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                    <TrendingDown size={20} className={alert.severity === 'high' ? 'text-red-600' : 'text-yellow-600'} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{alert.name}</h3>
                      <span className={`badge ${alert.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'} capitalize`}>{alert.severity} priority</span>
                      {alert.repeatedlyAsking && (
                        <span className="badge bg-blue-100 text-blue-700 flex items-center gap-1">
                          <MessageSquare size={11} />Asks tutor repeatedly
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{alert.gradeLevel}</p>
                    <div className="flex gap-4 text-sm mt-2">
                      <span className="text-red-700 font-medium">Avg Score: {alert.avgScore}%</span>
                      <span className="text-gray-600">{alert.quizzesFailed} quiz attempt{alert.quizzesFailed > 1 ? 's' : ''} below 50%</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400 shrink-0">
                    <div className="font-bold text-2xl text-red-600">{alert.avgScore}%</div>
                    <div>average</div>
                  </div>
                </div>

                <div className={`mt-3 pt-3 border-t ${alert.severity === 'high' ? 'border-red-200' : 'border-yellow-200'}`}>
                  <p className="text-sm font-medium text-gray-700">Suggested actions:</p>
                  <ul className="text-sm text-gray-600 mt-1 space-y-0.5 list-disc list-inside">
                    {alert.avgScore < 30 && <li>Consider a one-on-one session with this student</li>}
                    <li>Review which quiz questions they're getting wrong</li>
                    {alert.repeatedlyAsking && <li>Check what topics they keep asking Cody about</li>}
                    <li>Send a message to their parent via the platform</li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
