export type Language = 'en' | 'zu'
export type CourseStatus = 'draft' | 'published'
export type LessonStatus = 'draft' | 'published'

export interface ChatMessage {
  id: string
  text: string
  delay: number
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface Learner {
  id: string
  full_name: string
  phone: string
  email: string | null
  language_pref: Language
  created_at: string
}

export interface Course {
  id: string
  title: string
  description: string | null
  cover_url: string | null
  status: CourseStatus
  created_at: string
}

export interface Module {
  id: string
  course_id: string
  title: string
  sort_order: number
  created_at: string
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  source_text: string | null
  video_url: string | null
  sort_order: number
  status: LessonStatus
  created_at: string
}

export interface LessonContent {
  id: string
  lesson_id: string
  language: Language
  chat_script: ChatMessage[]
  created_at: string
}

export interface Quiz {
  id: string
  lesson_id: string
  language: Language
  questions: QuizQuestion[]
  created_at: string
}

export interface Enrollment {
  id: string
  learner_id: string
  course_id: string
  enrolled_at: string
}

export interface Progress {
  id: string
  learner_id: string
  lesson_id: string
  video_watched: boolean
  viewed_at: string
}

export interface QuizAttempt {
  id: string
  learner_id: string
  quiz_id: string
  answers: number[]
  score: number
  total: number
  completed_at: string
}

export interface GeneratedContent {
  en: {
    chatScript: ChatMessage[]
    quiz: QuizQuestion[]
  }
  zu: {
    chatScript: ChatMessage[]
    quiz: QuizQuestion[]
  }
}
