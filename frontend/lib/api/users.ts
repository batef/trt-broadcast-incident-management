import { apiRequest } from '@/lib/api/client'
import type {
  CreateUserRequest,
  CreateUserResponse,
  UserDetailsResponse,
  UserSummaryResponse,
} from '@/lib/types'

// POST /api/users
export function createUser(request: CreateUserRequest) {
  return apiRequest<CreateUserResponse>('/users', {
    method: 'POST',
    body: request,
  })
}

// GET /api/users
export function getUsers() {
  return apiRequest<UserSummaryResponse[]>('/users')
}

// GET /api/users/{id}
export function getUserSummary(id: number) {
  return apiRequest<UserSummaryResponse>(`/users/${id}`)
}

// GET /api/users/{id}/details
export function getUserDetails(id: number) {
  return apiRequest<UserDetailsResponse>(`/users/${id}/details`)
}

// GET /api/users/technicians
// Olay atama ekranında kullanılacak teknisyen listesi.
export function getTechnicians() {
  return apiRequest<UserSummaryResponse[]>('/users/technicians')
}