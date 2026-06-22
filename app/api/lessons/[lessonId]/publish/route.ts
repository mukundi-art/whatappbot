import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { GeneratedContent } from '@/lib/supabase/types'

export async function POST(req: NextRequest, { params }: { params: { lessonId: string } }) {
  const { content }: { content: GeneratedContent } = await req.json()
  const supabase = createServiceClient()
  const lessonId = params.lessonId

  // Upsert lesson_content for both languages
  for (const lang of ['en', 'zu'] as const) {
    const { error: contentError } = await supabase
      .from('lesson_content')
      .upsert(
        { lesson_id: lessonId, language: lang, chat_script: content[lang].chatScript },
        { onConflict: 'lesson_id,language' }
      )
    if (contentError) return NextResponse.json({ error: contentError.message }, { status: 500 })

    const { error: quizError } = await supabase
      .from('quizzes')
      .upsert(
        { lesson_id: lessonId, language: lang, questions: content[lang].quiz },
        { onConflict: 'lesson_id,language' }
      )
    if (quizError) return NextResponse.json({ error: quizError.message }, { status: 500 })
  }

  // Mark lesson as published
  const { error: lessonError } = await supabase
    .from('lessons')
    .update({ status: 'published' })
    .eq('id', lessonId)

  if (lessonError) return NextResponse.json({ error: lessonError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
