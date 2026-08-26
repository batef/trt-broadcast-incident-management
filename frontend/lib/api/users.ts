import { apiRequest } from '@/lib/api/client'
import type { CreateUserRequest, CreateUserResponse, UserSummaryResponse } from '@/lib/types'

// POST /api/users — sadece ADMIN çağırabilir (backend SecurityConfig'de
// zorunlu kılınıyor). Şifre alanı yok; backend geçici şifreyi üretir ve
// yalnızca bu cevapta bir kez döner.
export function createUser(request: CreateUserRequest) {
  return apiRequest<CreateUserResponse>('/users', {
    method: 'POST',
    body: request,
  })
}

// GET /api/users/{id} — olay atama ekranında girilen ID'nin gerçek bir
// kullanıcıya karşılık gelip gelmediğini doğrulamak için. Sadece
// ADMIN/SUPERVISOR çağırabilir.
export function getUserSummary(id: number) {
  return apiRequest<UserSummaryResponse>(`/users/${id}`)
}
