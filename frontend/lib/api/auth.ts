import { apiRequest } from '@/lib/api/client'
import type { ChangePasswordRequest, LoginRequest, LoginResponse } from '@/lib/types'

// POST /api/auth/login — backend'deki gerçek endpoint
export function login(request: LoginRequest) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: request,
    auth: false,
  })
}

// POST /api/auth/change-password — geçici şifreyle ilk giriş sonrası
// zorunlu, ya da kullanıcının kendi isteğiyle şifre değiştirmesi için.
export function changePassword(request: ChangePasswordRequest) {
  return apiRequest<void>('/auth/change-password', {
    method: 'POST',
    body: request,
  })
}
