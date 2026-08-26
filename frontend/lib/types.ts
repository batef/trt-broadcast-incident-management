// Bu dosya backend'deki gerçek enum ve DTO'larla birebir eşleşir.
// Kaynak: com.trt.broadcastincidentmanagement.{enums,dto}

export type IncidentStatus =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// Not: backend'de OPERATOR rolü de var ama şu an hiçbir endpoint
// rol bilgisini frontend'e döndürmüyor (JWT sadece username taşıyor,
// GET /api/users yok). Bu tip yalnızca "Kullanıcılar" sayfasındaki
// demo veri ve yeni kullanıcı formu için kullanılıyor.
export type Role = 'ADMIN' | 'SUPERVISOR' | 'TECHNICIAN' | 'OPERATOR'

// IncidentRequest — POST/PUT /api/incidents body'si
export interface IncidentRequest {
  title: string
  description: string
  priority: Priority
  status: IncidentStatus
}

// IncidentResponse — backend'in döndürdüğü gerçek alanlar
export interface IncidentResponse {
  id: number
  title: string
  description: string
  priority: Priority
  status: IncidentStatus
  createdAt: string
  createdByUsername: string | null
  assignedToUsername: string | null
}

// IncidentHistoryResponse
export interface IncidentHistoryResponse {
  id: number
  action: string
  details: string | null
  createdAt: string
  username: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  role: Role
  mustChangePassword: boolean
}

export interface ChangePasswordRequest {
  newPassword: string
  confirmPassword: string
}

// POST /api/users — gerçek backend isteği (ADMIN-only). Şifre alanı YOK;
// backend geçici şifreyi kendisi üretir.
export interface CreateUserRequest {
  username: string
  email: string
  role: Role
}

// Geçici şifre yalnızca bu cevapta, bir kez döner.
export interface CreateUserResponse {
  id: number
  username: string
  email: string
  role: Role
  temporaryPassword: string
}

// GET /api/users/{id} — olay atama akışında kullanıcı doğrulamak için
export interface UserSummaryResponse {
  id: number
  username: string
  email: string
  role: Role
}

// Backend'in RuntimeException handler'ı { error: string } döndürüyor
export interface ApiErrorBody {
  error?: string
}

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  OPEN: 'Açık',
  INVESTIGATING: 'İnceleniyor',
  IN_PROGRESS: 'Devam Ediyor',
  RESOLVED: 'Çözüldü',
  CLOSED: 'Kapatıldı',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
  CRITICAL: 'Kritik',
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Yönetici',
  SUPERVISOR: 'Sorumlu',
  TECHNICIAN: 'Teknisyen',
  OPERATOR: 'Operatör',
}

// Durum akışı backend'de katı kurallara bağlı (IncidentService.updateIncidentStatus):
// OPEN -> yalnızca IN_PROGRESS
// IN_PROGRESS -> yalnızca RESOLVED
// RESOLVED -> asla (kapalı uç)
// INVESTIGATING / CLOSED -> backend'de açık bir kısıtlama yok
export function nextAllowedStatuses(current: IncidentStatus): IncidentStatus[] {
  switch (current) {
    case 'OPEN':
      return ['IN_PROGRESS']
    case 'IN_PROGRESS':
      return ['RESOLVED']
    case 'RESOLVED':
      return []
    default:
      return ['OPEN', 'INVESTIGATING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].filter(
        (s) => s !== current,
      ) as IncidentStatus[]
  }
}
