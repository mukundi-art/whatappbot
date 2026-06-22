'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCoursePage() {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create course')
      router.push(`/dashboard/courses/${data.course.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-on-surface-variant hover:text-on-surface transition-colors text-xl">←</button>
        <h1 className="font-headline text-headline-md text-on-surface">New Course</h1>
      </div>

      <div className="card p-6">
        {error && (
          <div className="mb-4 bg-error-container border border-error/30 text-error text-sm rounded-lg px-4 py-3">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-label-md text-on-surface mb-1.5">Course Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Spaza Shop Owner Masterclass"
              className="field"
            />
          </div>
          <div>
            <label className="block text-label-md text-on-surface mb-1.5">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What will learners gain from this course?"
              className="field resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 shadow-btn">
              {loading ? 'Creating…' : 'Create Course →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
