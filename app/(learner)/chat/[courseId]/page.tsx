'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getLearnerFromStorage, sleep } from '@/lib/utils'
import type { ChatMessage, QuizQuestion, Lesson, Module, LessonContent, Quiz } from '@/lib/supabase/types'

type MessageType = 'bot' | 'learner' | 'video' | 'quiz-question' | 'quiz-result' | 'typing'

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

type Language = 'en' | 'zu'

const UI_TEXT: Record<Language, Record<string, string>> = {
  en: {
    loading: 'Loading your lesson…',
    course_done: '🎉 You\'ve completed this course! Great work!',
    back: 'Back to courses',
    lesson_complete: 'Lesson complete!',
    score: 'Your score',
    next_lesson: 'Next lesson →',
    correct: '✅ Correct!',
    wrong: '❌ Not quite.',
    video_watch: 'Watch the video above, then we\'ll continue.',
    watch_prompt: '▶ Tap to play video',
    quiz_intro: 'Quick check! Let\'s see what you learned. Answer these questions:',
    all_done: 'All done! You scored',
    out_of: 'out of',
  },
  zu: {
    loading: 'Silanda isifundo sakho…',
    course_done: '🎉 Uqedile lo msebenzi! Umsebenzi omuhle kakhulu!',
    back: 'Buyela emasifundweni',
    lesson_complete: 'Isifundo siphelile!',
    score: 'Amapointi akho',
    next_lesson: 'Isifundo esilandelayo →',
    correct: '✅ Kulungile!',
    wrong: '❌ Akukho khona.',
    video_watch: 'Buka ividiyo elingenhla, bese siqhubeka.',
    watch_prompt: '▶ Thepha ukudlala ividiyo',
    quiz_intro: 'Hlola ulwazi lwakho! Phendula lemibuzo:',
    all_done: 'Uqedile! Uthole',
    out_of: 'phakathi kwa-',
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
  const [processing, setProcessing] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [courseTitle, setCourseTitle] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const ui = UI_TEXT[language]

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  // Load learner + course data
  useEffect(() => {
    const l = getLearnerFromStorage()
    if (!l) { router.replace('/register'); return }
    setLearner(l)
    setLanguage((l.language || 'en') as Language)

    async function load() {
      try {
        // Fetch course
        const cr = await fetch(`/api/courses/${courseId}`)
        const cd = await cr.json()
        if (cd.course) setCourseTitle(cd.course.title)

        // Fetch all lessons for this course
        const lr = await fetch(`/api/courses/${courseId}/lessons`)
        const ld = await lr.json()
        const fetchedLessons: (Lesson & { module_title?: string })[] = ld.lessons || []
        setLessons(fetchedLessons)

        if (fetchedLessons.length > 0 && l) {
          await loadLesson(fetchedLessons[0], 0, l.language as Language)
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

  const addMessage = (msg: Omit<DisplayMessage, 'timestamp'>) => {
    setMessages((prev) => [...prev, { ...msg, timestamp: new Date() }])
  }

  const loadLesson = useCallback(async (lesson: Lesson & { module_title?: string }, idx: number, lang: string) => {
    setProcessing(true)
    setPhase('chat')
    setQuizIndex(0)
    setAnswers([])
    setScore(0)

    // Track progress
    const learnerData = getLearnerFromStorage()
    if (learnerData) {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learner_id: learnerData.id, lesson_id: lesson.id }),
      }).catch(() => {})
    }

    try {
      // Fetch content
      const [contentRes, quizRes] = await Promise.all([
        fetch(`/api/lessons/${lesson.id}/content?language=${lang}`),
        fetch(`/api/lessons/${lesson.id}/quiz?language=${lang}`),
      ])
      const contentData = await contentRes.json()
      const quizData = await quizRes.json()

      setCurrentContent(contentData.content || null)
      setCurrentQuiz(quizData.quiz || null)

      setPageLoading(false)

      // If module changed, show module title
      if (idx === 0 || lesson.module_title) {
        addMessage({
          id: `module-${idx}`,
          type: 'bot',
          text: `📌 *${lesson.module_title || ''}* — ${lesson.title}`,
        })
        await sleep(600)
      }

      // Play chat script
      const script: ChatMessage[] = contentData.content?.chat_script || []
      if (script.length === 0) {
        addMessage({ id: 'no-content', type: 'bot', text: 'This lesson is coming soon! Check back later.' })
      } else {
        for (const msg of script) {
          setIsTyping(true)
          await sleep(msg.delay || 1200)
          setIsTyping(false)
          addMessage({ id: `chat-${msg.id}`, type: 'bot', text: msg.text })
          await sleep(300)
        }
      }

      // Show video if available
      if (lesson.video_url) {
        setIsTyping(true)
        await sleep(800)
        setIsTyping(false)
        addMessage({ id: `video-${lesson.id}`, type: 'video', videoUrl: lesson.video_url })
        addMessage({ id: `video-prompt-${lesson.id}`, type: 'bot', text: ui.video_watch })
        setPhase('video')
      } else {
        // No video — go straight to quiz
        await startQuiz(quizData.quiz)
      }
    } catch (err) {
      console.error(err)
      addMessage({ id: 'error', type: 'bot', text: 'Something went wrong loading this lesson. Please try again.' })
    } finally {
      setProcessing(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui])

  async function startQuiz(quiz: Quiz | null) {
    if (!quiz || quiz.questions.length === 0) {
      showLessonComplete()
      return
    }
    setIsTyping(true)
    await sleep(800)
    setIsTyping(false)
    addMessage({ id: 'quiz-intro', type: 'bot', text: ui.quiz_intro })
    await sleep(500)
    setPhase('quiz')
    setQuizIndex(0)
    // Show first question
    addMessage({
      id: `q-0`,
      type: 'quiz-question',
      question: quiz.questions[0],
    })
  }

  async function handleAnswer(optionIndex: number) {
    if (!currentQuiz) return
    const question = currentQuiz.questions[quizIndex]
    const isCorrect = optionIndex === question.correctIndex
    const newAnswers = [...answers, optionIndex]
    setAnswers(newAnswers)

    // Mark selection visible
    addMessage({
      id: `answer-${quizIndex}`,
      type: 'learner',
      text: question.options[optionIndex],
    })

    await sleep(400)

    // Show result
    addMessage({
      id: `result-${quizIndex}`,
      type: 'quiz-result',
      correct: isCorrect,
      text: `${isCorrect ? ui.correct : ui.wrong} ${question.explanation}`,
      answerIndex: question.correctIndex,
    })

    const nextIndex = quizIndex + 1
    if (nextIndex < currentQuiz.questions.length) {
      await sleep(800)
      setQuizIndex(nextIndex)
      addMessage({
        id: `q-${nextIndex}`,
        type: 'quiz-question',
        question: currentQuiz.questions[nextIndex],
      })
    } else {
      // All questions done
      const correct = newAnswers.filter((a, i) => a === currentQuiz.questions[i]?.correctIndex).length
      const finalScore = Math.round((correct / currentQuiz.questions.length) * 100)
      setScore(finalScore)
      await sleep(800)

      // Save attempt
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

      addMessage({
        id: 'final-score',
        type: 'bot',
        text: `${ui.all_done} ${correct} ${ui.out_of} ${currentQuiz.questions.length}! ${finalScore >= 80 ? '🌟 Excellent!' : finalScore >= 60 ? '👍 Good job!' : '💪 Keep practising!'}`,
      })
      setPhase('result')
    }
  }

  function showLessonComplete() {
    setPhase('result')
  }

  async function nextLesson() {
    const nextIndex = currentLessonIndex + 1
    if (nextIndex >= lessons.length) {
      addMessage({ id: 'course-done', type: 'bot', text: ui.course_done })
      setPhase('done')
      return
    }
    setCurrentLessonIndex(nextIndex)
    setMessages([]) // clear for next lesson
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
      <div className="min-h-screen flex items-center justify-center bg-ambani-50">
        <div className="text-ambani-600 animate-pulse">{ui.loading}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-100">
      {/* Chat header */}
      <div className="bg-chat-700 text-white flex items-center gap-3 px-4 py-3 shadow-md z-10">
        <button onClick={() => router.push('/courses')} className="text-white/80 hover:text-white text-xl">←</button>
        <div className="w-10 h-10 rounded-full bg-ambani-400 flex items-center justify-center text-white font-bold text-lg">A</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{courseTitle || 'Ambani Learn'}</div>
          <div className="text-xs text-chat-200 truncate">
            {lessons[currentLessonIndex]?.title || 'Ambani Learn Bot'}
          </div>
        </div>
        <div className="text-right text-xs text-chat-200 shrink-0">
          <div>{progress}%</div>
          <div className="text-chat-300">done</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-chat-900">
        <div
          className="h-full bg-ambani-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-bg px-3 py-4 space-y-2">
        {messages.map((msg) => (
          <MessageItem key={msg.id} msg={msg} onAnswer={handleAnswer} phase={phase} quizIndex={quizIndex} />
        ))}

        {isTyping && (
          <div className="flex items-end gap-2 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-ambani-400 flex items-center justify-center text-white text-sm font-bold shrink-0">A</div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 dot-typing" />
                <div className="w-2 h-2 rounded-full bg-gray-400 dot-typing" />
                <div className="w-2 h-2 rounded-full bg-gray-400 dot-typing" />
              </div>
            </div>
          </div>
        )}

        {/* Video continue button */}
        {phase === 'video' && !processing && (
          <div className="flex justify-center mt-4">
            <button
              onClick={videoWatched}
              className="bg-chat-600 hover:bg-chat-700 text-white font-semibold px-6 py-3 rounded-xl shadow transition-colors"
            >
              I watched the video — continue →
            </button>
          </div>
        )}

        {/* Next lesson / done */}
        {phase === 'result' && (
          <div className="flex justify-center mt-4">
            <button
              onClick={nextLesson}
              className="bg-ambani-500 hover:bg-ambani-600 text-white font-semibold px-6 py-3 rounded-xl shadow transition-colors"
            >
              {currentLessonIndex + 1 < lessons.length ? ui.next_lesson : '🏁 Finish course'}
            </button>
          </div>
        )}

        {phase === 'done' && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => router.push('/courses')}
              className="bg-ambani-500 hover:bg-ambani-600 text-white font-semibold px-6 py-3 rounded-xl shadow transition-colors"
            >
              {ui.back}
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function MessageItem({
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
  const isLastQuestion = msg.type === 'quiz-question' && msg.id === `q-${quizIndex}` && phase === 'quiz'

  if (msg.type === 'bot') {
    return (
      <div className="flex items-end gap-2 animate-slide-in-left">
        <div className="w-8 h-8 rounded-full bg-ambani-400 flex items-center justify-center text-white text-sm font-bold shrink-0">A</div>
        <div className="max-w-[78%] bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{msg.text}</p>
          <p className="text-xs text-gray-400 mt-1 text-right">{msg.timestamp.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    )
  }

  if (msg.type === 'learner') {
    return (
      <div className="flex justify-end animate-slide-in-right">
        <div className="max-w-[78%] bg-chat-500 text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm">{msg.text}</p>
          <p className="text-xs text-chat-200 mt-1 text-right">{msg.timestamp.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    )
  }

  if (msg.type === 'video' && msg.videoUrl) {
    return (
      <div className="flex items-end gap-2 animate-slide-in-left">
        <div className="w-8 h-8 rounded-full bg-ambani-400 flex items-center justify-center text-white text-sm font-bold shrink-0">A</div>
        <div className="max-w-[85%] bg-white rounded-2xl rounded-bl-sm overflow-hidden shadow-sm">
          <video
            controls
            className="w-full max-h-52 object-contain bg-black"
            preload="metadata"
            onEnded={() => {}}
          >
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
        <div className="w-8 h-8 rounded-full bg-ambani-400 flex items-center justify-center text-white text-sm font-bold shrink-0">A</div>
        <div className="max-w-[85%] space-y-2">
          <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm font-medium text-gray-800">{msg.question.question}</p>
          </div>
          {isLastQuestion && (
            <div className="space-y-2 pl-1">
              {msg.question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => onAnswer(i)}
                  className="block w-full text-left text-sm bg-white hover:bg-ambani-50 border-2 border-gray-200 hover:border-ambani-400 text-gray-700 px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
                >
                  <span className="font-semibold text-ambani-600 mr-2">{String.fromCharCode(65 + i)}.</span>
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
      <div className="flex items-end gap-2 animate-slide-in-left">
        <div className="w-8 h-8 rounded-full bg-ambani-400 flex items-center justify-center text-white text-sm font-bold shrink-0">A</div>
        <div className={`max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm ${msg.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className="text-sm text-gray-800">{msg.text}</p>
        </div>
      </div>
    )
  }

  return null
}
