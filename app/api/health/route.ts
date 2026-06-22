import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ set' : '❌ MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ set' : '❌ MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ set' : '❌ MISSING',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✅ set' : '❌ MISSING',
    url_value: process.env.NEXT_PUBLIC_SUPABASE_URL || '(empty)',
  })
}
