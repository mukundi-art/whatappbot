import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { learner_id, quiz_id, answers, score, total } = await req.json()
  if (!learner_id || !quiz_id) {
    return NextResponse.json({ error: 'learner_id and quiz_id required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({ learner_id, quiz_id, answers, score, total })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attempt: data }, { status: 201 })
}
