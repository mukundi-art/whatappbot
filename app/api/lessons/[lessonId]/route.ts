import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { lessonId: string } }) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', params.lessonId)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ lesson: data })
}

export async function PATCH(req: NextRequest, { params }: { params: { lessonId: string } }) {
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('lessons')
    .update(body)
    .eq('id', params.lessonId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { lessonId: string } }) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('lessons').delete().eq('id', params.lessonId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
