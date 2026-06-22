'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setLearnerInStorage } from '@/lib/utils'

const labels = {
  en: {
    title: 'Welcome to Ambani Learn',
    subtitle: 'Your micro-learning journey starts here',
    name: 'Full Name',
    namePlaceholder: 'e.g. Sipho Dlamini',
    phone: 'Phone Number',
    phonePlaceholder: 'e.g. 0821234567',
    email: 'Email (optional)',
    emailPlaceholder: 'e.g. sipho@email.com',
    language: 'Choose your language',
    english: 'English',
    zulu: 'isiZulu',
    returning: 'Returning learner? Enter your phone number',
    submit: 'Start Learning',
    returning_btn: 'Resume my learning',
    or: 'or',
  },
  zu: {
    title: 'Wamukelekile ku-Ambani Learn',
    subtitle: 'Uhambo lwakho lokuya ezikoleni lweqala lapha',
    name: 'Igama Eligcwele',
    phone: 'Inombolo Yocingo',
    email: 'I-imeyili (ayidingi)',
    language: 'Khetha ulimi lwakho',
    english: 'English',
    zulu: 'isiZulu',
    submit: 'Qala Ukufunda',
  },
}

export default function RegisterPage() {
  const router = useRouter()
  const [lang, setLang] = useState<'en' | 'zu'>('en')
  const l = labels[lang]

  const [form, setForm] = useState({ full_name: '', phone: '', email: '' })
  const [returningPhone, setReturningPhone] = useState('')
  const [mode, setMode] = useState<'new' | 'returning'>('new')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/learners/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, language_pref: lang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setLearnerInStorage({ id: data.id, name: data.full_name, language: lang })
      router.push('/courses')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleReturning(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/learners/register?phone=${encodeURIComponent(returningPhone)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Phone number not found')
      setLearnerInStorage({ id: data.id, name: data.full_name, language: data.language_pref })
      router.push('/courses')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ambani-500 to-ambani-700 flex flex-col items-center justify-center p-4">
      {/* Logo / header */}
      <div className="text-white text-center mb-8">
        <div className="text-5xl mb-2">📚</div>
        <h1 className="text-3xl font-bold">{l.title}</h1>
        <p className="text-ambani-100 mt-1">{l.subtitle}</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-5">
        {/* Language toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {(['en', 'zu'] as const).map((ln) => (
            <button
              key={ln}
              onClick={() => setLang(ln)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                lang === ln ? 'bg-ambani-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {ln === 'en' ? 'English' : 'isiZulu'}
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="flex gap-3 text-sm">
          <button
            onClick={() => setMode('new')}
            className={`flex-1 py-2 rounded-lg border font-medium transition-colors ${
              mode === 'new' ? 'border-ambani-500 text-ambani-600 bg-ambani-50' : 'border-gray-200 text-gray-500'
            }`}
          >
            New learner
          </button>
          <button
            onClick={() => setMode('returning')}
            className={`flex-1 py-2 rounded-lg border font-medium transition-colors ${
              mode === 'returning' ? 'border-ambani-500 text-ambani-600 bg-ambani-50' : 'border-gray-200 text-gray-500'
            }`}
          >
            Returning
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {mode === 'new' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{l.name} *</label>
              <input
                type="text"
                required
                placeholder={labels.en.namePlaceholder}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ambani-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{l.phone} *</label>
              <input
                type="tel"
                required
                placeholder={labels.en.phonePlaceholder}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ambani-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{l.email}</label>
              <input
                type="email"
                placeholder={labels.en.emailPlaceholder}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ambani-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ambani-500 hover:bg-ambani-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? 'Please wait…' : l.submit}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReturning} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your phone number</label>
              <input
                type="tel"
                required
                placeholder="e.g. 0821234567"
                value={returningPhone}
                onChange={(e) => setReturningPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ambani-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ambani-500 hover:bg-ambani-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? 'Please wait…' : 'Resume my learning'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
