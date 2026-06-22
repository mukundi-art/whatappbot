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
    const newStatus = course.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/courses/${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
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
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <Link
          href="/dashboard/courses/new"
          className="bg-ambani-500 hover:bg-ambani-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          + New Course
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p>No courses yet. Create your first one!</p>
          <Link href="/dashboard/courses/new" className="mt-4 inline-block text-ambani-600 font-medium">Create Course →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{course.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {course.status}
                  </span>
                </div>
                {course.description && <p className="text-sm text-gray-500 truncate mt-0.5">{course.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/dashboard/courses/${course.id}`}
                  className="text-sm text-ambani-600 hover:text-ambani-700 font-medium px-3 py-1.5 rounded-lg hover:bg-ambani-50"
                >
                  Edit
                </Link>
                <button
                  onClick={() => togglePublish(course)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    course.status === 'published'
                      ? 'text-gray-500 hover:bg-gray-100'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {course.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="text-sm text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50"
                >
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
