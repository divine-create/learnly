'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Zap, CheckCircle, Trophy, ArrowRight } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { ssr: false })

type Challenge = {
  id: string; title: string; description: string; language: string;
  starterCode: string; xp: number; difficulty: string; date: string
  attempts: Array<{ passed: boolean; code: string }>
}

const DIFF_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

export default function DailyChallengePage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [code, setCode] = useState('')
  const [result, setResult] = useState<{ passed: boolean; xpEarned: number; solution?: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/daily-challenge').then(r => r.json()).then(d => {
      setChallenge(d)
      setCode(d.attempts?.[0]?.code ?? d.starterCode)
      if (d.attempts?.[0]?.passed) {
        setResult({ passed: true, xpEarned: 0 })
      }
      setLoading(false)
    })
  }, [])

  async function submit() {
    if (!challenge) return
    setSubmitting(true)
    const res = await fetch('/api/daily-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: challenge.id, code }),
    })
    const data = await res.json()
    setSubmitting(false)
    setResult(data)
    if (data.passed) toast.success(`🎉 Correct! +${data.xpEarned} XP!`)
    else toast.error('Not quite right. Try again or view the solution.')
  }

  if (loading) return <div className="p-8 text-gray-400">Loading today's challenge…</div>
  if (!challenge) return <div className="p-8 text-gray-500">No challenge available today.</div>

  const alreadySolved = challenge.attempts?.[0]?.passed

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={22} className="text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900">Daily Challenge</h1>
          <span className={`badge ${DIFF_COLORS[challenge.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>{challenge.difficulty}</span>
        </div>
        <p className="text-gray-500 text-sm">{challenge.date} · Complete for +{challenge.xp} XP bonus</p>
      </div>

      {alreadySolved && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle size={24} className="text-green-500" />
          <div>
            <div className="font-bold text-green-800">Challenge completed! ✅</div>
            <div className="text-green-600 text-sm">You already solved today's challenge. Come back tomorrow!</div>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">{challenge.title}</h2>
        <p className="text-gray-700 mb-4">{challenge.description}</p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Trophy size={14} className="text-yellow-500" />
          <span>Earn <strong className="text-brand-600">+{challenge.xp} XP</strong> for completing this</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="label">Your Code</label>
        <CodeEditor
          value={code}
          onChange={setCode}
          language={challenge.language}
          height="250px"
          readOnly={alreadySolved}
        />
      </div>

      {!alreadySolved && (
        <button onClick={submit} disabled={submitting} className="btn-primary w-full py-3 text-base mb-4">
          {submitting ? 'Checking…' : '🚀 Submit Solution'}
        </button>
      )}

      {result && !result.passed && result.solution && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">💡 One possible solution:</h3>
          <CodeEditor value={result.solution} language={challenge.language} height="120px" readOnly />
        </div>
      )}

      {result?.passed && (
        <div className="card bg-green-50 border-green-200 text-center py-6">
          <div className="text-5xl mb-3">🎉</div>
          <div className="font-extrabold text-green-800 text-xl">You solved it!</div>
          {result.xpEarned > 0 && <div className="text-brand-600 font-bold mt-1">+{result.xpEarned} XP earned!</div>}
          <Link href="/student" className="btn-primary mt-4 inline-flex items-center gap-2">
            Back to Home <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  )
}
