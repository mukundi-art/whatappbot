'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setLearnerInStorage } from '@/lib/utils'

type Lang = 'en' | 'zu'

const T: Record<Lang, Record<string, string>> = {
  en: {
    headline: 'Start Learning Today',
    sub: 'Join thousands of South African entrepreneurs growing their skills.',
    name: 'Full Name',
    name_ph: 'e.g. Sipho Dlamini',
    phone: 'Phone Number',
    phone_ph: 'e.g. 0821234567',
    email: 'Email (optional)',
    email_ph: 'e.g. sipho@email.com',
    lang_label: 'Learning language',
    submit: 'Start Learning',
    returning: 'Returning learner',
    returning_sub: 'Enter your phone number to continue where you left off.',
    resume: 'Resume Learning',
    new: 'New learner',
  },
  zu: {
    headline: 'Qala Ukufunda Namuhla',
    sub: 'Joyina izinkulungwane zosomabhizinisi baseNingizimu Afrika abakhulisa amakhono abo.',
    name: 'Igama Eligcwele',
    name_ph: 'isb. Sipho Dlamini',
    phone: 'Inombolo Yocingo',
    phone_ph: 'isb. 0821234567',
    email: 'I-imeyili (ayidingi)',
    email_ph: 'isb. sipho@email.com',
    lang_label: 'Ulimi lokufunda',
    submit: 'Qala Ukufunda',
    returning: 'Umfundi obuya',
    returning_sub: 'Faka inombolo yakho yocingo uqhubeke lapho ushiye khona.',
    resume: 'Qhubeka Ukufunda',
    new: 'Umfundi omsha',
  },
}

export default function RegisterPage() {
  const router = useRouter()
  const [uiLang, setUiLang] = useState<Lang>('en')
  const [learnLang, setLearnLang] = useState<Lang>('en')
  const [mode, setMode] = useState<'new' | 'returning'>('new')
  const [form, setForm] = useState({ full_name: '', phone: '', email: '' })
  const [returningPhone, setReturningPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const t = T[uiLang]

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/learners/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, language_pref: learnLang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setLearnerInStorage({ id: data.id, name: data.full_name, language: learnLang })
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
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header band */}
      <div className="bg-primary px-6 pt-12 pb-16">
        {/* UI language toggle */}
        <div className="flex justify-end mb-6">
          <div className="flex rounded-full overflow-hidden border border-primary-on-container/30">
            {(['en', 'zu'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setUiLang(l)}
                className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                  uiLang === l ? 'bg-white text-primary' : 'text-white/80 hover:text-white'
                }`}
              >
                {l === 'en' ? 'EN' : 'ZU'}
              </button>
            ))}
          </div>
        </div>

        {/* Logo + headline */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-secondary-light flex items-center justify-center text-2xl">📚</div>
          <span className="font-headline text-white text-xl font-semibold">Ambani Learn</span>
        </div>
        <h1 className="font-headline text-white text-headline-lg-mob font-semibold mt-4 leading-tight">
          {t.headline}
        </h1>
        <p className="text-primary-on-container text-sm mt-2 leading-relaxed opacity-90">{t.sub}</p>
      </div>

      {/* Card pulled up over header */}
      <div className="flex-1 -mt-8 bg-surface-lowest rounded-t-2xl px-6 pt-6 pb-10 shadow-card">

        {/* Mode tabs */}
        <div className="flex gap-2 mb-6 bg-surface-low rounded-xl p-1">
          {(['new', 'returning'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                mode === m
                  ? 'bg-surface-lowest text-primary shadow-card'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {m === 'new' ? t.new : t.returning}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-error-container border border-error/30 text-error text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {mode === 'new' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-label-md text-on-surface mb-1.5">{t.name} *</label>
              <input
                type="text"
                required
                placeholder={t.name_ph}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="field"
              />
            </div>

            <div>
              <label className="block text-label-md text-on-surface mb-1.5">{t.phone} *</label>
              <input
                type="tel"
                required
                placeholder={t.phone_ph}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="field"
              />
            </div>

            <div>
              <label className="block text-label-md text-on-surface mb-1.5">{t.email}</label>
              <input
                type="email"
                placeholder={t.email_ph}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field"
              />
            </div>

            {/* Learning language */}
            <div>
              <label className="block text-label-md text-on-surface mb-1.5">{t.lang_label}</label>
              <div className="flex gap-3">
                {(['en', 'zu'] as Lang[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLearnLang(l)}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      learnLang === l
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-outline'
                    }`}
                  >
                    {l === 'en' ? '🇬🇧 English' : '🇿🇦 isiZulu'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 shadow-btn"
            >
              {loading ? 'Please wait…' : t.submit}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReturning} className="space-y-4">
            <p className="text-sm text-on-surface-variant">{t.returning_sub}</p>
            <div>
              <label className="block text-label-md text-on-surface mb-1.5">{t.phone}</label>
              <input
                type="tel"
                required
                placeholder="e.g. 0821234567"
                value={returningPhone}
                onChange={(e) => setReturningPhone(e.target.value)}
                className="field"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full shadow-btn">
              {loading ? 'Please wait…' : t.resume}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
