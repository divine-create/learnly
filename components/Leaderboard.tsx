'use client'
import { useState, useEffect } from 'react'
import { Trophy, Flame, Star } from 'lucide-react'
import { xpToLevel } from '@/lib/utils'

type Entry = { rank: number; studentId: string; name: string; gradeLevel: string | null; totalXp: number; streakDays: number; isCurrentUser: boolean }

interface Props { classId?: string; scope?: 'school' | 'class' | 'global' }

export default function Leaderboard({ classId, scope = 'school' }: Props) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (classId) params.set('classId', classId)
    params.set('scope', scope)
    fetch(`/api/leaderboard?${params}`).then(r => r.json()).then(d => { setEntries(d); setLoading(false) })
  }, [classId, scope])

  const MEDALS = ['🥇', '🥈', '🥉']

  if (loading) return <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}</div>

  if (entries.length === 0) return (
    <div className="text-center py-8 text-gray-400">
      <Trophy size={40} className="mx-auto mb-2 opacity-30" />
      <p className="text-sm">No data yet. Complete quizzes to appear!</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {entries.map(entry => {
        const { title } = xpToLevel(entry.totalXp)
        return (
          <div
            key={entry.studentId}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              entry.isCurrentUser
                ? 'bg-brand-600 text-white ring-2 ring-brand-300'
                : entry.rank <= 3
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-gray-50 border border-gray-100'
            }`}
          >
            <div className="w-8 text-center font-bold text-lg shrink-0">
              {entry.rank <= 3 ? MEDALS[entry.rank - 1] : <span className={`text-sm ${entry.isCurrentUser ? 'text-white' : 'text-gray-500'}`}>#{entry.rank}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-sm truncate ${entry.isCurrentUser ? 'text-white' : 'text-gray-900'}`}>
                {entry.name} {entry.isCurrentUser && '(You)'}
              </div>
              <div className={`text-xs ${entry.isCurrentUser ? 'text-white/70' : 'text-gray-500'}`}>{title} · {entry.gradeLevel}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {entry.streakDays > 0 && (
                <div className={`flex items-center gap-0.5 text-xs font-medium ${entry.isCurrentUser ? 'text-orange-200' : 'text-orange-500'}`}>
                  <Flame size={12} />{entry.streakDays}
                </div>
              )}
              <div className={`font-extrabold text-sm ${entry.isCurrentUser ? 'text-white' : 'text-brand-600'}`}>
                {entry.totalXp} XP
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
