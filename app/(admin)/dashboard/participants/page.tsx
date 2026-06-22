'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Learner } from '@/lib/supabase/types'

interface LearnerWithStats extends Learner {
  enrollments_count: number
  completed_lessons: number
  avg_score: number
}

export default function ParticipantsPage() {
  const [learners, setLearners] = useState<LearnerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/learners').then((r) => r.json()).then((d) => setLearners(d.learners || [])).finally(() => setLoading(false))
  }, [])

  const filtered = learners.filter(
    (l) => l.full_name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search)
  )

  async function exportCSV() {
    const res = await fetch('/api/export/participants')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ambani-participants-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-headline-md text-on-surface">Participants</h1>
        <button onClick={exportCSV}
          className="btn-outline text-sm px-4 py-2.5">
          ⬇ Export CSV
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="field max-w-xs"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-on-surface-variant text-body-md">
            {search ? 'No participants match your search.' : 'No participants yet.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-low border-b border-surface-high">
                <tr>
                  {['Name', 'Phone', 'Language', 'Enrolled', 'Lessons', 'Avg Score', 'Joined', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-label-md text-on-surface-variant font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-high">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-surface-low/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-on-surface">{l.full_name}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{l.phone}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                        {l.language_pref === 'zu' ? 'isiZulu' : 'English'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{l.enrollments_count}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{l.completed_lessons}</td>
                    <td className="px-4 py-3">
                      {l.avg_score > 0 ? (
                        <span className={`font-semibold ${l.avg_score >= 80 ? 'text-tertiary' : l.avg_score >= 60 ? 'text-secondary' : 'text-error'}`}>
                          {l.avg_score}%
                        </span>
                      ) : <span className="text-on-surface-variant">—</span>}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{formatDate(l.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/participants/${l.id}`} className="text-primary font-semibold hover:text-primary-dark text-sm">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-surface-high bg-surface-low text-xs text-on-surface-variant">
            {filtered.length} participant{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
