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
    fetch('/api/learners')
      .then((r) => r.json())
      .then((d) => setLearners(d.learners || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = learners.filter(
    (l) =>
      l.full_name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search)
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
        <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
        <button
          onClick={exportCSV}
          className="text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          ⬇ Export CSV
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ambani-400 max-w-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">👥</div>
          <p>{search ? 'No participants match your search.' : 'No participants yet.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Language</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Enrolled</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Lessons</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Avg Score</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                  <th className="text-left px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{l.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{l.phone}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {l.language_pref === 'zu' ? 'isiZulu' : 'English'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{l.enrollments_count}</td>
                    <td className="px-4 py-3 text-gray-600">{l.completed_lessons}</td>
                    <td className="px-4 py-3 text-gray-600">{l.avg_score > 0 ? `${l.avg_score}%` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(l.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/participants/${l.id}`} className="text-ambani-600 hover:text-ambani-700 font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
            {filtered.length} participant{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
