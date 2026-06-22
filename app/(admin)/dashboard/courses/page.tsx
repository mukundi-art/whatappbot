'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Course } from '@/lib/supabase/types'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/courses?all=1')
    const data = await res.json()
    setCourses(data.courses || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function togglePublish(course: Course) {
    await fetch(`/api/courses/${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: course.status === 'published' ? 'draft' : 'published' }),
    })
    load()
  }

  async function deleteCourse(id: string) {
    if (!confirm('Delete this course? This cannot be undone.')) return
    await fetch(`/api/courses/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-headline-md text-on-surface">Courses</h1>
        <Link href="/dashboard/courses/new" className="btn-primary px-5 py-2.5 text-sm shadow-btn">
          + New Course
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-on-surface-variant text-body-md">No courses yet.</p>
          <Link href="/dashboard/courses/new" className="mt-4 inline-block text-primary font-semibold">
            Create your first course →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="card px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">📖</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-headline font-semibold text-on-surface truncate">{course.title}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    course.status === 'published'
                      ? 'bg-tertiary/10 text-tertiary'
                      : 'bg-surface-highest text-on-surface-variant'
                  }`}>
                    {course.status}
                  </span>
                </div>
                {course.description && (
                  <p className="text-sm text-on-surface-variant truncate mt-0.5">{course.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link href={`/dashboard/courses/${course.id}`}
                  className="text-sm font-medium text-primary hover:text-primary-dark px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
                  Edit
                </Link>
                <button onClick={() => togglePublish(course)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    course.status === 'published'
                      ? 'text-on-surface-variant hover:bg-surface-low'
                      : 'text-tertiary hover:bg-tertiary/10'
                  }`}>
                  {course.status === 'published' ? 'Unpublish' : '✅ Publish'}
                </button>
                <button onClick={() => deleteCourse(course.id)}
                  className="text-sm text-error hover:bg-error-container/40 px-3 py-1.5 rounded-lg transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
