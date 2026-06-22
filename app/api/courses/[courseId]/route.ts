import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { courseId: string } }) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.courseId)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ course: data })
}

export async function PATCH(req: NextRequest, { params }: { params: { courseId: string } }) {
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('courses')
    .update(body)
    .eq('id', params.courseId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ course: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { courseId: string } }) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('courses').delete().eq('id', params.courseId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
