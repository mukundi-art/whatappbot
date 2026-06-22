'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getLearnerFromStorage, sleep } from '@/lib/utils'
import type { ChatMessage, QuizQuestion, Lesson, LessonContent, Quiz } from '@/lib/supabase/types'

type MessageType = 'bot' | 'learner' | 'video' | 'quiz-question' | 'quiz-result' | 'typing'
type Language = 'en' | 'zu'

interface DisplayMessage {
  id: string
  type: MessageType
  text?: string
  videoUrl?: string
  question?: QuizQuestion
  correct?: boolean
  timestamp: Date
  answerIndex?: number
}

const UI: Record<Language, Record<string, string>> = {
  en: {
    loading:      'Loading your lesson…',
    course_done:  "🎉 You've completed this course! Great work!",
    back:         'Back to courses',
    video_watch:  'Watch the video above, then tap the button below to continue.',
    video_done:   'I watched the video — continue →',
    quiz_intro:   "Quick check! Let's see what you learned:",
    correct:      '✅ Correct!',
    wrong:        '❌ Not quite.',
    all_done:     'You scored',
    out_of:       'out of',
    next_lesson:  'Next lesson →',
    finish:       '🏁 Finish course',
    done_pct_80:  '🌟 Excellent!',
    done_pct_60:  '👍 Good job!',
    done_pct_0:   '💪 Keep practising!',
  },
  zu: {
    loading:      'Silanda isifundo sakho…',
    course_done:  '🎉 Uqedile lo msebenzi! Umsebenzi omuhle kakhulu!',
    back:         'Buyela emasifundweni',
    video_watch:  'Buka ividiyo elingenhla, bese uthepha inkinobho engezansi ukuze uqhubeke.',
    video_done:   'Ngibukile ividiyo — qhubeka →',
    quiz_intro:   'Hlola ulwazi lwakho! Phendula lemibuzo:',
    correct:      '✅ Kulungile!',
    wrong:        '❌ Akukho khona.',
    all_done:     'Uthole',
    out_of:       'phakathi kwa-',
    next_lesson:  'Isifundo esilandelayo →',
    finish:       '🏁 Qeda isifundo',
    done_pct_80:  '🌟 Kuhle kakhulu!',
    done_pct_60:  '👍 Umsebenzi omuhle!',
    done_pct_0:   '💪 Qhubeka uzijwayeze!',
  },
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [learner, setLearner] = useState<{ id: string; name: string; language: string } | null>(null)
  const [language, setLanguage] = useState<Language>('en')
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [lessons, setLessons] = useState<(Lesson & { module_title?: string })[]>([])
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [currentContent, setCurrentContent] = useState<LessonContent | null>(null)
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null)
  const [phase, setPhase] = useState<'chat' | 'video' | 'quiz' | 'result' | 'done'>('chat')
  const [quizIndex, setQuizIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [courseTitle, setCourseTitle] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const ui = UI[language]

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  useEffect(() => {
    const l = getLearnerFromStorage()
    if (!l) { router.replace('/register'); return }
    setLearner(l)
    if (l) setLanguage((l.language || 'en') as Language)

    async function load() {
      try {
        const [cr, lr] = await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch(`/api/courses/${courseId}/lessons`),
        ])
        const cd = await cr.json()
        const ld = await lr.json()
        if (cd.course) setCourseTitle(cd.course.title)
        const fetchedLessons: (Lesson & { module_title?: string })[] = ld.lessons || []
        setLessons(fetchedLessons)
        if (fetchedLessons.length > 0 && l) {
          await loadLesson(fetchedLessons[0], 0, (l.language || 'en') as Language)
        } else {
          setPageLoading(false)
        }
      } catch {
        setPageLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  const addMessage = (msg: Omit<DisplayMessage, 'timestamp'>) =>
    setMessages((prev) => [...prev, { ...msg, timestamp: new Date() }])

  const loadLesson = useCallback(async (lesson: Lesson & { module_title?: string }, idx: number, lang: Language) => {
    setPhase('chat')
    setQuizIndex(0)
    setAnswers([])
    setScore(0)

    const learnerData = getLearnerFromStorage()
    if (learnerData) {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learner_id: learnerData.id, lesson_id: lesson.id }),
      }).catch(() => {})
    }

    try {
      const [contentRes, quizRes] = await Promise.all([
        fetch(`/api/lessons/${lesson.id}/content?language=${lang}`),
        fetch(`/api/lessons/${lesson.id}/quiz?language=${lang}`),
      ])
      const contentData = await contentRes.json()
      const quizData = await quizRes.json()
      setCurrentContent(contentData.content || null)
      setCurrentQuiz(quizData.quiz || null)
      setPageLoading(false)

      if (lesson.module_title) {
        addMessage({ id: `mod-${idx}`, type: 'bot', text: `📌 ${lesson.module_title} — ${lesson.title}` })
        await sleep(600)
      }

      const script: ChatMessage[] = contentData.content?.chat_script || []
      if (script.length === 0) {
        addMessage({ id: 'no-content', type: 'bot', text: 'This lesson is coming soon!' })
      } else {
        for (const msg of script) {
          setIsTyping(true)
          await sleep(Math.min(msg.delay || 1200, 2000))
          setIsTyping(false)
          addMessage({ id: `chat-${msg.id}`, type: 'bot', text: msg.text })
          await sleep(200)
        }
      }

      if (lesson.video_url) {
        setIsTyping(true)
        await sleep(800)
        setIsTyping(false)
        addMessage({ id: `video-${lesson.id}`, type: 'video', videoUrl: lesson.video_url })
        addMessage({ id: `video-prompt-${lesson.id}`, type: 'bot', text: ui.video_watch })
        setPhase('video')
      } else {
        await startQuiz(quizData.quiz)
      }
    } catch {
      addMessage({ id: 'error', type: 'bot', text: 'Something went wrong loading this lesson. Please try again.' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui])

  async function startQuiz(quiz: Quiz | null) {
    if (!quiz || quiz.questions.length === 0) { setPhase('result'); return }
    setIsTyping(true)
    await sleep(800)
    setIsTyping(false)
    addMessage({ id: 'quiz-intro', type: 'bot', text: ui.quiz_intro })
    await sleep(400)
    setPhase('quiz')
    setQuizIndex(0)
    addMessage({ id: 'q-0', type: 'quiz-question', question: quiz.questions[0] })
  }

  async function handleAnswer(optionIndex: number) {
    if (!currentQuiz) return
    const question = currentQuiz.questions[quizIndex]
    const isCorrect = optionIndex === question.correctIndex
    const newAnswers = [...answers, optionIndex]
    setAnswers(newAnswers)

    addMessage({ id: `answer-${quizIndex}`, type: 'learner', text: question.options[optionIndex] })
    await sleep(350)
    addMessage({
      id: `result-${quizIndex}`,
      type: 'quiz-result',
      correct: isCorrect,
      text: `${isCorrect ? ui.correct : ui.wrong} ${question.explanation}`,
    })

    const nextIndex = quizIndex + 1
    if (nextIndex < currentQuiz.questions.length) {
      await sleep(700)
      setQuizIndex(nextIndex)
      addMessage({ id: `q-${nextIndex}`, type: 'quiz-question', question: currentQuiz.questions[nextIndex] })
    } else {
      const correct = newAnswers.filter((a, i) => a === currentQuiz.questions[i]?.correctIndex).length
      const pct = Math.round((correct / currentQuiz.questions.length) * 100)
      setScore(pct)
      await sleep(700)

      const learnerData = getLearnerFromStorage()
      if (learnerData) {
        fetch('/api/quiz-attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            learner_id: learnerData.id,
            quiz_id: currentQuiz.id,
            answers: newAnswers,
            score: correct,
            total: currentQuiz.questions.length,
          }),
        }).catch(() => {})
      }

      const emoji = pct >= 80 ? ui.done_pct_80 : pct >= 60 ? ui.done_pct_60 : ui.done_pct_0
      addMessage({
        id: 'final-score',
        type: 'bot',
        text: `${ui.all_done} ${correct} ${ui.out_of} ${currentQuiz.questions.length}! ${emoji}`,
      })
      setPhase('result')
    }
  }

  async function nextLesson() {
    const nextIndex = currentLessonIndex + 1
    if (nextIndex >= lessons.length) {
      addMessage({ id: 'course-done', type: 'bot', text: ui.course_done })
      setPhase('done')
      return
    }
    setCurrentLessonIndex(nextIndex)
    setMessages([])
    await loadLesson(lessons[nextIndex], nextIndex, language)
  }

  function videoWatched() {
    const learnerData = getLearnerFromStorage()
    if (learnerData && lessons[currentLessonIndex]) {
      fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learner_id: learnerData.id, lesson_id: lessons[currentLessonIndex].id, video_watched: true }),
      }).catch(() => {})
    }
    startQuiz(currentQuiz)
  }

  const totalLessons = lessons.length
  const progress = totalLessons > 0 ? Math.round(((currentLessonIndex + (phase === 'done' ? 1 : 0)) / totalLessons) * 100) : 0

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-primary text-body-md animate-pulse">{ui.loading}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-surface">
      {/* Chat header — deep teal */}
      <div className="bg-primary text-white flex items-center gap-3 px-4 py-3 shadow-md z-10">
        <button onClick={() => router.push('/courses')} className="text-white/70 hover:text-white text-xl leading-none">←</button>
        <div className="w-10 h-10 rounded-full bg-secondary-light flex items-center justify-center font-headline font-bold text-primary text-lg shrink-0">
          A
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-headline font-semibold text-sm truncate">{courseTitle || 'Ambani Learn'}</div>
          <div className="text-xs text-white/60 truncate">{lessons[currentLessonIndex]?.title || 'Ambani Learn Bot'}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-secondary-light font-semibold text-sm">{progress}%</div>
          <div className="text-xs text-white/50">complete</div>
        </div>
      </div>

      {/* Sunset orange progress bar */}
      <div className="h-1.5 bg-primary-dark">
        <div
          className="h-full bg-secondary-light transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-bg px-3 py-4 space-y-2.5 scrollbar-hide">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            msg={msg}
            onAnswer={handleAnswer}
            phase={phase}
            quizIndex={quizIndex}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-end gap-2 animate-fade-in">
            <Avatar />
            <div className="bg-chat-bot border border-outline-variant rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 rounded-full bg-outline dot-typing" />
                <span className="w-2 h-2 rounded-full bg-outline dot-typing" />
                <span className="w-2 h-2 rounded-full bg-outline dot-typing" />
              </div>
            </div>
          </div>
        )}

        {/* Video continue */}
        {phase === 'video' && (
          <div className="flex justify-center mt-2">
            <button onClick={videoWatched} className="btn-primary px-8 shadow-btn">
              {ui.video_done}
            </button>
          </div>
        )}

        {/* Next / finish */}
        {phase === 'result' && (
          <div className="flex justify-center mt-2">
            <button onClick={nextLesson} className="btn-primary px-8 shadow-btn">
              {currentLessonIndex + 1 < lessons.length ? ui.next_lesson : ui.finish}
            </button>
          </div>
        )}

        {phase === 'done' && (
          <div className="flex justify-center mt-2">
            <button onClick={() => router.push('/courses')} className="btn-primary px-8 shadow-btn">
              {ui.back}
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function Avatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-secondary-light flex items-center justify-center font-headline font-bold text-primary text-sm shrink-0">
      A
    </div>
  )
}

function ChatMessage({
  msg,
  onAnswer,
  phase,
  quizIndex,
}: {
  msg: DisplayMessage
  onAnswer: (i: number) => void
  phase: string
  quizIndex: number
}) {
  const time = msg.timestamp.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  const isActiveQuestion = msg.type === 'quiz-question' && msg.id === `q-${quizIndex}` && phase === 'quiz'

  if (msg.type === 'bot') {
    return (
      <div className="flex items-end gap-2 animate-slide-in-left max-w-[85%]">
        <Avatar />
        {/* Bot bubble: white with teal left accent border */}
        <div className="bg-chat-bot border-l-4 border-primary rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
          <p className="text-chat-bubble text-on-surface whitespace-pre-wrap leading-relaxed">{msg.text}</p>
          <p className="text-xs text-outline mt-1.5 text-right">{time}</p>
        </div>
      </div>
    )
  }

  if (msg.type === 'learner') {
    return (
      <div className="flex justify-end animate-slide-in-right">
        {/* User bubble: light teal (#ccf2f0 ≈ chat-user) with sharp bottom-right */}
        <div className="max-w-[78%] bg-chat-user rounded-2xl rounded-br-sm px-4 py-3 shadow-card">
          <p className="text-chat-bubble text-on-surface">{msg.text}</p>
          <p className="text-xs text-outline mt-1.5 text-right">{time}</p>
        </div>
      </div>
    )
  }

  if (msg.type === 'video' && msg.videoUrl) {
    return (
      <div className="flex items-end gap-2 animate-slide-in-left max-w-[90%]">
        <Avatar />
        <div className="flex-1 bg-chat-bot border border-outline-variant rounded-2xl rounded-bl-sm overflow-hidden shadow-card">
          <video controls className="w-full max-h-56 object-contain bg-black" preload="metadata">
            <source src={msg.videoUrl} />
            Your browser does not support video.
          </video>
        </div>
      </div>
    )
  }

  if (msg.type === 'quiz-question' && msg.question) {
    return (
      <div className="flex items-end gap-2 animate-slide-in-left">
        <Avatar />
        <div className="max-w-[85%] space-y-2">
          <div className="bg-chat-bot border-l-4 border-secondary-light rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
            <p className="text-chat-bubble font-semibold text-on-surface">{msg.question.question}</p>
          </div>
          {isActiveQuestion && (
            <div className="space-y-2 pl-1">
              {msg.question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => onAnswer(i)}
                  className="block w-full text-left text-sm bg-surface-lowest hover:bg-primary/5
                             border-2 border-outline-variant hover:border-primary
                             text-on-surface px-4 py-3 rounded-xl shadow-card
                             transition-all active:scale-[0.98]"
                >
                  <span className="font-semibold text-primary mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (msg.type === 'quiz-result') {
    return (
      <div className="flex items-end gap-2 animate-slide-in-left max-w-[85%]">
        <Avatar />
        <div className={`rounded-2xl rounded-bl-sm px-4 py-3 shadow-card ${
          msg.correct
            ? 'bg-tertiary-on-container/10 border border-tertiary/30'
            : 'bg-error-container/60 border border-error/20'
        }`}>
          <p className="text-chat-bubble text-on-surface">{msg.text}</p>
        </div>
      </div>
    )
  }

  return null
}
