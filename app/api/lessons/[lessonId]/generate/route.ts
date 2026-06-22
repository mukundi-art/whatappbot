import { NextRequest, NextResponse } from 'next/server'
import { generateLessonContent } from '@/lib/ai/generate'

export async function POST(req: NextRequest, { params }: { params: { lessonId: string } }) {
  const { sourceText, questionCount } = await req.json()

  if (!sourceText?.trim()) {
    return NextResponse.json({ error: 'Source text is required' }, { status: 400 })
  }

  try {
    const content = await generateLessonContent(sourceText, questionCount || 4)
    return NextResponse.json({ content, lessonId: params.lessonId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
