'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLearnerFromStorage } from '@/lib/utils'
import type { Course } from '@/lib/supabase/types'

export default function CoursesPage() {
  const router = useRouter()
  const [learner, setLearner] = useState<{ id: string; name: string; language: string } | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const l = getLearnerFromStorage()
    if (!l) { router.replace('/register'); return }
    setLearner(l)
    fetch('/api/courses')
      .then((r) => r.json())
      .then((data) => setCourses(data.courses || []))
      .finally(() => setLoading(false))
  }, [router])

  async function enroll(courseId: string) {
    if (!learner) return
    await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learner_id: learner.id, course_id: courseId }),
    })
    router.push(`/chat/${courseId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ambani-50">
        <div className="text-ambani-600 text-lg animate-pulse">Loading courses…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-ambani-500 text-white px-4 py-5">
        <div className="max-w-lg mx-auto">
          <p className="text-ambani-100 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-bold">{learner?.name} 👋</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Courses</h2>

        {courses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p>No courses published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {course.cover_url && (
                  <div className="h-36 bg-ambani-100 overflow-hidden">
                    <img src={course.cover_url} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                {!course.cover_url && (
                  <div className="h-24 bg-gradient-to-r from-ambani-400 to-chat-500 flex items-center justify-center">
                    <span className="text-4xl">📖</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-lg">{course.title}</h3>
                  {course.description && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{course.description}</p>
                  )}
                  <button
                    onClick={() => enroll(course.id)}
                    className="mt-4 w-full bg-ambani-500 hover:bg-ambani-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    Start Course →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => { localStorage.clear(); router.push('/register') }}
          className="mt-8 w-full text-sm text-gray-400 hover:text-gray-600 text-center"
        >
          Switch learner / Sign out
        </button>
      </div>
    </div>
  )
}
