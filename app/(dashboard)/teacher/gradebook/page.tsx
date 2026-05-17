'use client'
import { useState, useEffect } from 'react'
import { BarChart2, Download, Wand2 } from 'lucide-react'
import toast from 'react-hot-toast'

type Class = { id: string; name: string }
type GradeEntry = { studentId: string; name: string; gradeLevel: string | null; quizzes: number; avgQuizScore: number | null; assignments: number; avgAssignmentScore: number | null; overallAvg: number | null }

function gradeFromScore(score: number | null): string {
  if (score === null) return '—'
  if (score >= 70) return 'A'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C'
  if (score >= 45) return 'D'
  return 'F'
}

export default function GradebookPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selected, setSelected] = useState('')
  const [grades, setGrades] = useState<GradeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, string>>({})

  useEffect(() => { fetch('/api/classes').then(r => r.json()).then(setClasses) }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/gradebook?classId=${selected}`).then(r => r.json()).then(d => { setGrades(d); setLoading(false) })
  }, [selected])

  async function generateComment(studentId: string) {
    setGeneratingId(studentId)
    const res = await fetch('/api/ai/report-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    })
    const data = await res.json()
    setGeneratingId(null)
    setComments(prev => ({ ...prev, [studentId]: data.comment }))
    toast.success('Comment generated!')
  }

  function exportCSV() {
    const rows = [
      ['Name', 'Grade', 'Quizzes', 'Avg Quiz %', 'Assignments', 'Avg Assign %', 'Overall %', 'Grade'],
      ...grades.map(g => [g.name, g.gradeLevel ?? '', g.quizzes, g.avgQuizScore ?? '', g.assignments, g.avgAssignmentScore ?? '', g.overallAvg ?? '', gradeFromScore(g.overallAvg)]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'gradebook.csv'; a.click()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grade Book</h1>
        {grades.length > 0 && (
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      <div className="card mb-6">
        <label className="label">Select Class</label>
        <select className="input max-w-xs" value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Choose a class…</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading && <div className="text-center py-8 text-gray-400">Loading grades…</div>}

      {!loading && grades.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left bg-gray-50">
                <th className="px-4 py-3 font-medium text-gray-500">Student</th>
                <th className="px-4 py-3 font-medium text-gray-500">Grade</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-center">Quiz Avg</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-center">Assign Avg</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-center">Overall</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-center">Letter</th>
                <th className="px-4 py-3 font-medium text-gray-500">Report Comment</th>
              </tr>
            </thead>
            <tbody>
              {grades.map(g => (
                <>
                  <tr key={g.studentId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold text-xs">{g.name.charAt(0)}</div>
                        <span className="font-medium text-gray-900">{g.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{g.gradeLevel ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {g.avgQuizScore !== null ? (
                        <span className={`badge ${g.avgQuizScore >= 70 ? 'bg-green-100 text-green-700' : g.avgQuizScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{g.avgQuizScore}%</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {g.avgAssignmentScore !== null ? <span className="badge bg-blue-100 text-blue-700">{g.avgAssignmentScore}%</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900">{g.overallAvg !== null ? `${g.overallAvg}%` : '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-extrabold text-lg ${g.overallAvg !== null && g.overallAvg >= 50 ? 'text-green-600' : 'text-red-500'}`}>{gradeFromScore(g.overallAvg)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {comments[g.studentId] ? (
                        <div className="text-xs text-gray-600 max-w-xs">{comments[g.studentId]}</div>
                      ) : (
                        <button
                          onClick={() => generateComment(g.studentId)}
                          disabled={generatingId === g.studentId}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                        >
                          <Wand2 size={12} />
                          {generatingId === g.studentId ? 'Generating…' : 'AI Comment'}
                        </button>
                      )}
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
