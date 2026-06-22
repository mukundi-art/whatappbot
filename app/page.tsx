'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getLearnerFromStorage } from '@/lib/utils'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const learner = getLearnerFromStorage()
    if (learner) {
      router.replace('/courses')
    } else {
      router.replace('/register')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-ambani-500">
      <div className="text-white text-center">
        <div className="text-4xl font-bold mb-2">Ambani Learn</div>
        <div className="text-ambani-100">Loading…</div>
      </div>
    </div>
  )
}
