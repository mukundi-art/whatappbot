import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function DELETE(_req: NextRequest, { params }: { params: { moduleId: string } }) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('modules').delete().eq('id', params.moduleId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
