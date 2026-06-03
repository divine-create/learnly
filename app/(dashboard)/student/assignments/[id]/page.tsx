'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, CheckCircle, Star, Play, Terminal } from 'lucide-react'
import dynamic from 'next/dynamic'
import { formatDate } from '@/lib/utils'
import { usePyodide } from '@/hooks/usePyodide'

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { ssr: false })

type Assignment = {
  id: string; title: string; description: string; dueDate: string; maxScore: number; language: string; starterCode: string | null
  class: { name: string }
  submissions: Array<{ id: string; code: string; score: number | null; feedback: string | null; submittedAt: string }>
}

export default function AssignmentDetailPage() {
  const params = useParams()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [output, setOutput] = useState<{ stdout: string; stderr: string } | null>(null)
  const [running, setRunning] = useState(false)
  const { runCode, loading: pyLoading } = usePyodide()

  useEffect(() => {
    fetch(`/api/assignments/${params.id}`).then(r => r.json()).then(d => {
      setAssignment(d)
      setCode(d.submissions[0]?.code ?? d.starterCode ?? `# ${d.title}\n# Write your solution here\n`)
      setSubmitted(d.submissions.length > 0)
    })
  }, [params.id])

  async function run() {
    if (!assignment || assignment.language !== 'python') return
    setRunning(true)
    setOutput(null)
    const out = await runCode(code)
    setOutput(out)
    setRunning(false)
  }

  async function submit() {
    setSubmitting(true)
    const res = await fetch(`/api/assignments/${params.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    setSubmitting(false)
    if (!res.ok) { toast.error('Submission failed'); return }
    toast.success('Assignment submitted! ✅')
    setSubmitted(true)
    const updated = await fetch(`/api/assignments/${params.id}`)
    setAssignment(await updated.json())
  }

  if (!assignment) return <div className="p-8 text-gray-400">Loading…</div>

  const submission = assignment.submissions[0]
  const isGraded = submission?.score !== null
  const isPython = assignment.language === 'python'

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <Link href="/student/assignments" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={16} /> Back to assignments
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{assignment.class.name} · Due: {formatDate(assignment.dueDate)}</p>
        </div>
        {isGraded && (
          <div className="text-center bg-brand-100 rounded-2xl px-6 py-3">
            <div className="text-3xl font-extrabold text-brand-600">{submission.score}/{assignment.maxScore}</div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
        )}
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">📋 Description</h2>
        <p className="text-gray-700 text-sm whitespace-pre-wrap">{assignment.description}</p>
      </div>

      {isGraded && submission.feedback && (
        <div className="card bg-blue-50 border-blue-200 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} className="text-blue-500" />
            <h3 className="font-semibold text-blue-800">Teacher Feedback</h3>
          </div>
          <p className="text-blue-700 text-sm">{submission.feedback}</p>
        </div>
      )}

      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <label className="label">Your Code</label>
          <div className="flex items-center gap-2">
            {isPython && !isGraded && (
              <button
                onClick={run}
                disabled={running || pyLoading}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <Play size={13} />
                {pyLoading ? 'Loading Python…' : running ? 'Running…' : 'Run Code'}
              </button>
            )}
            {submitted && (
              <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle size={11} />Submitted {formatDate(submission.submittedAt)}
              </span>
            )}
          </div>
        </div>
        <CodeEditor value={code} onChange={setCode} language={assignment.language} height="400px" readOnly={isGraded} />
      </div>

      {/* Output panel */}
      {output !== null && (
        <div className="mb-4 rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
            <Terminal size={13} className="text-gray-400" />
            <span className="text-xs text-gray-400 font-mono">Output</span>
          </div>
          <div className="p-3 font-mono text-sm min-h-[48px]">
            {output.stdout && <pre className="text-green-400 whitespace-pre-wrap">{output.stdout}</pre>}
            {output.stderr && <pre className="text-red-400 whitespace-pre-wrap">{output.stderr}</pre>}
            {!output.stdout && !output.stderr && <span className="text-gray-500">No output</span>}
          </div>
        </div>
      )}

      {!isGraded && (
        <button onClick={submit} disabled={submitting} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
          <Send size={18} />
          {submitting ? 'Submitting…' : submitted ? 'Resubmit' : 'Submit Assignment'}
        </button>
      )}
    </div>
  )
}
