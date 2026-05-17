'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Mic, MicOff, FileText, Volume2 } from 'lucide-react'

type Lesson = {
  id: string; title: string; topic: string; description: string | null
  class: { id: string; name: string; subject: string; gradeLevel: string }
  materials: Array<{ id: string; fileName: string; fileUrl: string; fileType: string; status: string }>
  quizzes: Array<{ id: string; title: string }>
}

type Message = { role: 'user' | 'assistant'; content: string }

export default function LearnPage() {
  const params = useParams()
  const lessonId = params.lessonId as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}`).then(r => r.json()).then(setLesson)
    // Mark lesson as started
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, completed: false, timeSpent: 0 }),
    })
  }, [lessonId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const question = text ?? input.trim()
    if (!question || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)

    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        lessonId,
        question,
        history: messages.slice(-10),
      }),
    })
    const data = await res.json()
    setLoading(false)
    setSessionId(data.sessionId)
    setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
  }

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Voice not supported in your browser. Try Chrome.'); return }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-NG'
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      setInput(text)
      sendMessage(text)
    }
    recognition.onend = () => setListening(false)
    setListening(true)
    recognition.start()
  }

  async function markComplete() {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, completed: true, timeSpent: 60 }),
    })
    window.location.href = `/student/classes/${lesson?.class.id}`
  }

  if (!lesson) return <div className="p-8 text-gray-400">Loading lesson…</div>

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-600 text-white px-6 py-4">
        <Link href={`/student/classes/${lesson.class.id}`} className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-2">
          <ArrowLeft size={16} /> {lesson.class.name}
        </Link>
        <h1 className="text-xl font-bold">{lesson.title}</h1>
        <p className="text-white/70 text-sm">{lesson.topic}</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Materials */}
        <div className="w-64 border-r border-gray-200 bg-white p-4 overflow-y-auto hidden md:block shrink-0">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">📁 Lesson Materials</h3>
          {lesson.materials.length === 0 ? (
            <p className="text-gray-400 text-xs">No materials uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {lesson.materials.map(m => (
                <a
                  key={m.id}
                  href={`/${m.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 border border-gray-100 text-xs group"
                >
                  <FileText size={14} className="text-brand-500 shrink-0" />
                  <span className="truncate text-gray-700 group-hover:text-brand-600">{m.fileName}</span>
                </a>
              ))}
            </div>
          )}

          {lesson.quizzes.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">📝 Quiz</h3>
              {lesson.quizzes.map(q => (
                <Link key={q.id} href={`/student/quiz/${q.id}`} className="block p-2 bg-yellow-50 rounded-lg border border-yellow-200 text-xs text-yellow-700 font-medium hover:bg-yellow-100">
                  {q.title}
                </Link>
              ))}
            </div>
          )}

          <button onClick={markComplete} className="w-full mt-6 bg-green-100 text-green-700 text-xs font-medium py-2 rounded-lg hover:bg-green-200 transition-colors">
            ✅ Mark as Complete
          </button>
        </div>

        {/* Right: AI Tutor chat */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">🤖</div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-md shadow-sm border border-gray-100">
                  <p className="text-gray-800 text-sm">
                    Hey! I'm <strong>Cody</strong>, your AI coding tutor! 👋<br /><br />
                    Today we're learning about <strong>{lesson.topic}</strong>.<br />
                    Ask me anything — I'll help you understand using your teacher's materials. What would you like to know?
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  msg.role === 'user' ? 'bg-brand-100 text-brand-600' : 'bg-brand-600 text-white'
                }`}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className={`max-w-md px-4 py-3 rounded-2xl shadow-sm text-sm ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white">🤖</div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask Cody anything about this lesson…"
                disabled={loading}
              />
              <button
                onClick={startVoice}
                className={`p-2.5 rounded-lg border transition-colors ${listening ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                title="Voice input"
              >
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="btn-primary px-4"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Cody answers from your teacher's materials · Socratic method · Won't give direct answers 😄</p>
          </div>
        </div>
      </div>
    </div>
  )
}
