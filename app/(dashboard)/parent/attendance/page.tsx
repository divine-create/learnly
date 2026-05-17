'use client'
import { useState, useEffect } from 'react'
import { CalendarCheck, CheckCircle, XCircle, Clock } from 'lucide-react'

type Child = { id: string; name: string }
type AttendanceEntry = { date: string; status: 'present' | 'absent' | 'late'; note: string; className: string }

export default function ParentAttendancePage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selected, setSelected] = useState('')
  const [records, setRecords] = useState<AttendanceEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/parent/children').then(r => r.json()).then(d => {
      setChildren(d)
      if (d.length > 0) setSelected(d[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/parent/attendance?studentId=${selected}`).then(r => r.json()).then(d => {
      setRecords(d)
      setLoading(false)
    })
  }, [selected])

  const presentCount = records.filter(r => r.status === 'present').length
  const absentCount = records.filter(r => r.status === 'absent').length
  const lateCount = records.filter(r => r.status === 'late').length
  const total = records.length
  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0

  const statusIcon = (status: string) => {
    if (status === 'present') return <CheckCircle size={16} className="text-green-500" />
    if (status === 'absent') return <XCircle size={16} className="text-red-500" />
    return <Clock size={16} className="text-yellow-500" />
  }

  const statusBadge = (status: string) => {
    if (status === 'present') return 'bg-green-100 text-green-700'
    if (status === 'absent') return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
          <CalendarCheck size={24} className="text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Record</h1>
          <p className="text-gray-500 text-sm">View your child's school attendance history</p>
        </div>
      </div>

      <div className="card mb-6">
        <label className="label">Select Child</label>
        <select className="input max-w-xs" value={selected} onChange={e => setSelected(e.target.value)}>
          {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading && <div className="text-center py-8 text-gray-400">Loading attendance…</div>}

      {!loading && selected && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="card text-center bg-blue-50 border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{rate}%</div>
              <div className="text-sm text-blue-600">Attendance Rate</div>
            </div>
            <div className="card text-center bg-green-50 border-green-200">
              <div className="text-2xl font-bold text-green-700">{presentCount}</div>
              <div className="text-sm text-green-600">Present</div>
            </div>
            <div className="card text-center bg-red-50 border-red-200">
              <div className="text-2xl font-bold text-red-700">{absentCount}</div>
              <div className="text-sm text-red-600">Absent</div>
            </div>
            <div className="card text-center bg-yellow-50 border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{lateCount}</div>
              <div className="text-sm text-yellow-600">Late</div>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">No attendance records available</div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left bg-gray-50">
                    <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Class</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(r.date + 'T12:00:00').toLocaleDateString('en-NG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.className}</td>
                      <td className="px-4 py-3">
                        <span className={`badge flex items-center gap-1 w-fit ${statusBadge(r.status)}`}>
                          {statusIcon(r.status)} <span className="capitalize">{r.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{r.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
