'use client'
import { useState, useEffect } from 'react'
import { Timer, Plus, Trash2, Bell } from 'lucide-react'

type Exam = { id: string; subject: string; date: string; time: string; notes: string }

function useCountdown(targetDate: string, targetTime: string) {
  const [diff, setDiff] = useState(0)

  useEffect(() => {
    const target = new Date(`${targetDate}T${targetTime || '08:00'}:00`)
    const update = () => setDiff(target.getTime() - Date.now())
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [targetDate, targetTime])

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true }
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { days, hours, minutes, seconds, passed: false }
}

function ExamCard({ exam, onDelete }: { exam: Exam; onDelete: () => void }) {
  const { days, hours, minutes, seconds, passed } = useCountdown(exam.date, exam.time)
  const urgency = days < 2 ? 'red' : days < 7 ? 'yellow' : 'green'

  return (
    <div className={`card border-2 ${urgency === 'red' ? 'border-red-200 bg-red-50' : urgency === 'yellow' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{exam.subject}</h3>
          <p className="text-sm text-gray-500">
            {new Date(`${exam.date}T12:00:00`).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {exam.time && ` at ${exam.time}`}
          </p>
        </div>
        <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      {passed ? (
        <div className="text-center py-2">
          <span className="badge bg-gray-100 text-gray-500 text-sm">Exam has passed</span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 text-center">
          {[{ v: days, l: 'Days' }, { v: hours, l: 'Hours' }, { v: minutes, l: 'Mins' }, { v: seconds, l: 'Secs' }].map(({ v, l }) => (
            <div key={l} className={`rounded-lg py-3 ${urgency === 'red' ? 'bg-red-100' : urgency === 'yellow' ? 'bg-yellow-100' : 'bg-green-100'}`}>
              <div className={`text-2xl font-bold tabular-nums ${urgency === 'red' ? 'text-red-700' : urgency === 'yellow' ? 'text-yellow-700' : 'text-green-700'}`}>
                {String(v).padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500">{l}</div>
            </div>
          ))}
        </div>
      )}

      {exam.notes && (
        <p className="mt-3 text-sm text-gray-600 bg-white/60 rounded-lg p-2">{exam.notes}</p>
      )}
    </div>
  )
}

export default function ExamCountdownPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', date: '', time: '09:00', notes: '' })

  useEffect(() => {
    const saved = localStorage.getItem('exam_countdowns')
    if (saved) setExams(JSON.parse(saved))
  }, [])

  function save(updated: Exam[]) {
    setExams(updated)
    localStorage.setItem('exam_countdowns', JSON.stringify(updated))
  }

  function addExam(e: React.FormEvent) {
    e.preventDefault()
    const newExam: Exam = { id: Date.now().toString(), ...form }
    save([...exams, newExam].sort((a, b) => a.date.localeCompare(b.date)))
    setForm({ subject: '', date: '', time: '09:00', notes: '' })
    setShowForm(false)
  }

  function deleteExam(id: string) {
    save(exams.filter(e => e.id !== id))
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Timer size={24} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exam Countdown</h1>
            <p className="text-gray-500 text-sm">Track your upcoming exams and tests</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Exam
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 border-brand-200 bg-brand-50">
          <h2 className="font-semibold text-gray-900 mb-4">Add New Exam</h2>
          <form onSubmit={addExam} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Subject / Exam Name</label>
              <input className="input" required placeholder="e.g. Python Basics Final Exam" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div>
              <label className="label">Exam Date</label>
              <input type="date" className="input" required min={today} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Time (optional)</label>
              <input type="time" className="input" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input className="input" placeholder="e.g. Topics: loops, functions, arrays" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Save Exam</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {exams.length === 0 && !showForm ? (
        <div className="card text-center py-16">
          <Timer size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-600 mb-2">No exams added yet</h3>
          <p className="text-gray-400 text-sm mb-4">Add your upcoming exams to see live countdowns</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mx-auto flex items-center gap-2">
            <Plus size={16} /> Add Your First Exam
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <ExamCard key={exam.id} exam={exam} onDelete={() => deleteExam(exam.id)} />
          ))}
        </div>
      )}

      {exams.length > 0 && (
        <div className="mt-6 card bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Bell size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Study tip</p>
              <p className="text-sm text-blue-700 mt-0.5">
                For your next exam, use Cody (AI tutor) to quiz yourself on topics, review flashcards from lessons, and attempt daily challenges to keep your skills sharp!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
