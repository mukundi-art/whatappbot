import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get('all')
  const supabase = createServiceClient()

  let query = supabase.from('courses').select('*').order('created_at', { ascending: false })
  if (!all) query = query.eq('status', 'published')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ courses: data })
}

export async function POST(req: NextRequest) {
  const { title, description } = await req.json()
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('courses')
    .insert({ title, description: description || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ course: data }, { status: 201 })
}
