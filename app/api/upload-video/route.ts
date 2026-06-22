import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const video = formData.get('video') as File | null
  const lessonId = formData.get('lesson_id') as string

  if (!video || !lessonId) {
    return NextResponse.json({ error: 'video and lesson_id required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const ext = video.name.split('.').pop() || 'mp4'
  const path = `lessons/${lessonId}/video.${ext}`

  const { error } = await supabase.storage
    .from('videos')
    .upload(path, video, { upsert: true, contentType: video.type })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
