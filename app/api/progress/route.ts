import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { learner_id, lesson_id } = await req.json()
  if (!learner_id || !lesson_id) {
    return NextResponse.json({ error: 'learner_id and lesson_id required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('progress')
    .upsert({ learner_id, lesson_id }, { onConflict: 'learner_id,lesson_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const { learner_id, lesson_id, video_watched } = await req.json()
  if (!learner_id || !lesson_id) {
    return NextResponse.json({ error: 'learner_id and lesson_id required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('progress')
    .upsert({ learner_id, lesson_id, video_watched }, { onConflict: 'learner_id,lesson_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
