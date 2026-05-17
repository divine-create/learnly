'use client'
import { useState, useEffect } from 'react'
import { NotebookPen, Wand2, Trash2, Plus, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

type Note = { id: string; title: string; content: string; lessonId?: string; lessonTitle?: string; createdAt: string; isAI: boolean }
type Lesson = { id: string; title: string }

export default function StudyNotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Note | null>(null)
  const [form, setForm] = useState({ title: '', content: '', lessonId: '' })
  const [generating, setGenerating] = useState(false)
  const [aiLessonId, setAiLessonId] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('study_notes')
    if (saved) setNotes(JSON.parse(saved))
    fetch('/api/student/lessons').then(r => r.json()).then(setLessons).catch(() => {})
  }, [])

  function saveNotes(updated: Note[]) {
    setNotes(updated)
    localStorage.setItem('study_notes', JSON.stringify(updated))
  }

  function addNote(e: React.FormEvent) {
    e.preventDefault()
    const note: Note = {
      id: Date.now().toString(),
      title: form.title,
      content: form.content,
      lessonId: form.lessonId || undefined,
      lessonTitle: lessons.find(l => l.id === form.lessonId)?.title,
      createdAt: new Date().toISOString(),
      isAI: false,
    }
    saveNotes([note, ...notes])
    setForm({ title: '', content: '', lessonId: '' })
    setShowForm(false)
    toast.success('Note saved!')
  }

  function deleteNote(id: string) {
    saveNotes(notes.filter(n => n.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  async function generateAISummary() {
    if (!aiLessonId) { toast.error('Select a lesson first'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/study-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: aiLessonId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const lesson = lessons.find(l => l.id === aiLessonId)
      const note: Note = {
        id: Date.now().toString(),
        title: `AI Summary: ${lesson?.title ?? 'Lesson'}`,
        content: data.summary,
        lessonId: aiLessonId,
        lessonTitle: lesson?.title,
        createdAt: new Date().toISOString(),
        isAI: true,
      }
      saveNotes([note, ...notes])
      setSelected(note)
      toast.success('AI summary generated!')
    } catch {
      toast.error('Failed to generate summary')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <NotebookPen size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Study Notes</h1>
            <p className="text-gray-500 text-sm">Your personal notes and AI-generated summaries</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Note
        </button>
      </div>

      {/* AI Summary Generator */}
      <div className="card mb-6 bg-purple-50 border-purple-200">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 size={16} className="text-purple-600" />
          <h2 className="font-semibold text-purple-900">AI Lesson Summary</h2>
        </div>
        <div className="flex gap-3">
          <select className="input flex-1" value={aiLessonId} onChange={e => setAiLessonId(e.target.value)}>
            <option value="">Select a lesson to summarise…</option>
            {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
          <button onClick={generateAISummary} disabled={generating || !aiLessonId} className="btn-primary flex items-center gap-2 shrink-0">
            <Wand2 size={15} />{generating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6 border-brand-200 bg-brand-50">
          <h2 className="font-semibold text-gray-900 mb-4">New Note</h2>
          <form onSubmit={addNote} className="space-y-3">
            <div>
              <label className="label">Title</label>
              <input className="input" required placeholder="Note title…" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Link to Lesson (optional)</label>
              <select className="input" value={form.lessonId} onChange={e => setForm({ ...form, lessonId: e.target.value })}>
                <option value="">No lesson</option>
                {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Content</label>
              <textarea className="input" rows={5} required placeholder="Write your notes here…" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Save Note</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Notes list */}
        <div className="card lg:col-span-1">
          <h2 className="font-semibold text-gray-900 mb-4">All Notes ({notes.length})</h2>
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notes yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map(note => (
                <button
                  key={note.id}
                  onClick={() => setSelected(note)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selected?.id === note.id ? 'border-brand-400 bg-brand-50' : 'border-gray-100 hover:bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{note.title}</span>
                        {note.isAI && <span className="badge bg-purple-100 text-purple-700 shrink-0">AI</span>}
                      </div>
                      {note.lessonTitle && <p className="text-xs text-gray-400 truncate mt-0.5">{note.lessonTitle}</p>}
                      <p className="text-xs text-gray-300 mt-0.5">{new Date(note.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Note detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="card flex flex-col items-center justify-center h-64 border-dashed">
              <NotebookPen size={36} className="text-gray-300 mb-3" />
              <p className="text-gray-400">Select a note to read</p>
            </div>
          ) : (
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-gray-900 text-lg">{selected.title}</h2>
                    {selected.isAI && <span className="badge bg-purple-100 text-purple-700">AI Generated</span>}
                  </div>
                  {selected.lessonTitle && <p className="text-sm text-gray-500">{selected.lessonTitle}</p>}
                  <p className="text-xs text-gray-400">{new Date(selected.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => deleteNote(selected.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="border-t border-gray-100 pt-4 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                {selected.content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
