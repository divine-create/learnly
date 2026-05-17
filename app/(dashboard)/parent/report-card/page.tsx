'use client'
import { useState, useEffect } from 'react'
import { FileText, Download, Star, TrendingUp, TrendingDown } from 'lucide-react'

type Child = { id: string; name: string; gradeLevel: string | null }
type ReportData = {
  student: { name: string; gradeLevel: string | null }
  term: { name: string; startDate: string; endDate: string } | null
  subjects: Array<{
    className: string
    quizzes: number
    avgQuizScore: number | null
    assignments: number
    avgAssignmentScore: number | null
    overallAvg: number | null
  }>
  totalXp: number
  badgesEarned: number
  attendanceRate: number | null
}

function gradeFromScore(score: number | null): { letter: string; color: string } {
  if (score === null) return { letter: '—', color: 'text-gray-400' }
  if (score >= 70) return { letter: 'A', color: 'text-green-600' }
  if (score >= 60) return { letter: 'B', color: 'text-blue-600' }
  if (score >= 50) return { letter: 'C', color: 'text-yellow-600' }
  if (score >= 45) return { letter: 'D', color: 'text-orange-600' }
  return { letter: 'F', color: 'text-red-600' }
}

export default function ReportCardPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selected, setSelected] = useState('')
  const [report, setReport] = useState<ReportData | null>(null)
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
    fetch(`/api/parent/report-card?studentId=${selected}`).then(r => r.json()).then(d => {
      setReport(d)
      setLoading(false)
    })
  }, [selected])

  const overallAvg = report?.subjects.length
    ? Math.round(report.subjects.filter(s => s.overallAvg !== null).reduce((s, c) => s + (c.overallAvg ?? 0), 0) / Math.max(1, report.subjects.filter(s => s.overallAvg !== null).length))
    : null

  const { letter, color } = gradeFromScore(overallAvg)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <FileText size={24} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Term Report Card</h1>
            <p className="text-gray-500 text-sm">Academic performance summary</p>
          </div>
        </div>
        {report && (
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 text-sm print:hidden">
            <Download size={16} /> Print / Save
          </button>
        )}
      </div>

      <div className="card mb-6 print:hidden">
        <label className="label">Select Child</label>
        <select className="input max-w-xs" value={selected} onChange={e => setSelected(e.target.value)}>
          {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading && <div className="text-center py-8 text-gray-400">Loading report…</div>}

      {!loading && report && (
        <div className="space-y-6" id="report-card">
          {/* Header */}
          <div className="card bg-gradient-to-r from-brand-600 to-brand-700 text-white text-center py-8">
            <div className="text-4xl mb-2">🎓</div>
            <h2 className="text-2xl font-bold">{report.student.name}</h2>
            <p className="text-brand-200 mt-1">{report.student.gradeLevel ?? 'N/A'}</p>
            {report.term && (
              <p className="text-brand-200 text-sm mt-1">
                {report.term.name} · {new Date(report.term.startDate).toLocaleDateString()} – {new Date(report.term.endDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card text-center">
              <div className={`text-4xl font-extrabold ${color}`}>{letter}</div>
              <div className="text-sm text-gray-500 mt-1">Overall Grade</div>
              {overallAvg !== null && <div className="text-xs text-gray-400">{overallAvg}%</div>}
            </div>
            <div className="card text-center">
              <div className="text-4xl font-extrabold text-purple-600">{report.totalXp.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">XP Earned</div>
            </div>
            <div className="card text-center">
              <div className="text-4xl font-extrabold text-yellow-600">{report.badgesEarned}</div>
              <div className="text-sm text-gray-500 mt-1">Badges</div>
            </div>
            <div className="card text-center">
              <div className="text-4xl font-extrabold text-blue-600">
                {report.attendanceRate !== null ? `${report.attendanceRate}%` : '—'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Attendance</div>
            </div>
          </div>

          {/* Subject breakdown */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Subject Performance</h3>
            {report.subjects.length === 0 ? (
              <p className="text-gray-400 text-sm">No class data available for this term</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-2 font-medium text-gray-500">Subject / Class</th>
                    <th className="pb-2 font-medium text-gray-500 text-center">Quiz Avg</th>
                    <th className="pb-2 font-medium text-gray-500 text-center">Assignment Avg</th>
                    <th className="pb-2 font-medium text-gray-500 text-center">Overall</th>
                    <th className="pb-2 font-medium text-gray-500 text-center">Grade</th>
                    <th className="pb-2 font-medium text-gray-500 text-center">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {report.subjects.map((s, i) => {
                    const { letter: l, color: c } = gradeFromScore(s.overallAvg)
                    const good = s.overallAvg !== null && s.overallAvg >= 50
                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-900">{s.className}</td>
                        <td className="py-3 text-center text-gray-600">{s.avgQuizScore !== null ? `${s.avgQuizScore}%` : '—'}</td>
                        <td className="py-3 text-center text-gray-600">{s.avgAssignmentScore !== null ? `${s.avgAssignmentScore}%` : '—'}</td>
                        <td className="py-3 text-center font-bold text-gray-900">{s.overallAvg !== null ? `${s.overallAvg}%` : '—'}</td>
                        <td className={`py-3 text-center font-extrabold text-lg ${c}`}>{l}</td>
                        <td className="py-3 text-center">
                          {good
                            ? <TrendingUp size={16} className="text-green-500 mx-auto" />
                            : <TrendingDown size={16} className="text-red-500 mx-auto" />
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Comment */}
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-blue-600" />
              <h3 className="font-semibold text-blue-900">General Remarks</h3>
            </div>
            <p className="text-blue-800 text-sm">
              {overallAvg === null
                ? 'No performance data available yet for this term.'
                : overallAvg >= 70
                  ? `${report.student.name} is performing excellently this term. Keep up the great work!`
                  : overallAvg >= 50
                    ? `${report.student.name} is making good progress. Encourage more practice with Cody AI and daily challenges.`
                    : `${report.student.name} needs additional support. Please speak with the class teacher and consider extra tutoring sessions.`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
