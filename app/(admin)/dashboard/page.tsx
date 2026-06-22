'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Stats {
  total_learners: number
  active_learners: number
  total_courses: number
  avg_score: number
  courses: { title: string; enrollments: number; avg_score: number }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Learners', value: stats?.total_learners ?? '—', icon: '👥', color: 'bg-blue-50 text-blue-700' },
    { label: 'Active Learners', value: stats?.active_learners ?? '—', icon: '🔥', color: 'bg-orange-50 text-orange-700' },
    { label: 'Published Courses', value: stats?.total_courses ?? '—', icon: '📚', color: 'bg-green-50 text-green-700' },
    { label: 'Avg Quiz Score', value: stats?.avg_score != null ? `${stats.avg_score}%` : '—', icon: '🎯', color: 'bg-purple-50 text-purple-700' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <Link
          href="/dashboard/courses/new"
          className="bg-ambani-500 hover:bg-ambani-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          + New Course
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 text-xl ${card.color}`}>
                {card.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Per-course breakdown */}
      {stats?.courses && stats.courses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Course Performance</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.courses.map((c, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{c.title}</div>
                  <div className="text-sm text-gray-500">{c.enrollments} enrolled</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-gray-900">{c.avg_score > 0 ? `${c.avg_score}%` : '—'}</div>
                  <div className="text-xs text-gray-400">avg score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-4">
        <Link href="/dashboard/participants" className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4 text-center transition-colors">
          <div className="text-2xl mb-1">👥</div>
          <div className="font-medium text-gray-800">View Participants</div>
        </Link>
        <Link href="/dashboard/courses" className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4 text-center transition-colors">
          <div className="text-2xl mb-1">📚</div>
          <div className="font-medium text-gray-800">Manage Courses</div>
        </Link>
      </div>
    </div>
  )
}
