import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { learnerId: string } }) {
  const supabase = createServiceClient()
  const { learnerId } = params

  const { data: learner, error } = await supabase
    .from('learners')
    .select('*')
    .eq('id', learnerId)
    .single()

  if (error || !learner) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Enrollments with course title
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('enrolled_at, courses(title)')
    .eq('learner_id', learnerId)
    .order('enrolled_at', { ascending: false })

  // Progress with lesson title
  const { data: progress } = await supabase
    .from('progress')
    .select('video_watched, viewed_at, lessons(title)')
    .eq('learner_id', learnerId)
    .order('viewed_at', { ascending: false })

  // Quiz attempts with lesson info
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('quiz_id, score, total, completed_at, quizzes(lesson_id, lessons(title))')
    .eq('learner_id', learnerId)
    .order('completed_at', { ascending: false })

  return NextResponse.json({
    learner: {
      ...learner,
      enrollments: (enrollments || []).map((e: any) => ({
        course_title: e.courses?.title || 'Unknown',
        enrolled_at: e.enrolled_at,
      })),
      progress: (progress || []).map((p: any) => ({
        lesson_title: p.lessons?.title || 'Unknown',
        video_watched: p.video_watched,
        viewed_at: p.viewed_at,
      })),
      quiz_attempts: (attempts || []).map((a: any) => ({
        quiz_id: a.quiz_id,
        lesson_title: a.quizzes?.lessons?.title || 'Quiz',
        score: a.score,
        total: a.total,
        completed_at: a.completed_at,
      })),
    },
  })
}
