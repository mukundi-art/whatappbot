'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Lesson, GeneratedContent, LessonContent, Quiz } from '@/lib/supabase/types'

type Tab = 'content' | 'preview'
type Lang = 'en' | 'zu'

export default function LessonEditorPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.lessonId as string
  const courseId = params.courseId as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [sourceText, setSourceText] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [questionCount, setQuestionCount] = useState(4)
  const [generated, setGenerated] = useState<GeneratedContent | null>(null)
  const [existingContent, setExistingContent] = useState<{ en?: LessonContent; zu?: LessonContent } | null>(null)
  const [existingQuiz, setExistingQuiz] = useState<{ en?: Quiz; zu?: Quiz } | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<Tab>('content')
  const [previewLang, setPreviewLang] = useState<Lang>('en')
  const fileRef = useRef<HTMLInputElement>(null)
  const docRef = useRef<HTMLInputElement>(null)

  async function load() {
    const [lr, enCon, zuCon, enQ, zuQ] = await Promise.all([
      fetch(`/api/lessons/${lessonId}`),
      fetch(`/api/lessons/${lessonId}/content?language=en`),
      fetch(`/api/lessons/${lessonId}/content?language=zu`),
      fetch(`/api/lessons/${lessonId}/quiz?language=en`),
      fetch(`/api/lessons/${lessonId}/quiz?language=zu`),
    ])
    const ld = await lr.json()
    const encd = await enCon.json()
    const zucd = await zuCon.json()
    const enqd = await enQ.json()
    const zuqd = await zuQ.json()

    setLesson(ld.lesson)
    setSourceText(ld.lesson?.source_text || '')
    setExistingContent({ en: encd.content, zu: zucd.content })
    setExistingQuiz({ en: enqd.quiz, zu: zuqd.quiz })

    if (encd.content && zucd.content && enqd.quiz && zuqd.quiz) {
      setGenerated({
        en: { chatScript: encd.content.chat_script, quiz: enqd.quiz.questions },
        zu: { chatScript: zucd.content.chat_script, quiz: zuqd.quiz.questions },
      })
    }
  }

  useEffect(() => { load() }, [lessonId])

  async function uploadDoc(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/parse-document', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.text) setSourceText(data.text)
  }

  async function uploadVideo() {
    if (!videoFile) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('video', videoFile)
      formData.append('lesson_id', lessonId)
      const res = await fetch('/api/upload-video', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetch(`/api/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: data.url }),
      })
      setSuccess('Video uploaded!')
      setVideoFile(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function saveSourceText() {
    setSaving(true)
    await fetch(`/api/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_text: sourceText }),
    })
    setSaving(false)
    setSuccess('Saved!')
    setTimeout(() => setSuccess(''), 2000)
  }

  async function generate() {
    if (!sourceText.trim()) { setError('Please add lesson content first.'); return }
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`/api/lessons/${lessonId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText, questionCount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setGenerated(data.content)
      setTab('preview')
      setSuccess('Content generated! Review and publish below.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function publish() {
    if (!generated) return
    setPublishing(true)
    setError('')
    try {
      const res = await fetch(`/api/lessons/${lessonId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: generated }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Publish failed')
      }
      setSuccess('Published! Learners can now see this lesson.')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  function updateScript(lang: Lang, idx: number, text: string) {
    if (!generated) return
    const updated = { ...generated }
    updated[lang].chatScript[idx] = { ...updated[lang].chatScript[idx], text }
    setGenerated(updated)
  }

  function updateQuestion(lang: Lang, qi: number, field: string, value: string | number) {
    if (!generated) return
    const updated = { ...generated }
    const q = { ...updated[lang].quiz[qi], [field]: value }
    updated[lang].quiz[qi] = q
    setGenerated(updated)
  }

  function updateOption(lang: Lang, qi: number, oi: number, value: string) {
    if (!generated) return
    const updated = { ...generated }
    const options = [...updated[lang].quiz[qi].options]
    options[oi] = value
    updated[lang].quiz[qi] = { ...updated[lang].quiz[qi], options }
    setGenerated(updated)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push(`/dashboard/courses/${courseId}`)} className="text-gray-500 hover:text-gray-700">←</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{lesson?.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            lesson?.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {lesson?.status}
          </span>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">{success}</div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {(['content', 'preview'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            {t === 'content' ? '📝 Content' : '👁 Review & Publish'}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <div className="space-y-5">
          {/* Source text */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Lesson Content</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => docRef.current?.click()}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg"
                >
                  📄 Upload doc
                </button>
                <input ref={docRef} type="file" accept=".txt,.pdf,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0])} />
              </div>
            </div>
            <textarea
              rows={12}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste your lesson content here, or upload a document above…&#10;&#10;Example: This lesson teaches spaza shop owners how to manage their stock effectively. Stock management means knowing what products you have, how much you have, and when to reorder…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ambani-400 resize-none font-mono leading-relaxed"
            />
            <button
              onClick={saveSourceText}
              disabled={saving}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              {saving ? 'Saving…' : '💾 Save content'}
            </button>
          </div>

          {/* Video upload */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Lesson Video</h2>
            {lesson?.video_url && (
              <div className="mb-3">
                <video controls className="w-full max-h-48 rounded-lg bg-black" src={lesson.video_url} />
                <p className="text-xs text-gray-400 mt-1">Current video</p>
              </div>
            )}
            <div
              className="border-2 border-dashed border-gray-200 hover:border-ambani-300 rounded-xl p-6 text-center cursor-pointer transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {videoFile ? (
                <p className="text-sm text-gray-700">📹 {videoFile.name}</p>
              ) : (
                <>
                  <div className="text-3xl mb-2">🎬</div>
                  <p className="text-sm text-gray-500">Click to upload video (MP4, MOV, WebM)</p>
                  <p className="text-xs text-gray-400 mt-1">Max 500MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
            {videoFile && (
              <button
                onClick={uploadVideo}
                disabled={uploading}
                className="mt-3 w-full bg-chat-600 hover:bg-chat-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {uploading ? 'Uploading…' : '⬆ Upload Video'}
              </button>
            )}
          </div>

          {/* Generate */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-1">Generate with AI</h2>
            <p className="text-sm text-gray-500 mb-4">Creates a bilingual chat script + quiz from your lesson content. You review and edit before publishing.</p>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm text-gray-600">Quiz questions:</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ambani-400"
              >
                {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button
              onClick={generate}
              disabled={generating || !sourceText.trim()}
              className="w-full bg-ambani-500 hover:bg-ambani-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60 text-base"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚙</span> Generating bilingual content…
                </span>
              ) : (
                '✨ Generate with AI'
              )}
            </button>
          </div>
        </div>
      )}

      {tab === 'preview' && generated && (
        <div className="space-y-5">
          {/* Language selector */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            {(['en', 'zu'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setPreviewLang(l)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  previewLang === l ? 'bg-ambani-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {l === 'en' ? '🇬🇧 English' : '🇿🇦 isiZulu'}
              </button>
            ))}
          </div>

          {/* Chat script editor */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Chat Script ({previewLang === 'en' ? 'English' : 'isiZulu'})</h3>
            <div className="space-y-3">
              {generated[previewLang].chatScript.map((msg, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-ambani-100 text-ambani-700 text-xs flex items-center justify-center font-bold shrink-0 mt-1">
                    {i + 1}
                  </div>
                  <textarea
                    rows={2}
                    value={msg.text}
                    onChange={(e) => updateScript(previewLang, i, e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ambani-400 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Quiz editor */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Quiz ({previewLang === 'en' ? 'English' : 'isiZulu'})</h3>
            <div className="space-y-5">
              {generated[previewLang].quiz.map((q, qi) => (
                <div key={qi} className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium uppercase">Question {qi + 1}</label>
                    <textarea
                      rows={2}
                      value={q.question}
                      onChange={(e) => updateQuestion(previewLang, qi, 'question', e.target.value)}
                      className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ambani-400 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuestion(previewLang, qi, 'correctIndex', oi)}
                          className={`w-6 h-6 rounded-full shrink-0 border-2 transition-colors ${
                            q.correctIndex === oi ? 'border-green-500 bg-green-500' : 'border-gray-300'
                          }`}
                          title="Mark as correct"
                        >
                          {q.correctIndex === oi && <span className="text-white text-xs flex items-center justify-center w-full">✓</span>}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(previewLang, qi, oi, e.target.value)}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ambani-400"
                        />
                        <span className="text-xs text-gray-400 shrink-0">{String.fromCharCode(65 + oi)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium uppercase">Explanation</label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => updateQuestion(previewLang, qi, 'explanation', e.target.value)}
                      className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ambani-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publish button */}
          <div className="bg-ambani-50 border border-ambani-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-800 mb-1">Ready to publish?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Publishing saves this content in both English and isiZulu and makes this lesson live for learners.
            </p>
            <button
              onClick={publish}
              disabled={publishing}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {publishing ? 'Publishing…' : '🚀 Publish Lesson'}
            </button>
          </div>
        </div>
      )}

      {tab === 'preview' && !generated && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🤖</div>
          <p>Generate content first using the Content tab.</p>
          <button onClick={() => setTab('content')} className="mt-4 text-ambani-600 font-medium">
            ← Go to Content
          </button>
        </div>
      )}
    </div>
  )
}
