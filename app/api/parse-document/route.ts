import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // For .txt files, read directly
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    const text = await file.text()
    return NextResponse.json({ text })
  }

  // For PDF and DOCX, extract text as best we can (basic plain-text extraction)
  // A production version would use a proper parser library
  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    if (file.name.endsWith('.pdf')) {
      // Basic PDF text extraction — strip binary, extract readable text
      const str = buffer.toString('latin1')
      const textMatches = str.match(/BT[\s\S]*?ET/g) || []
      const extracted = textMatches
        .join(' ')
        .replace(/[^\x20-\x7E\n\r]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return NextResponse.json({ text: extracted || 'Could not extract text from PDF. Please paste the content manually.' })
    }

    if (file.name.endsWith('.docx')) {
      // DOCX is a ZIP — extract XML content naively
      const str = buffer.toString('utf-8', 0, Math.min(buffer.length, 500000))
      const matches = str.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
      const text = matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ').trim()
      return NextResponse.json({ text: text || 'Could not extract text from DOCX. Please paste the content manually.' })
    }

    return NextResponse.json({ error: 'Unsupported file type. Use .txt, .pdf, or .docx' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Failed to parse document. Please paste the content manually.' }, { status: 500 })
  }
}
