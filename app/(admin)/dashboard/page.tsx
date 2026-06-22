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

const CARDS = (s: Stats | null) => [
  { label: 'Total Learners',    value: s?.total_learners ?? '—',                    icon: '👥', accent: 'bg-primary/10 text-primary' },
  { label: 'Active Learners',   value: s?.active_learners ?? '—',                   icon: '🔥', accent: 'bg-secondary/10 text-secondary' },
  { label: 'Published Courses', value: s?.total_courses ?? '—',                     icon: '📚', accent: 'bg-tertiary/10 text-tertiary' },
  { label: 'Avg Quiz Score',    value: s?.avg_score != null ? `${s.avg_score}%` : '—', icon: '🎯', accent: 'bg-secondary-light/20 text-secondary' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics').then((r) => r.json()).then(setStats).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <h1 className="font-headline text-headline-md text-on-surface">Overview</h1>
        <Link href="/dashboard/courses/new" className="btn-primary px-5 py-2.5 text-sm shadow-btn">
          + New Course
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? [...Array(4)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)
          : CARDS(stats).map((card) => (
              <div key={card.label} className="card p-5">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl mb-3 ${card.accent}`}>
                  {card.icon}
                </div>
                <div className="font-headline text-2xl font-semibold text-on-surface">{card.value}</div>
                <div className="text-label-md text-on-surface-variant mt-0.5">{card.label}</div>
              </div>
            ))}
      </div>

      {/* Course table */}
      {stats?.courses && stats.courses.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-surface-high">
            <h2 className="font-headline text-headline-md text-on-surface">Course Performance</h2>
          </div>
          <div className="divide-y divide-surface-high">
            {stats.courses.map((c, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-headline font-semibold text-sm">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-on-surface truncate">{c.title}</div>
                  <div className="text-sm text-on-surface-variant">{c.enrollments} enrolled</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-on-surface">{c.avg_score > 0 ? `${c.avg_score}%` : '—'}</div>
                  <div className="text-xs text-on-surface-variant">avg score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/dashboard/participants"
          className="card p-5 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2 group">
          <span className="text-3xl group-hover:scale-110 transition-transform">👥</span>
          <span className="font-headline font-medium text-on-surface text-sm">Participants</span>
        </Link>
        <Link href="/dashboard/courses"
          className="card p-5 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2 group">
          <span className="text-3xl group-hover:scale-110 transition-transform">📚</span>
          <span className="font-headline font-medium text-on-surface text-sm">Manage Courses</span>
        </Link>
      </div>
    </div>
  )
}
