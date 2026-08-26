'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  clearToken,
  decodeToken,
  getMustChangePassword,
  getRole,
  getToken,
  isTokenExpired,
} from '@/lib/auth'
import type { Role } from '@/lib/types'

interface AuthState {
  username: string | null
  role: Role | null
  mustChangePassword: boolean
  loading: boolean
}

// Oturum durumunu okur, süresi dolmuş/olmayan token'ı temizler.
// Korumalı sayfalar bunu kullanıp username null ise /login'e,
// mustChangePassword true ise /change-password'a yönlendirir — kullanıcı
// yeni şifresini belirleyene kadar başka hiçbir sayfaya erişemez.
export function useAuth(options: { redirectIfUnauthenticated?: boolean } = {}) {
  const { redirectIfUnauthenticated = true } = options
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<AuthState>({
    username: null,
    role: null,
    mustChangePassword: false,
    loading: true,
  })

  useEffect(() => {
    const token = getToken()
    const decoded = token ? decodeToken(token) : null
    if (!decoded || isTokenExpired(decoded)) {
      clearToken()
      setState({ username: null, role: null, mustChangePassword: false, loading: false })
      if (redirectIfUnauthenticated) router.replace('/login')
      return
    }

    const mustChangePassword = getMustChangePassword()
    if (mustChangePassword && pathname !== '/change-password') {
      router.replace('/change-password')
    }

    setState({
      username: decoded.username,
      role: getRole(),
      mustChangePassword,
      loading: false,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, redirectIfUnauthenticated, pathname])

  const logout = useCallback(() => {
    clearToken()
    router.replace('/login')
  }, [router])

  return { ...state, logout }
}
