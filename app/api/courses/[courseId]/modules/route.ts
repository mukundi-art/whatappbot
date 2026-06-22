import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { courseId: string } }) {
  const supabase = createServiceClient()
  const { data: modules, error } = await supabase
    .from('modules')
    .select('*, lessons(*)')
    .eq('course_id', params.courseId)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const withSortedLessons = (modules || []).map((m: any) => ({
    ...m,
    lessons: (m.lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }))

  return NextResponse.json({ modules: withSortedLessons })
}
