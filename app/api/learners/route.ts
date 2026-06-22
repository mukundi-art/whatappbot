import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient()

  const { data: learners, error } = await supabase
    .from('learners')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with stats
  const enriched = await Promise.all(
    (learners || []).map(async (l) => {
      const [{ count: enrollCount }, { count: progressCount }, { data: attempts }] = await Promise.all([
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('learner_id', l.id),
        supabase.from('progress').select('*', { count: 'exact', head: true }).eq('learner_id', l.id),
        supabase.from('quiz_attempts').select('score, total').eq('learner_id', l.id),
      ])
      const avgScore =
        attempts && attempts.length
          ? Math.round(attempts.reduce((sum, a) => sum + Math.round((a.score / a.total) * 100), 0) / attempts.length)
          : 0
      return {
        ...l,
        enrollments_count: enrollCount || 0,
        completed_lessons: progressCount || 0,
        avg_score: avgScore,
      }
    })
  )

  return NextResponse.json({ learners: enriched })
}
