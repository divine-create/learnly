'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Clock, Trophy, ArrowRight, CheckCircle, XCircle, Home } from 'lucide-react'
import { formatTime } from '@/lib/utils'

type Question = {
  id: string; type: string; question: string;
  options: string[]; correctIndex: number; explanation: string; xp: number
}
type Quiz = {
  id: string; title: string; timeLimitSeconds: number; totalXp: number;
  lesson: { title: string; topic: string }
  questions: Question[]
}
type Result = {
  questionId: string; selected: number; correct: number;
  isCorrect: boolean; explanation: string; xp: number
}

type Phase = 'intro' | 'quiz' | 'result'

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [phase, setPhase] = useState<Phase>('intro')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [score, setScore] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [earnedBadges, setEarnedBadges] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    fetch(`/api/quiz/${quizId}`).then(r => r.json()).then(q => {
      setQuiz({ ...q, questions: q.questions.map((qu: any) => ({ ...qu, options: JSON.parse(qu.options) })) })
      setTimeLeft(q.timeLimitSeconds)
    })
    return () => clearInterval(timerRef.current)
  }, [quizId])

  function startQuiz() {
    setPhase('quiz')
    setStartTime(Date.now())
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); submitQuiz(answers); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function selectAnswer(idx: number) {
    if (confirmed) return
    setSelected(idx)
  }

  function confirmAnswer() {
    if (selected === null || confirmed) return
    setConfirmed(true)
    setAnswers(prev => [...prev, selected])
  }

  function nextQuestion() {
    if (current + 1 >= (quiz?.questions.length ?? 0)) {
      clearInterval(timerRef.current)
      submitQuiz([...answers])
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setConfirmed(false)
    }
  }

  async function submitQuiz(finalAnswers: number[]) {
    if (!quiz) return
    const timeTaken = Math.round((Date.now() - startTime) / 1000)

    const res = await fetch(`/api/quiz/${quizId}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: finalAnswers, timeTaken }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error('Error submitting quiz'); return }

    clearInterval(timerRef.current)
    setResults(data.results)
    setScore(data.score)
    setXpEarned(data.xpEarned)
    setEarnedBadges(data.earnedBadges ?? [])
    setPhase('result')
    if (data.score >= 80) setShowConfetti(true)
  }

  if (!quiz) return <div className="p-8 text-gray-400">Loading quiz…</div>

  const q = quiz.questions[current]

  /* ---- INTRO ---- */
  if (phase === 'intro') return (
    <div className="min-h-full flex items-center justify-center p-8 bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl mb-6">🎯</div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{quiz.title}</h1>
        <p className="text-gray-600 mb-6">{quiz.lesson.topic}</p>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-brand-600">{quiz.questions.length}</div>
            <div className="text-xs text-gray-500">Questions</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-brand-600">{formatTime(quiz.timeLimitSeconds)}</div>
            <div className="text-xs text-gray-500">Time limit</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-brand-600">{quiz.totalXp}</div>
            <div className="text-xs text-gray-500">XP available</div>
          </div>
        </div>
        <button onClick={startQuiz} className="btn-primary text-lg px-10 py-4 rounded-2xl w-full">
          🚀 Start Quiz!
        </button>
        <Link href={`/student/classes`} className="block mt-4 text-sm text-gray-500 hover:text-gray-700">
          ← Back to classes
        </Link>
      </div>
    </div>
  )

  /* ---- QUIZ ---- */
  if (phase === 'quiz') return (
    <div className="min-h-full flex flex-col bg-gradient-to-br from-brand-50 to-indigo-50 p-4 md:p-8">
      {/* Progress + timer */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-700">{current + 1} / {quiz.questions.length}</span>
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div className="bg-brand-600 rounded-full h-2 transition-all" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
          </div>
        </div>
        <div className={`flex items-center gap-2 font-bold text-lg ${timeLeft < 30 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
          <Clock size={20} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        <div className="w-full bg-white rounded-3xl shadow-lg p-8 mb-6">
          <div className="text-xs text-brand-600 font-bold uppercase tracking-wide mb-3">Question {current + 1}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-8">{q.question}</h2>

          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-sm font-medium transition-all ${
                  !confirmed
                    ? selected === i
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 hover:border-brand-300 text-gray-700'
                    : i === q.correctIndex
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : selected === i && i !== q.correctIndex
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-400'
                }`}
              >
                <span className="font-bold mr-3">{String.fromCharCode(65 + i)}.</span>
                {opt}
                {confirmed && i === q.correctIndex && <CheckCircle size={16} className="inline ml-2 text-green-500" />}
                {confirmed && selected === i && i !== q.correctIndex && <XCircle size={16} className="inline ml-2 text-red-500" />}
              </button>
            ))}
          </div>

          {confirmed && (
            <div className={`mt-4 p-3 rounded-xl text-sm ${selected === q.correctIndex ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <strong>{selected === q.correctIndex ? '✅ Correct!' : '❌ Not quite.'}</strong> {q.explanation}
            </div>
          )}
        </div>

        {!confirmed ? (
          <button
            onClick={confirmAnswer}
            disabled={selected === null}
            className="btn-primary text-base px-10 py-4 rounded-2xl disabled:opacity-50"
          >
            Confirm Answer
          </button>
        ) : (
          <button onClick={nextQuestion} className="btn-primary text-base px-10 py-4 rounded-2xl flex items-center gap-2">
            {current + 1 < quiz.questions.length ? 'Next Question' : 'See Results'}
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  )

  /* ---- RESULT ---- */
  const emoji = score >= 80 ? '🎉' : score >= 60 ? '😊' : '💪'
  const msg = score >= 80 ? 'Amazing work!' : score >= 60 ? 'Good job!' : 'Keep practising!'

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-teal-50">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl mb-4">{emoji}</div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{score}%</h1>
        <p className="text-xl text-gray-700 mb-2">{msg}</p>
        <p className="text-brand-600 font-bold text-lg mb-6">+{xpEarned} XP earned! 🚀</p>

        {earnedBadges.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <p className="font-bold text-yellow-800 mb-2">🏆 New Badges!</p>
            {earnedBadges.map(b => (
              <div key={b} className="text-yellow-700 text-sm">{b}</div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{results.filter(r => r.isCorrect).length}</div>
            <div className="text-xs text-gray-500">Correct</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-500">{results.filter(r => !r.isCorrect).length}</div>
            <div className="text-xs text-gray-500">Wrong</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-brand-600">{xpEarned}</div>
            <div className="text-xs text-gray-500">XP</div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/student" className="btn-secondary flex-1 py-3 text-center flex items-center justify-center gap-2">
            <Home size={16} /> Home
          </Link>
          <Link href="/student/classes" className="btn-primary flex-1 py-3 text-center">
            More Classes →
          </Link>
        </div>
      </div>
    </div>
  )
}
