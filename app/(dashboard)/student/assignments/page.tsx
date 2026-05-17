'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileCode, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Assignment = {
  id: string; title: string; description: string; dueDate: string; maxScore: number; language: string
  class: { name: string; subject: string }
  submissions: Array<{ id: string; score: number | null; submittedAt: string }>
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/assignments').then(r => r.json()).then(d => { setAssignments(d); setLoading(false) })
  }, [])

  const now = new Date()

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📝 Assignments</h1>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading…</div>
      ) : assignments.length === 0 ? (
        <div className="card text-center py-16">
          <FileCode size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No assignments yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(a => {
            const submitted = a.submissions.length > 0
            const graded = submitted && a.submissions[0].score !== null
            const overdue = new Date(a.dueDate) < now && !submitted

            return (
              <div key={a.id} className={`card border-2 ${overdue ? 'border-red-200' : submitted ? 'border-green-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{a.title}</h3>
                      <span className="badge bg-blue-100 text-blue-700 font-mono text-xs">{a.language}</span>
                      {submitted && <span className="badge bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={11} />Submitted</span>}
                      {overdue && <span className="badge bg-red-100 text-red-700 flex items-center gap-1"><AlertCircle size={11} />Overdue</span>}
                      {graded && <span className="badge bg-brand-100 text-brand-700">{a.submissions[0].score}/{a.maxScore}</span>}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{a.description}</p>
                    <div className="flex gap-4 text-xs text-gray-400 mt-2">
                      <span>{a.class.name}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />Due: {formatDate(a.dueDate)}</span>
                    </div>
                  </div>
                  <Link
                    href={`/student/assignments/${a.id}`}
                    className={`shrink-0 text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                      submitted ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-brand-600 text-white hover:bg-brand-700'
                    }`}
                  >
                    {submitted ? 'Review' : 'Start'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
