'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Wand2, Download, BookOpen } from 'lucide-react'
import { GRADE_LEVELS, SUBJECTS } from '@/lib/utils'

export default function LessonPlannerPage() {
  const [form, setForm] = useState({ topic: '', subject: '', gradeLevel: '', duration: '45' })
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/ai/lesson-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    setContent(data.content)
    toast.success('Lesson plan generated!')
  }

  function download() {
    const blob = new Blob([content.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lesson-plan-${form.topic.replace(/\s/g, '-')}.txt`
    a.click()
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
          <Wand2 size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Lesson Planner</h1>
          <p className="text-gray-500 text-sm">Generate a complete lesson plan from a topic in seconds</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h2 className="font-semibold text-gray-900 mb-4">Lesson Details</h2>
          <form onSubmit={generate} className="space-y-4">
            <div>
              <label className="label">Topic *</label>
              <input className="input" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} required placeholder="e.g. Python Variables and Data Types" />
            </div>
            <div>
              <label className="label">Subject *</label>
              <select className="input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required>
                <option value="">Select…</option>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Grade Level *</label>
              <select className="input" value={form.gradeLevel} onChange={e => setForm({ ...form, gradeLevel: e.target.value })} required>
                <option value="">Select…</option>
                {GRADE_LEVELS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <select className="input" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              <Wand2 size={16} />
              {loading ? 'Generating…' : 'Generate Plan'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {content ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Generated Lesson Plan</h2>
                <button onClick={download} className="btn-secondary text-sm flex items-center gap-2">
                  <Download size={14} /> Download
                </button>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center h-64 border-2 border-dashed">
              <BookOpen size={48} className="text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">Your lesson plan will appear here</p>
              <p className="text-gray-400 text-xs mt-1">Fill in the form and click Generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
