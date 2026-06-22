import Anthropic from '@anthropic-ai/sdk'
import { GeneratedContent } from '@/lib/supabase/types'
import { LESSON_GENERATION_SYSTEM_PROMPT, buildLessonPrompt } from './prompts'

// Model is set in one place — update here when a newer model is available
const MODEL = 'claude-sonnet-4-6'

const MAX_SOURCE_LENGTH = 8000 // characters — chunk beyond this

function chunkText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text]
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    let end = start + maxLength
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end)
      if (lastPeriod > start) end = lastPeriod + 1
    }
    chunks.push(text.slice(start, end).trim())
    start = end
  }
  return chunks
}

export async function generateLessonContent(
  sourceText: string,
  questionCount: number = 4
): Promise<GeneratedContent> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // If text is long, use the first chunk for the primary lesson
  const chunks = chunkText(sourceText, MAX_SOURCE_LENGTH)
  const textToUse = chunks[0]

  const prompt = buildLessonPrompt(textToUse, questionCount)

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: LESSON_GENERATION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const rawText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
    .trim()

  // Strip any markdown code fences if present
  const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let parsed: GeneratedContent
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error(`AI returned invalid JSON. Raw response: ${rawText.slice(0, 500)}`)
  }

  // Validate structure
  if (!parsed.en?.chatScript || !parsed.en?.quiz || !parsed.zu?.chatScript || !parsed.zu?.quiz) {
    throw new Error('AI response missing required fields (en/zu chatScript or quiz)')
  }

  return parsed
}
