'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, FileText, Users, Wand2, BookOpen, Eye, CheckCircle, Clock } from 'lucide-react'
import FileUpload from '@/components/FileUpload'

type Lesson = { id: string; title: string; topic: string; orderIndex: number; isPublished: boolean; _count: { materials: number } }
type ClassData = {
  id: string; name: string; subject: string; gradeLevel: string; code: string;
  teacher: { name: string };
  students: Array<{ student: { id: string; name: string; gradeLevel: string | null } }>;
  lessons: Lesson[];
}

export default function TeacherClassDetailPage() {
  const params = useParams()
  const classId = params.id as string

  const [cls, setCls] = useState<ClassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'lessons' | 'students'>('lessons')
  const [showNewLesson, setShowNewLesson] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [lessonForm, setLessonForm] = useState({ title: '', topic: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [generatingQuiz, setGeneratingQuiz] = useState<string | null>(null)

  useEffect(() => { fetchClass() }, [classId])

  async function fetchClass() {
    const res = await fetch(`/api/classes/${classId}`)
    setCls(await res.json())
    setLoading(false)
  }

  async function addLesson(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lessonForm, classId, orderIndex: cls?.lessons.length ?? 0 }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Lesson created!')
    setShowNewLesson(false)
    setLessonForm({ title: '', topic: '', description: '' })
    fetchClass()
  }

  async function publishLesson(lessonId: string, isPublished: boolean) {
    await fetch(`/api/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !isPublished }),
    })
    fetchClass()
    toast.success(isPublished ? 'Lesson unpublished' : 'Lesson published to students!')
  }

  async function generateQuiz(lessonId: string) {
    setGeneratingQuiz(lessonId)
    const res = await fetch('/api/quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId }),
    })
    const data = await res.json()
    setGeneratingQuiz(null)
    if (!res.ok) { toast.error(data.error); return }
    toast.success(`Quiz generated: "${data.title}" with ${data.questions?.length ?? 0} questions!`)

    // Publish the quiz
    await fetch(`/api/quiz/${data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    })
    toast.success('Quiz published to students!')
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!cls) return <div className="p-8 text-red-500">Class not found</div>

  return (
    <div className="p-8">
      <Link href="/teacher/classes" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={16} /> Back to classes
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {cls.subject} · {cls.gradeLevel} ·
            <span className="font-mono font-bold text-brand-600 ml-1">Class code: {cls.code}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users size={16} />{cls.students.length} students
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {(['lessons', 'students'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab} {tab === 'lessons' ? `(${cls.lessons.length})` : `(${cls.students.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'lessons' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Lessons</h2>
            <button onClick={() => setShowNewLesson(true)} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus size={15} /> Add Lesson
            </button>
          </div>

          {showNewLesson && (
            <div className="card mb-4 bg-brand-50 border-brand-200">
              <h3 className="font-semibold text-gray-900 mb-4">New Lesson</h3>
              <form onSubmit={addLesson} className="space-y-3">
                <div>
                  <label className="label">Lesson Title</label>
                  <input className="input" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} required placeholder="e.g. Introduction to Variables" />
                </div>
                <div>
                  <label className="label">Topic</label>
                  <input className="input" value={lessonForm.topic} onChange={e => setLessonForm({...lessonForm, topic: e.target.value})} required placeholder="e.g. Python Variables and Data Types" />
                </div>
                <div>
                  <label className="label">Description (optional)</label>
                  <textarea className="input" rows={2} value={lessonForm.description} onChange={e => setLessonForm({...lessonForm, description: e.target.value})} placeholder="What will students learn?" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Creating…' : 'Create Lesson'}</button>
                  <button type="button" onClick={() => setShowNewLesson(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {cls.lessons.length === 0 && !showNewLesson ? (
            <div className="card text-center py-12">
              <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm mb-4">No lessons yet. Add your first lesson to start uploading materials.</p>
              <button onClick={() => setShowNewLesson(true)} className="btn-primary text-sm">Add First Lesson</button>
            </div>
          ) : (
            <div className="space-y-3">
              {cls.lessons.map(lesson => (
                <div key={lesson.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 font-bold text-sm shrink-0">
                        {lesson.orderIndex + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{lesson.topic}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><FileText size={12} />{lesson._count.materials} files uploaded</span>
                          <span className={`badge ${lesson.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {lesson.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedLesson(selectedLesson === lesson.id ? null : lesson.id)}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FileText size={12} /> Upload
                      </button>
                      <button
                        onClick={() => generateQuiz(lesson.id)}
                        disabled={generatingQuiz === lesson.id}
                        className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                      >
                        <Wand2 size={12} /> {generatingQuiz === lesson.id ? 'Generating…' : 'Gen Quiz'}
                      </button>
                      <button
                        onClick={() => publishLesson(lesson.id, lesson.isPublished)}
                        className={`text-xs flex items-center gap-1 ${lesson.isPublished ? 'text-orange-600' : 'text-green-600'} hover:underline`}
                      >
                        {lesson.isPublished ? <Eye size={12} /> : <CheckCircle size={12} />}
                        {lesson.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  </div>

                  {selectedLesson === lesson.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-3">Upload PDFs, DOCX, or PPTX files. The AI tutor will learn from these materials.</p>
                      <FileUpload lessonId={lesson.id} onUploaded={fetchClass} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <div className="card">
          {cls.students.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">No students enrolled yet.</p>
              <p className="text-xs text-gray-400 mt-2">Share your class code <span className="font-mono font-bold text-brand-600">{cls.code}</span> with students to join.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 font-medium text-gray-500">Student</th>
                  <th className="pb-3 font-medium text-gray-500">Grade</th>
                </tr>
              </thead>
              <tbody>
                {cls.students.map(({ student }) => (
                  <tr key={student.id} className="border-b border-gray-50">
                    <td className="py-3 flex items-center gap-2">
                      <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      {student.name}
                    </td>
                    <td className="py-3 text-gray-500">{student.gradeLevel ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
