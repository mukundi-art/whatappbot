'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Course, Module, Lesson } from '@/lib/supabase/types'

interface ModuleWithLessons extends Module {
  lessons: Lesson[]
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleWithLessons[]>([])
  const [loading, setLoading] = useState(true)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [addingModule, setAddingModule] = useState(false)
  const [newLessonTitle, setNewLessonTitle] = useState<Record<string, string>>({})
  const [addingLesson, setAddingLesson] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [cr, mr] = await Promise.all([
      fetch(`/api/courses/${courseId}`),
      fetch(`/api/courses/${courseId}/modules`),
    ])
    const cd = await cr.json()
    const md = await mr.json()
    setCourse(cd.course)
    setModules(md.modules || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [courseId])

  async function addModule(e: React.FormEvent) {
    e.preventDefault()
    if (!newModuleTitle.trim()) return
    setSaving(true)
    await fetch('/api/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId, title: newModuleTitle, sort_order: modules.length }),
    })
    setNewModuleTitle('')
    setAddingModule(false)
    setSaving(false)
    load()
  }

  async function addLesson(moduleId: string) {
    const title = newLessonTitle[moduleId]
    if (!title?.trim()) return
    setSaving(true)
    const mod = modules.find((m) => m.id === moduleId)
    await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_id: moduleId, title, sort_order: (mod?.lessons?.length || 0) }),
    })
    setNewLessonTitle({ ...newLessonTitle, [moduleId]: '' })
    setAddingLesson(null)
    setSaving(false)
    load()
  }

  async function deleteModule(id: string) {
    if (!confirm('Delete this module and all its lessons?')) return
    await fetch(`/api/modules/${id}`, { method: 'DELETE' })
    load()
  }

  async function publishCourse() {
    await fetch(`/api/courses/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: course?.status === 'published' ? 'draft' : 'published' }),
    })
    load()
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start gap-3 mb-6">
        <button onClick={() => router.push('/dashboard/courses')} className="text-gray-500 hover:text-gray-700 mt-1">←</button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{course?.title}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              course?.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {course?.status}
            </span>
          </div>
          {course?.description && <p className="text-gray-500 text-sm mt-1">{course.description}</p>}
        </div>
        <button
          onClick={publishCourse}
          className={`shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
            course?.status === 'published'
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {course?.status === 'published' ? 'Unpublish' : '✅ Publish'}
        </button>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        {modules.map((mod, modIdx) => (
          <div key={mod.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
              <span className="text-gray-400 text-sm font-mono">M{modIdx + 1}</span>
              <h3 className="font-semibold text-gray-800 flex-1">{mod.title}</h3>
              <button onClick={() => deleteModule(mod.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
            </div>

            <div className="divide-y divide-gray-50">
              {mod.lessons?.map((lesson, lesIdx) => (
                <div key={lesson.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-gray-300 text-sm font-mono w-5">{lesIdx + 1}</span>
                  <span className="flex-1 text-sm text-gray-700">{lesson.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    lesson.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {lesson.status}
                  </span>
                  <Link
                    href={`/dashboard/courses/${courseId}/lessons/${lesson.id}`}
                    className="text-sm text-ambani-600 hover:text-ambani-700 font-medium"
                  >
                    Edit →
                  </Link>
                </div>
              ))}
            </div>

            {/* Add lesson */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              {addingLesson === mod.id ? (
                <form onSubmit={(e) => { e.preventDefault(); addLesson(mod.id) }} className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newLessonTitle[mod.id] || ''}
                    onChange={(e) => setNewLessonTitle({ ...newLessonTitle, [mod.id]: e.target.value })}
                    placeholder="Lesson title…"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ambani-400"
                  />
                  <button type="submit" disabled={saving} className="bg-ambani-500 text-white text-sm px-3 py-1.5 rounded-lg">Add</button>
                  <button type="button" onClick={() => setAddingLesson(null)} className="text-gray-400 text-sm px-2">Cancel</button>
                </form>
              ) : (
                <button
                  onClick={() => setAddingLesson(mod.id)}
                  className="text-sm text-ambani-600 hover:text-ambani-700 font-medium"
                >
                  + Add Lesson
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add module */}
        {addingModule ? (
          <form onSubmit={addModule} className="bg-white rounded-xl border-2 border-dashed border-ambani-300 p-4 flex gap-2">
            <input
              type="text"
              autoFocus
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="Module title…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ambani-400"
            />
            <button type="submit" disabled={saving} className="bg-ambani-500 text-white text-sm px-4 py-2 rounded-lg">Add</button>
            <button type="button" onClick={() => setAddingModule(false)} className="text-gray-400 text-sm px-2">Cancel</button>
          </form>
        ) : (
          <button
            onClick={() => setAddingModule(true)}
            className="w-full border-2 border-dashed border-gray-200 hover:border-ambani-300 text-gray-500 hover:text-ambani-600 py-4 rounded-xl text-sm font-medium transition-colors"
          >
            + Add Module
          </button>
        )}
      </div>
    </div>
  )
}
