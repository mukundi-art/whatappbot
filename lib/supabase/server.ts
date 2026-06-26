import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Normalise the URL — strip trailing slash, ensure https:// prefix
function normaliseUrl(raw: string | undefined): string {
  if (!raw) return ''
  let url = raw.trim()
  // Add https:// if the user omitted it
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`
  }
  // Remove trailing slash
  return url.replace(/\/+$/, '')
}

const SUPABASE_URL = normaliseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
const ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

export async function createClient() {
  if (!SUPABASE_URL || !SUPABASE_URL.includes('.supabase')) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is missing or invalid (got: "${SUPABASE_URL || '(empty)'}"). ` +
      'Set it in your .env.local file as https://your-project-ref.supabase.co'
    )
  }
  if (!ANON_KEY) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Add it to your .env.local file.'
    )
  }
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          )
        } catch {}
      },
    },
  })
}

// Service role client — bypasses RLS, server-side only
export function createServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_URL.includes('.supabase')) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is missing or invalid (got: "${SUPABASE_URL || '(empty)'}"). ` +
      'Set it in your .env.local file as https://your-project-ref.supabase.co'
    )
  }
  if (!SERVICE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your .env.local file.'
    )
  }
  return createSupabaseClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
