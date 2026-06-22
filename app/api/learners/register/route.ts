import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({
      error: `Missing env vars: ${!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!serviceKey ? 'SUPABASE_SERVICE_ROLE_KEY' : ''}`.trim(),
    }, { status: 500 })
  }

  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { full_name, phone, email, language_pref } = body

  if (!full_name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
  }

  try {
    const supabase = createServiceClient()

    // Check if phone already exists
    const { data: existing, error: lookupError } = await supabase
      .from('learners')
      .select('id, full_name, language_pref')
      .eq('phone', phone.trim())
      .single()

    if (lookupError && lookupError.code !== 'PGRST116') {
      // PGRST116 = no rows found — that's fine, means new learner
      return NextResponse.json({ error: `DB lookup error: ${lookupError.message}` }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ id: existing.id, full_name: existing.full_name, language_pref: existing.language_pref })
    }

    const { data, error } = await supabase
      .from('learners')
      .insert({ full_name: full_name.trim(), phone: phone.trim(), email: email?.trim() || null, language_pref: language_pref || 'en' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `DB insert error: ${error.message} (code: ${error.code})` }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Unexpected error: ${message}` }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')
  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })

  try {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Unexpected error: ${message}` }, { status: 500 })
  }
}
