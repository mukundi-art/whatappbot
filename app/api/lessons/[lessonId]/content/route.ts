import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { lessonId: string } }) {
  const language = req.nextUrl.searchParams.get('language') || 'en'
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('lesson_content')
    .select('*')
    .eq('lesson_id', params.lessonId)
    .eq('language', language)
    .single()

  if (error) return NextResponse.json({ content: null })
  return NextResponse.json({ content: data })
}
