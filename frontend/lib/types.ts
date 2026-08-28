// Backend'deki gerçek enum ve DTO'larla birebir eşleşir.
// Kaynak: com.trt.broadcastincidentmanagement.{enums,dto}

// --------------------------------------------------
// INCIDENT
// --------------------------------------------------

export type IncidentStatus =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'

export type Priority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'

// --------------------------------------------------
// ROLE
// --------------------------------------------------

export type Role =
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'TECHNICIAN'
  | 'OPERATOR'

// --------------------------------------------------
// INCIDENT REQUEST / RESPONSE
// --------------------------------------------------

export interface IncidentRequest {
  title: string
  description: string
  priority: Priority
  status: IncidentStatus
}

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

// --------------------------------------------------
// INCIDENT HISTORY
// --------------------------------------------------

export interface IncidentHistoryResponse {
  id: number
  action: string
  details: string | null
  createdAt: string
  username: string
}

// --------------------------------------------------
// AUTH
// --------------------------------------------------

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

// --------------------------------------------------
// USER CREATE
// --------------------------------------------------

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  role: Role
}

export interface CreateUserResponse {
  id: number
  username: string
  email: string
  role: Role
  temporaryPassword: string
}

// --------------------------------------------------
// USER SUMMARY
// --------------------------------------------------

export interface UserSummaryResponse {
  id: number
  username: string
  email: string
  role: Role
  available: boolean
  activeIncidentCount: number
}

// --------------------------------------------------
// USER DETAILS
// --------------------------------------------------

export interface UserDetailsResponse {
  id: number
  username: string
  email: string
  role: Role
  createdIncidents: IncidentResponse[]
  assignedIncidents: IncidentResponse[]
}

// --------------------------------------------------
// MESSAGING
// --------------------------------------------------

export interface ConversationResponse {
  id: number
  createdAt: string
  participants: UserSummaryResponse[]
  lastMessage: string | null
  lastMessageAt: string | null
}

export interface MessageResponse {
  id: number
  conversationId: number
  senderId: number
  senderUsername: string
  content: string
  createdAt: string
  read: boolean
}

export interface SendMessageRequest {
  conversationId: number
  content: string
}

// --------------------------------------------------
// API ERROR
// --------------------------------------------------

export interface ApiErrorBody {
  error?: string
}

// --------------------------------------------------
// LABELS
// --------------------------------------------------

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

// --------------------------------------------------
// INCIDENT STATUS FLOW
// --------------------------------------------------

// Backend'deki IncidentService.updateIncidentStatus
// kurallarına göre izin verilen sonraki durumlar.
//
// OPEN -> IN_PROGRESS
// IN_PROGRESS -> RESOLVED
// RESOLVED -> hiçbir durum
// INVESTIGATING / CLOSED -> backend'de açık kısıtlama yok

export function nextAllowedStatuses(
  current: IncidentStatus,
): IncidentStatus[] {
  switch (current) {
    case 'OPEN':
      return ['IN_PROGRESS']

    case 'IN_PROGRESS':
      return ['RESOLVED']

    case 'RESOLVED':
      return []

    default:
      return [
        'OPEN',
        'INVESTIGATING',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED',
      ].filter(
        (status) => status !== current,
      ) as IncidentStatus[]
  }
}