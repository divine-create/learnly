'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Brain } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text?: string) {
    const question = text ?? input.trim()
    if (!question || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)

    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, question, history: messages.slice(-10) }),
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">🤖</div>
          <div>
            <h1 className="font-extrabold text-lg">Ask Cody</h1>
            <p className="text-white/80 text-xs">Your AI coding tutor — always here to help!</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <>
            <div className="flex gap-3">
              <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white shrink-0">🤖</div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-md shadow-sm border border-gray-100 text-sm text-gray-800">
                Hey! I'm <strong>Cody</strong>, your AI coding tutor! 🎉<br /><br />
                I can help you understand coding concepts, explain your lessons, and guide you through problems.<br /><br />
                Remember — I'll ask you guiding questions instead of giving you the answer directly. That's how you really learn! 💪<br /><br />
                What do you want to learn today?
              </div>
            </div>

            {/* Suggestions */}
            <div className="ml-12 flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} className="bg-white border border-brand-200 text-brand-700 text-xs px-3 py-2 rounded-full hover:bg-brand-50 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-brand-100 text-brand-600' : 'bg-brand-600 text-white'}`}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className={`max-w-md px-4 py-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white">🤖</div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 flex gap-1">
              {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask Cody a question…"
            disabled={loading}
          />
          <button
            onClick={startVoice}
            className={`p-2.5 rounded-lg border transition-colors ${listening ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button onClick={() => send()} disabled={loading || !input.trim()} className="btn-primary px-4">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
