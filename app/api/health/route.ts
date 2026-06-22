import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function normaliseUrl(raw: string | undefined): string {
  if (!raw) return ''
  let url = raw.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`
  return url.replace(/\/+$/, '')
}

export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const normUrl = normaliseUrl(rawUrl)

  // Show enough of the URL to diagnose without fully exposing it
  const urlPreview = normUrl
    ? normUrl.replace(/^(https:\/\/[^.]{4})[^.]*(\..+)$/, '$1****$2')
    : '(not set)'

  const commonMistakes = []
  if (normUrl.includes('/rest/v1'))   commonMistakes.push('URL contains /rest/v1 — remove that part')
  if (normUrl.includes('/auth/v1'))   commonMistakes.push('URL contains /auth/v1 — remove that part')
  if (normUrl.includes('/storage/'))  commonMistakes.push('URL contains /storage/ — remove that part')
  if (!normUrl.includes('.supabase')) commonMistakes.push('URL does not contain .supabase — check the project URL')
  if (normUrl.split('/').length > 3)  commonMistakes.push('URL has extra path segments — should be just https://xxx.supabase.co')

  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL:      rawUrl ? '✅ set' : '❌ MISSING',
    NEXT_PUBLIC_SUPABASE_URL_value: urlPreview,
    url_looks_valid: normUrl.startsWith('https://') && normUrl.includes('.supabase.co') && !normUrl.includes('/rest/'),
    common_mistakes: commonMistakes.length ? commonMistakes : 'none detected',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ set' : '❌ MISSING',
    SUPABASE_SERVICE_ROLE_KEY:     process.env.SUPABASE_SERVICE_ROLE_KEY      ? '✅ set' : '❌ MISSING',
    ANTHROPIC_API_KEY:             process.env.ANTHROPIC_API_KEY              ? '✅ set' : '❌ MISSING',
  }

  // Test actual DB connection
  let dbTest: Record<string, unknown> = { ok: false }
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.from('learners').select('id').limit(1)
    if (error) {
      dbTest = { ok: false, error: error.message, code: error.code, hint: error.hint }
    } else {
      dbTest = { ok: true, row_count: (data || []).length }
    }
  } catch (err) {
    dbTest = { ok: false, thrown: err instanceof Error ? err.message : String(err) }
  }

  return NextResponse.json({ env: envStatus, db: dbTest })
}
