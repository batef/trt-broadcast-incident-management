'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUsername } from '@/lib/auth'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(getCurrentUsername() ? '/dashboard' : '/login')
  }, [router])

  return null
}
