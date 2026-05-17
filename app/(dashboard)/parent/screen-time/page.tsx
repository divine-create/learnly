'use client'
import { useState, useEffect } from 'react'
import { Monitor, Clock, TrendingUp, AlertCircle } from 'lucide-react'

type Child = { id: string; name: string }
type ScreenTimeEntry = { date: string; minutes: number }

export default function ScreenTimePage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selected, setSelected] = useState('')
  const [data, setData] = useState<ScreenTimeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [dailyLimit, setDailyLimit] = useState(120)

  useEffect(() => {
    fetch('/api/parent/children').then(r => r.json()).then(d => {
      setChildren(d)
      if (d.length > 0) setSelected(d[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/screentime?studentId=${selected}&days=14`).then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [selected])

  const today = data.find(d => d.date === new Date().toISOString().split('T')[0])
  const todayMins = today?.minutes ?? 0
  const weekTotal = data.slice(-7).reduce((s, d) => s + d.minutes, 0)
  const weekAvg = Math.round(weekTotal / 7)
  const maxDay = data.reduce((m, d) => d.minutes > m ? d.minutes : m, 0)

  function fmt(mins: number) {
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  const pct = Math.min(100, Math.round((todayMins / dailyLimit) * 100))
  const overLimit = todayMins > dailyLimit

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Monitor size={24} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Screen Time Monitor</h1>
          <p className="text-gray-500 text-sm">Track how long your child spends on CodeBridge</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Select Child</label>
            <select className="input" value={selected} onChange={e => setSelected(e.target.value)}>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Daily Limit (minutes)</label>
            <input type="number" className="input" value={dailyLimit} onChange={e => setDailyLimit(Number(e.target.value))} min="30" max="480" step="15" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading screen time data…</div>
      ) : (
        <>
          {/* Today's usage */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className={`card border-2 text-center ${overLimit ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              <Clock size={20} className={`mx-auto mb-2 ${overLimit ? 'text-red-500' : 'text-green-500'}`} />
              <div className={`text-2xl font-bold ${overLimit ? 'text-red-700' : 'text-green-700'}`}>{fmt(todayMins)}</div>
              <div className={`text-sm ${overLimit ? 'text-red-600' : 'text-green-600'}`}>Today</div>
            </div>
            <div className="card border-2 border-blue-200 bg-blue-50 text-center">
              <TrendingUp size={20} className="mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-blue-700">{fmt(weekAvg)}</div>
              <div className="text-sm text-blue-600">Daily Average (7d)</div>
            </div>
            <div className="card border-2 border-purple-200 bg-purple-50 text-center">
              <Monitor size={20} className="mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-purple-700">{fmt(weekTotal)}</div>
              <div className="text-sm text-purple-600">This Week Total</div>
            </div>
          </div>

          {/* Today's progress bar */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Today's Usage</span>
              <span className="text-sm text-gray-500">{fmt(todayMins)} / {fmt(dailyLimit)}</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${overLimit ? 'bg-red-500' : pct > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            {overLimit && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle size={14} />
                Daily limit exceeded by {fmt(todayMins - dailyLimit)}
              </div>
            )}
          </div>

          {/* 14-day chart */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Last 14 Days</h2>
            {data.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No screen time data available</p>
            ) : (
              <div className="flex items-end gap-1.5 h-40">
                {data.map(entry => {
                  const height = maxDay > 0 ? Math.max(4, Math.round((entry.minutes / maxDay) * 100)) : 4
                  const over = entry.minutes > dailyLimit
                  return (
                    <div key={entry.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {fmt(entry.minutes)}
                      </div>
                      <div
                        className={`w-full rounded-t transition-all ${over ? 'bg-red-400' : 'bg-brand-400'}`}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-gray-400 transform -rotate-45 origin-top-left">{entry.date.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
