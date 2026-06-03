'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, BookOpen, ChevronDown } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }
type Lesson = { id: string; title: string; topic: string; class: { name: string } }

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [showLessonPicker, setShowLessonPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    fetch('/api/student/lessons').then(r => r.json()).then(setLessons).catch(() => {})
  }, [])

  async function send(text?: string) {
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
        lessonId: selectedLesson?.id ?? null,
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
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice input not available. Try Chrome.'); return }
    const rec = new SR()
    rec.lang = 'en-NG'
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; setInput(t); send(t) }
    rec.onend = () => setListening(false)
    setListening(true)
    rec.start()
  }

  const SUGGESTIONS = [
    'What is a variable?', 'Explain loops with an example',
    'What is the difference between Python and Scratch?', 'Help me debug my code',
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">🤖</div>
            <div>
              <h1 className="font-extrabold text-lg">Ask Cody</h1>
              <p className="text-white/80 text-xs">Your AI coding tutor — always here to help!</p>
            </div>
          </div>

          {/* Lesson selector */}
          <div className="relative">
            <button
              onClick={() => setShowLessonPicker(p => !p)}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <BookOpen size={14} />
              <span className="max-w-[140px] truncate">
                {selectedLesson ? selectedLesson.title : 'All topics'}
              </span>
              <ChevronDown size={13} />
            </button>

            {showLessonPicker && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden">
                <div className="p-2">
                  <button
                    onClick={() => { setSelectedLesson(null); setShowLessonPicker(false) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors ${!selectedLesson ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'}`}
                  >
                    🌐 All topics (general)
                  </button>
                  {lessons.map(l => (
                    <button
                      key={l.id}
                      onClick={() => { setSelectedLesson(l); setShowLessonPicker(false) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors ${selectedLesson?.id === l.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'}`}
                    >
                      <div className="font-medium truncate">{l.title}</div>
                      <div className="text-xs text-gray-400 truncate">{l.class.name}</div>
                    </button>
                  ))}
                  {lessons.length === 0 && (
                    <p className="text-xs text-gray-400 px-3 py-2">No published lessons yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedLesson && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-white/70 bg-white/10 rounded-lg px-3 py-1.5 w-fit">
            <BookOpen size={11} />
            Cody has context from: <span className="font-medium text-white">{selectedLesson.title}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={() => setShowLessonPicker(false)}>
        {messages.length === 0 && (
          <>
            <div className="flex gap-3">
              <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white shrink-0">🤖</div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-md shadow-sm border border-gray-100 text-sm text-gray-800">
                Hey! I'm <strong>Cody</strong>, your AI coding tutor! 🎉<br /><br />
                {selectedLesson
                  ? <>I have your lesson <strong>"{selectedLesson.title}"</strong> loaded — ask me anything about it!</>
                  : <>Pick a lesson from the top-right to get help specific to your class materials, or just ask me anything about coding!</>
                }<br /><br />
                Remember — I'll guide you with questions instead of giving you the answer directly. That's how you really learn! 💪
              </div>
            </div>

            <div className="ml-12 flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-brand-400 hover:text-brand-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white ${m.role === 'user' ? 'bg-indigo-500' : 'bg-brand-600'}`}>
              {m.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className={`px-4 py-3 rounded-2xl max-w-md text-sm shadow-sm ${
              m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white shrink-0">🤖</div>
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
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={selectedLesson ? `Ask Cody about ${selectedLesson.topic}…` : 'Ask Cody anything about coding…'}
            className="input flex-1"
          />
          <button
            onClick={startVoice}
            className={`p-2.5 rounded-lg border transition-colors ${listening ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-500 hover:border-brand-400'}`}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="btn-primary px-4 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
