'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'

type Flashcard = { id: string; front: string; back: string }

export default function FlashcardsPage() {
  const params = useParams()
  const lessonId = params.lessonId as string

  const [cards, setCards] = useState<Flashcard[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/flashcards?lessonId=${lessonId}`).then(r => r.json()).then(d => { setCards(d); setLoading(false) })
  }, [lessonId])

  function next() { setFlipped(false); setTimeout(() => setCurrent(c => Math.min(c + 1, cards.length - 1)), 100) }
  function prev() { setFlipped(false); setTimeout(() => setCurrent(c => Math.max(c - 1, 0)), 100) }
  function shuffle() {
    setCards(prev => [...prev].sort(() => Math.random() - 0.5))
    setCurrent(0)
    setFlipped(false)
  }

  if (loading) return <div className="p-8 text-gray-400">Loading flashcards…</div>

  if (cards.length === 0) return (
    <div className="p-8 text-center">
      <div className="text-5xl mb-4">📭</div>
      <h2 className="font-bold text-gray-700 mb-2">No flashcards yet</h2>
      <p className="text-gray-500 text-sm">Your teacher needs to generate flashcards for this lesson first.</p>
      <Link href="/student/classes" className="btn-primary mt-4 inline-block">Back to Classes</Link>
    </div>
  )

  const card = cards[current]

  return (
    <div className="p-6 md:p-8 flex flex-col items-center min-h-full bg-gradient-to-br from-brand-50 to-indigo-50">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <Link href="/student/classes" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="text-sm text-gray-500 font-medium">{current + 1} / {cards.length}</div>
          <button onClick={shuffle} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
            <RotateCcw size={14} /> Shuffle
          </button>
        </div>

        {/* Progress bar */}
        <div className="bg-gray-200 rounded-full h-2 mb-6">
          <div className="bg-brand-600 rounded-full h-2 transition-all" style={{ width: `${((current + 1) / cards.length) * 100}%` }} />
        </div>

        {/* Card */}
        <div
          className="cursor-pointer"
          onClick={() => setFlipped(f => !f)}
          style={{ perspective: '1000px' }}
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', minHeight: '280px' }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-xs uppercase tracking-widest text-brand-400 font-bold mb-4">Question / Term</div>
              <div className="text-xl font-bold text-gray-900">{card.front}</div>
              <div className="mt-6 text-sm text-gray-400">Tap to reveal answer</div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-brand-600 to-indigo-700 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="text-xs uppercase tracking-widest text-white/60 font-bold mb-4">Answer</div>
              <div className="text-xl font-bold text-white">{card.back}</div>
              <div className="mt-6 text-sm text-white/60">Tap to flip back</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={prev}
            disabled={current === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl shadow-sm border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={18} /> Prev
          </button>

          <div className="flex gap-1.5">
            {cards.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-brand-600 w-4' : 'bg-gray-300'}`} />
            ))}
          </div>

          <button
            onClick={next}
            disabled={current === cards.length - 1}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 rounded-2xl shadow-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40 transition-colors"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>

        {current === cards.length - 1 && (
          <div className="mt-6 text-center bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="text-2xl mb-1">🎉</div>
            <div className="font-bold text-green-800">You've reviewed all cards!</div>
            <button onClick={() => { setCurrent(0); setFlipped(false) }} className="text-brand-600 text-sm hover:underline mt-1">Start over</button>
          </div>
        )}
      </div>
    </div>
  )
}
