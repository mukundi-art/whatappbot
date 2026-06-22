import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { module_id, title, sort_order } = await req.json()
  if (!module_id || !title) return NextResponse.json({ error: 'module_id and title required' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('lessons')
    .insert({ module_id, title, sort_order: sort_order ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data }, { status: 201 })
}
