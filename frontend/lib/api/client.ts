import { clearToken, getToken } from '@/lib/auth'
import type { ApiErrorBody } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | undefined>
  auth?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(
    `${API_URL}${path}`,
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost',
  )

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

// Backend'in gerçek HTTP durumlarına göre kullanıcı dostu Türkçe mesaj üretir.
function messageForStatus(status: number, backendMessage?: string): string {
  if (backendMessage) return backendMessage
  switch (status) {
    case 400:
      return 'İstek geçersiz. Lütfen bilgileri kontrol edin.'
    case 401:
      return 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.'
    case 403:
      return 'Bu işlem için yetkiniz bulunmuyor.'
    case 404:
      return 'Kayıt bulunamadı.'
    case 500:
      return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
    default:
      return 'Beklenmeyen bir hata oluştu.'
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      0,
      'Sunucuya bağlanılamadı. Backend adresini ve bağlantınızı kontrol edin.',
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json')
  const data = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    if (response.status === 401) clearToken()
    const backendMessage = (data as ApiErrorBody | null)?.error
    throw new ApiError(response.status, messageForStatus(response.status, backendMessage))
  }

  return data as T
}
