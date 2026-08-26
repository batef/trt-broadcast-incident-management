// Merkezi oturum yönetimi.
// ÖNEMLİ: Backend'in JWT'si yalnızca "sub" (username) claim'i içeriyor
// (bkz. JwtService.generateToken) — rol veya id JWT'de YOK. Rol ve
// "ilk giriş" bilgisi backend'in LoginResponse'undan (POST /api/auth/login)
// geliyor ve token'ın yanında ayrıca saklanıyor.

import type { Role } from '@/lib/types'

const TOKEN_KEY = 'trt_incident_token'
const ROLE_KEY = 'trt_incident_role'
const MUST_CHANGE_KEY = 'trt_incident_must_change_password'

export interface DecodedToken {
  username: string
  issuedAt: number | null
  expiresAt: number | null
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    input.length + ((4 - (input.length % 4)) % 4),
    '=',
  )
  if (typeof window === 'undefined') return ''
  try {
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
  } catch {
    return ''
  }
}

export function decodeToken(token: string): DecodedToken | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    return {
      username: payload.sub ?? '',
      issuedAt: payload.iat ?? null,
      expiresAt: payload.exp ?? null,
    }
  } catch {
    return null
  }
}

function storageFor(remember: boolean) {
  return remember ? window.localStorage : window.sessionStorage
}

export function saveSession(
  token: string,
  role: Role,
  mustChangePassword: boolean,
  remember: boolean,
) {
  if (typeof window === 'undefined') return
  const storage = storageFor(remember)
  const other = storageFor(!remember)
  storage.setItem(TOKEN_KEY, token)
  storage.setItem(ROLE_KEY, role)
  storage.setItem(MUST_CHANGE_KEY, mustChangePassword ? '1' : '0')
  other.removeItem(TOKEN_KEY)
  other.removeItem(ROLE_KEY)
  other.removeItem(MUST_CHANGE_KEY)
}

// Şifre değiştirildikten sonra bayrağı güncellemek için (yeniden login
// gerektirmeden).
export function markPasswordChanged() {
  if (typeof window === 'undefined') return
  ;(window.localStorage.getItem(TOKEN_KEY) ? window.localStorage : window.sessionStorage).setItem(
    MUST_CHANGE_KEY,
    '0',
  )
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY)
}

export function getRole(): Role | null {
  if (typeof window === 'undefined') return null
  return (window.localStorage.getItem(ROLE_KEY) ??
    window.sessionStorage.getItem(ROLE_KEY)) as Role | null
}

export function getMustChangePassword(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.localStorage.getItem(MUST_CHANGE_KEY) === '1' ||
    window.sessionStorage.getItem(MUST_CHANGE_KEY) === '1'
  )
}

export function clearToken() {
  if (typeof window === 'undefined') return
  for (const storage of [window.localStorage, window.sessionStorage]) {
    storage.removeItem(TOKEN_KEY)
    storage.removeItem(ROLE_KEY)
    storage.removeItem(MUST_CHANGE_KEY)
  }
}

export function isTokenExpired(decoded: DecodedToken | null): boolean {
  if (!decoded || !decoded.expiresAt) return false
  return decoded.expiresAt * 1000 < Date.now()
}

export function getCurrentUsername(): string | null {
  const token = getToken()
  if (!token) return null
  const decoded = decodeToken(token)
  if (!decoded || isTokenExpired(decoded)) return null
  return decoded.username || null
}
