import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { learner_id, course_id } = await req.json()
  if (!learner_id || !course_id) {
    return NextResponse.json({ error: 'learner_id and course_id required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Upsert — idempotent enrollment
  const { data, error } = await supabase
    .from('enrollments')
    .upsert({ learner_id, course_id }, { onConflict: 'learner_id,course_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ enrollment: data }, { status: 201 })
}
