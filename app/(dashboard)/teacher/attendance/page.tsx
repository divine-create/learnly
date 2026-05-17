'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Clock, Save } from 'lucide-react'

type Class = { id: string; name: string; gradeLevel: string }
type Student = { id: string; name: string; gradeLevel: string | null }
type AttendanceRecord = { studentId: string; status: 'present' | 'absent' | 'late'; note: string }

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/classes').then(r => r.json()).then(setClasses) }, [])

  useEffect(() => {
    if (!selectedClass) return
    setLoading(true)
    Promise.all([
      fetch(`/api/classes/${selectedClass}`).then(r => r.json()),
      fetch(`/api/attendance?classId=${selectedClass}&date=${date}`).then(r => r.json()),
    ]).then(([cls, existing]) => {
      const studs = cls.students?.map((e: any) => e.student) ?? []
      setStudents(studs)
      const init: Record<string, AttendanceRecord> = {}
      studs.forEach((s: Student) => {
        const ex = existing.find((e: any) => e.studentId === s.id)
        init[s.id] = { studentId: s.id, status: ex?.status ?? 'present', note: ex?.note ?? '' }
      })
      setRecords(init)
      setLoading(false)
    })
  }, [selectedClass, date])

  function setStatus(studentId: string, status: 'present' | 'absent' | 'late') {
    setRecords(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }))
  }

  async function save() {
    setSaving(true)
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: selectedClass, date, records: Object.values(records) }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Failed to save'); return }
    toast.success('Attendance saved!')
  }

  const presentCount = Object.values(records).filter(r => r.status === 'present').length
  const absentCount = Object.values(records).filter(r => r.status === 'absent').length
  const lateCount = Object.values(records).filter(r => r.status === 'late').length

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance Tracker</h1>

      <div className="card mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Class</label>
            <select className="input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">Select class…</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>
        </div>
      </div>

      {selectedClass && !loading && students.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
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

          <div className="card mb-4">
            {/* Quick mark all */}
            <div className="flex gap-2 mb-4 pb-4 border-b border-gray-100">
              <span className="text-sm text-gray-500 mr-2 self-center">Mark all:</span>
              {(['present', 'absent', 'late'] as const).map(s => (
                <button key={s} onClick={() => students.forEach(st => setStatus(st.id, s))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
                    s === 'present' ? 'border-green-300 text-green-700 hover:bg-green-50' :
                    s === 'absent' ? 'border-red-300 text-red-700 hover:bg-red-50' :
                    'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                  }`}>{s}</button>
              ))}
            </div>

            <div className="space-y-2">
              {students.map(student => {
                const record = records[student.id]
                if (!record) return null
                return (
                  <div key={student.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold text-xs shrink-0">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 font-medium text-gray-900 text-sm">{student.name}</div>
                    <div className="flex gap-2">
                      {(['present', 'absent', 'late'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => setStatus(student.id, status)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border-2 transition-all ${
                            record.status === status
                              ? status === 'present' ? 'border-green-500 bg-green-100 text-green-700'
                                : status === 'absent' ? 'border-red-500 bg-red-100 text-red-700'
                                : 'border-yellow-500 bg-yellow-100 text-yellow-700'
                              : 'border-gray-200 text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          {status === 'present' ? '✓' : status === 'absent' ? '✗' : '~'} {status}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} />{saving ? 'Saving…' : 'Save Attendance'}
          </button>
        </>
      )}

      {selectedClass && !loading && students.length === 0 && (
        <div className="card text-center py-12 text-gray-400">No students enrolled in this class</div>
      )}
    </div>
  )
}
