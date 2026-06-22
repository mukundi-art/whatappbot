import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient()

  const [
    { count: total_learners },
    { count: total_courses },
    { data: courses },
    { data: attempts },
    { data: active },
  ] = await Promise.all([
    supabase.from('learners').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('courses').select('id, title').eq('status', 'published'),
    supabase.from('quiz_attempts').select('score, total'),
    supabase.from('enrollments').select('learner_id'),
  ])

  const avg_score =
    attempts && attempts.length
      ? Math.round(attempts.reduce((sum, a) => sum + Math.round((a.score / (a.total || 1)) * 100), 0) / attempts.length)
      : 0

  const active_learners = new Set((active || []).map((e) => e.learner_id)).size

  // Per-course stats
  const courseStats = await Promise.all(
    (courses || []).map(async (c) => {
      const { count: enrollments } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', c.id)

      return { title: c.title, enrollments: enrollments || 0, avg_score: 0 }
    })
  )

  return NextResponse.json({
    total_learners: total_learners || 0,
    active_learners,
    total_courses: total_courses || 0,
    avg_score,
    courses: courseStats,
  })
}
