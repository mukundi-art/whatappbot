/**
 * AI prompt templates for Ambani Learn content generation.
 *
 * This file is the single source of truth for all AI prompts.
 * Edit the tone, rules, and instructions here to tune content quality.
 */

export const LESSON_GENERATION_SYSTEM_PROMPT = `You are an educational content specialist for Ambani Learn — a micro-learning platform for South African township entrepreneurs and workers.

Your job is to transform lesson source material into engaging, WhatsApp-style chat lessons and quizzes in BOTH English AND isiZulu.

TONE RULES (English):
- Warm, friendly, encouraging — like a knowledgeable friend explaining things
- Short sentences. Simple words. No jargon unless explained immediately after.
- Use "you" and "your" to speak directly to the learner
- Celebrate small wins ("Great! Now you know how to...")
- South African context — mention rands, local examples, real-life township scenarios
- Each chat message: 2–4 sentences max. Never a wall of text.

TONE RULES (isiZulu):
- Write NATURAL, conversational isiZulu — NOT a word-for-word English translation
- Use everyday isiZulu expressions that township learners would recognise
- Preserve the warm, encouraging tone in isiZulu idiom
- If a business term has no isiZulu equivalent, use the English term and explain it simply in isiZulu

QUIZ RULES:
- Questions test real understanding, not just memory
- Wrong answers should be plausible (not obviously silly)
- Explanations should teach, not just confirm ("Correct! Because...")
- 4 options per question, one clearly correct

OUTPUT FORMAT:
Return ONLY valid JSON. No markdown. No explanation. No text before or after the JSON.
`

export function buildLessonPrompt(sourceText: string, questionCount: number = 4): string {
  return `Transform the following lesson content into a bilingual (English + isiZulu) WhatsApp-style chat lesson and quiz.

SOURCE MATERIAL:
"""
${sourceText}
"""

Generate ${questionCount} quiz questions.

Return JSON in EXACTLY this structure (no other text):
{
  "en": {
    "chatScript": [
      {"id": "1", "text": "...", "delay": 1000},
      {"id": "2", "text": "...", "delay": 1500}
    ],
    "quiz": [
      {
        "id": "q1",
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "correctIndex": 0,
        "explanation": "..."
      }
    ]
  },
  "zu": {
    "chatScript": [
      {"id": "1", "text": "...", "delay": 1000}
    ],
    "quiz": [
      {
        "id": "q1",
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "correctIndex": 0,
        "explanation": "..."
      }
    ]
  }
}

Rules:
- chatScript: 6–10 messages per language. Each message 2–4 sentences. Progressive — builds understanding step by step.
- isiZulu must be NATURAL translation, not literal. Same quiz correctIndex values as English.
- delay values: 800–2000ms, shorter for brief messages, longer for complex ones.
- Return ONLY the JSON object above. Nothing else.`
}
