import { NextResponse } from 'next/server'

function normaliseUrl(raw: string | undefined): string {
  if (!raw) return ''
  let url = raw.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`
  return url.replace(/\/+$/, '')
}

export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const normUrl = normaliseUrl(rawUrl)

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL:      rawUrl   ? '✅ set' : '❌ MISSING',
    NEXT_PUBLIC_SUPABASE_URL_value: normUrl || '(empty)',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  ? '✅ set' : '❌ MISSING',
    SUPABASE_SERVICE_ROLE_KEY:      process.env.SUPABASE_SERVICE_ROLE_KEY       ? '✅ set' : '❌ MISSING',
    ANTHROPIC_API_KEY:              process.env.ANTHROPIC_API_KEY               ? '✅ set' : '❌ MISSING',
    url_looks_valid: normUrl.startsWith('https://') && normUrl.includes('.supabase.co'),
  })
}
