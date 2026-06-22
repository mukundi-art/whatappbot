import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { escapeCSV, formatDate } from '@/lib/utils'

export async function GET() {
  const supabase = createServiceClient()

  const { data: learners } = await supabase
    .from('learners')
    .select('*')
    .order('created_at', { ascending: false })

  const rows: string[] = [
    ['Name', 'Phone', 'Email', 'Language', 'Joined', 'Courses Enrolled', 'Lessons Viewed', 'Avg Score %'].join(','),
  ]

  for (const l of learners || []) {
    const [{ count: enrollCount }, { count: progressCount }, { data: attempts }] = await Promise.all([
      supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('learner_id', l.id),
      supabase.from('progress').select('*', { count: 'exact', head: true }).eq('learner_id', l.id),
      supabase.from('quiz_attempts').select('score, total').eq('learner_id', l.id),
    ])

    const avgScore =
      attempts && attempts.length
        ? Math.round(attempts.reduce((sum, a) => sum + Math.round((a.score / (a.total || 1)) * 100), 0) / attempts.length)
        : 0

    rows.push(
      [
        escapeCSV(l.full_name),
        escapeCSV(l.phone),
        escapeCSV(l.email || ''),
        escapeCSV(l.language_pref === 'zu' ? 'isiZulu' : 'English'),
        escapeCSV(formatDate(l.created_at)),
        escapeCSV(enrollCount || 0),
        escapeCSV(progressCount || 0),
        escapeCSV(avgScore),
      ].join(',')
    )
  }

  const csv = rows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ambani-participants-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
