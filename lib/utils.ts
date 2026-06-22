export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getLearnerFromStorage(): { id: string; name: string; language: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('ambani_learner')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setLearnerInStorage(learner: { id: string; name: string; language: string }) {
  if (typeof window === 'undefined') return
  localStorage.setItem('ambani_learner', JSON.stringify(learner))
}

export function clearLearnerFromStorage() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('ambani_learner')
}

export function calculateScore(answers: number[], questions: { correctIndex: number }[]): number {
  const correct = answers.filter((ans, i) => ans === questions[i]?.correctIndex).length
  return Math.round((correct / questions.length) * 100)
}

export function escapeCSV(value: string | number | null | undefined): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}
