import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { courseId: string } }) {
  const supabase = createServiceClient()

  // Get all modules for this course, then all published lessons
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, sort_order')
    .eq('course_id', params.courseId)
    .order('sort_order')

  if (!modules || modules.length === 0) return NextResponse.json({ lessons: [] })

  const moduleIds = modules.map((m) => m.id)
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('*')
    .in('module_id', moduleIds)
    .eq('status', 'published')
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach module title to each lesson for display
  const moduleMap = Object.fromEntries(modules.map((m) => [m.id, m]))
  const enriched = (lessons || []).map((l) => ({
    ...l,
    module_title: moduleMap[l.module_id]?.title || '',
  }))

  // Sort by module sort_order, then lesson sort_order
  enriched.sort((a, b) => {
    const ma = moduleMap[a.module_id]?.sort_order ?? 0
    const mb = moduleMap[b.module_id]?.sort_order ?? 0
    if (ma !== mb) return ma - mb
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  return NextResponse.json({ lessons: enriched })
}
