'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatDate, formatTime } from '@/lib/utils'

interface LearnerDetail {
  id: string
  full_name: string
  phone: string
  email: string | null
  language_pref: string
  created_at: string
  enrollments: { course_title: string; enrolled_at: string }[]
  progress: { lesson_title: string; video_watched: boolean; viewed_at: string }[]
  quiz_attempts: { quiz_id: string; lesson_title: string; score: number; total: number; completed_at: string }[]
}

export default function LearnerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const learnerId = params.learnerId as string
  const [learner, setLearner] = useState<LearnerDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/learners/${learnerId}`)
      .then((r) => r.json())
      .then((d) => setLearner(d.learner))
      .finally(() => setLoading(false))
  }, [learnerId])

  if (loading) {
    return <div className="p-6 text-gray-500 animate-pulse">Loading…</div>
  }

  if (!learner) {
    return <div className="p-6 text-red-500">Participant not found.</div>
  }

  const avgScore = learner.quiz_attempts.length
    ? Math.round(learner.quiz_attempts.reduce((sum, a) => sum + Math.round((a.score / a.total) * 100), 0) / learner.quiz_attempts.length)
    : 0

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/dashboard/participants')} className="text-gray-500 hover:text-gray-700">←</button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{learner.full_name}</h1>
          <p className="text-sm text-gray-500">{learner.phone} {learner.email ? `· ${learner.email}` : ''}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{learner.enrollments.length}</div>
          <div className="text-xs text-gray-500">Courses enrolled</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{learner.progress.length}</div>
          <div className="text-xs text-gray-500">Lessons viewed</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{avgScore > 0 ? `${avgScore}%` : '—'}</div>
          <div className="text-xs text-gray-500">Avg quiz score</div>
        </div>
      </div>

      {/* Enrollments */}
      {learner.enrollments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
          <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800">Enrolled Courses</div>
          <div className="divide-y divide-gray-50">
            {learner.enrollments.map((e, i) => (
              <div key={i} className="px-5 py-3 flex justify-between text-sm">
                <span className="text-gray-800">{e.course_title}</span>
                <span className="text-gray-400">{formatDate(e.enrolled_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lesson progress */}
      {learner.progress.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
          <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800">Lesson Progress</div>
          <div className="divide-y divide-gray-50">
            {learner.progress.map((p, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between text-sm">
                <span className="text-gray-800">{p.lesson_title}</span>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {p.video_watched && <span className="text-green-600">📹 Video watched</span>}
                  <span>{formatDate(p.viewed_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz attempts */}
      {learner.quiz_attempts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800">Quiz Attempts</div>
          <div className="divide-y divide-gray-50">
            {learner.quiz_attempts.map((a, i) => {
              const pct = Math.round((a.score / a.total) * 100)
              return (
                <div key={i} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span className="text-gray-800">{a.lesson_title || 'Quiz'}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {a.score}/{a.total} ({pct}%)
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(a.completed_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {learner.enrollments.length === 0 && learner.progress.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>This learner has not started any lessons yet.</p>
        </div>
      )}
    </div>
  )
}
