import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { full_name, phone, email, language_pref } = body

  if (!full_name || !phone) {
    return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Check if phone already exists
  const { data: existing } = await supabase
    .from('learners')
    .select('id, full_name, language_pref')
    .eq('phone', phone)
    .single()

  if (existing) {
    // Return existing learner (allow re-registration with same phone)
    return NextResponse.json({ id: existing.id, full_name: existing.full_name, language_pref: existing.language_pref })
  }

  const { data, error } = await supabase
    .from('learners')
    .insert({ full_name, phone, email: email || null, language_pref: language_pref || 'en' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')
  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('learners')
    .select('id, full_name, language_pref')
    .eq('phone', phone)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Phone number not found. Please register first.' }, { status: 404 })
  }

  return NextResponse.json(data)
}
