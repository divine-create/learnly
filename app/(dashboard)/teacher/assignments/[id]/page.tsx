'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, Star, User } from 'lucide-react'
import dynamic from 'next/dynamic'
import { formatDate } from '@/lib/utils'

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { ssr: false })

type Submission = { id: string; code: string; score: number | null; feedback: string | null; submittedAt: string; student: { id: string; name: string; gradeLevel: string | null } }
type Assignment = { id: string; title: string; description: string; dueDate: string; maxScore: number; language: string; class: { name: string }; submissions: Submission[] }

export default function AssignmentGradingPage() {
  const params = useParams()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [selected, setSelected] = useState<Submission | null>(null)
  const [scoreInput, setScoreInput] = useState('')
  const [feedback, setFeedback] = useState('')
  const [grading, setGrading] = useState(false)

  useEffect(() => {
    fetch(`/api/assignments/${params.id}`).then(r => r.json()).then(d => { setAssignment(d) })
  }, [params.id])

  async function grade() {
    if (!selected || !assignment) return
    setGrading(true)
    const res = await fetch(`/api/assignments/${assignment.id}/submit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: selected.id, score: parseInt(scoreInput), feedback }),
    })
    setGrading(false)
    if (!res.ok) { toast.error('Failed to grade'); return }
    toast.success('Grade saved!')
    const updated = await fetch(`/api/assignments/${params.id}`)
    const data = await updated.json()
    setAssignment(data)
    const updatedSub = data.submissions.find((s: Submission) => s.id === selected.id)
    setSelected(updatedSub ?? null)
  }

  if (!assignment) return <div className="p-8 text-gray-400">Loading…</div>

  return (
    <div className="p-8">
      <Link href="/teacher/assignments" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={16} /> Back to assignments
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
        <p className="text-gray-500 text-sm">{assignment.class.name} · Due: {formatDate(assignment.dueDate)} · {assignment.submissions.length} submissions</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Submissions list */}
        <div className="card lg:col-span-1">
          <h2 className="font-semibold text-gray-900 mb-4">Submissions ({assignment.submissions.length})</h2>
          {assignment.submissions.length === 0 ? (
            <p className="text-gray-400 text-sm">No submissions yet</p>
          ) : (
            <div className="space-y-2">
              {assignment.submissions.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelected(s); setScoreInput(s.score?.toString() ?? ''); setFeedback(s.feedback ?? '') }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selected?.id === s.id ? 'border-brand-400 bg-brand-50' : 'border-gray-100 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold text-xs">{s.student.name.charAt(0)}</div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{s.student.name}</div>
                        <div className="text-xs text-gray-400">{formatDate(s.submittedAt)}</div>
                      </div>
                    </div>
                    {s.score !== null ? (
                      <span className="badge bg-green-100 text-green-700">{s.score}/{assignment.maxScore}</span>
                    ) : (
                      <span className="badge bg-yellow-100 text-yellow-700">Ungraded</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Code viewer + grading */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="card flex items-center justify-center h-48 border-dashed">
              <p className="text-gray-400">Select a submission to grade</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <User size={16} className="text-gray-400" />
                  <span className="font-medium text-gray-900">{selected.student.name}</span>
                  <span className="text-xs text-gray-400">Submitted {formatDate(selected.submittedAt)}</span>
                </div>
                <CodeEditor value={selected.code} language={assignment.language} height="350px" readOnly />
              </div>

              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Star size={16} className="text-yellow-500" /> Grade Submission</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Score (out of {assignment.maxScore})</label>
                    <input type="number" className="input" value={scoreInput} onChange={e => setScoreInput(e.target.value)} min="0" max={assignment.maxScore} placeholder="e.g. 85" />
                  </div>
                  <div>
                    <label className="label">Feedback</label>
                    <textarea className="input" rows={3} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Feedback for the student…" />
                  </div>
                </div>
                <button onClick={grade} disabled={grading || !scoreInput} className="btn-primary mt-4 flex items-center gap-2">
                  <CheckCircle size={16} />{grading ? 'Saving…' : 'Save Grade'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
