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
      .then((d) => setCourses(d.courses || []))
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

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="bg-primary px-6 pt-10 pb-14">
        <div className="flex items-center justify-between mb-1">
          <span className="font-headline text-white font-semibold text-base">Ambani Learn</span>
          <button
            onClick={() => { localStorage.clear(); router.push('/register') }}
            className="text-white/70 text-xs hover:text-white"
          >
            Switch learner
          </button>
        </div>
        <p className="text-primary-on-container text-sm opacity-80">Welcome back,</p>
        <h1 className="font-headline text-white text-headline-lg-mob font-semibold mt-0.5">
          {learner?.name} 👋
        </h1>
      </div>

      {/* Content pulled up */}
      <div className="flex-1 -mt-8 bg-surface rounded-t-2xl px-4 pt-6 pb-10">
        <h2 className="font-headline text-headline-md text-on-surface mb-4 px-1">Available Courses</h2>

        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="card h-52 animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-on-surface-variant text-body-md">No courses published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-lg mx-auto">
            {courses.map((course) => (
              <div key={course.id} className="card overflow-hidden">
                {/* Cover / banner */}
                {course.cover_url ? (
                  <div className="h-36 bg-surface-high overflow-hidden">
                    <img src={course.cover_url} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-28 bg-gradient-to-br from-primary to-tertiary flex items-center justify-center">
                    <span className="text-5xl opacity-70">📖</span>
                  </div>
                )}

                <div className="p-5">
                  <h3 className="font-headline text-headline-md text-on-surface">{course.title}</h3>
                  {course.description && (
                    <p className="text-body-md text-on-surface-variant mt-1 line-clamp-2">{course.description}</p>
                  )}

                  <div className="flex items-center gap-2 mt-3 mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      {learner?.language === 'zu' ? 'isiZulu' : 'English'}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary-light/20 text-secondary">
                      Micro-learning
                    </span>
                  </div>

                  <button
                    onClick={() => enroll(course.id)}
                    className="btn-primary w-full shadow-btn"
                  >
                    Start Course →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
