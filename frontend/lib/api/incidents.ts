import { apiRequest } from '@/lib/api/client'
import type {
  IncidentHistoryResponse,
  IncidentRequest,
  IncidentResponse,
  IncidentStatus,
} from '@/lib/types'

// GET /api/incidents
export function getAllIncidents() {
  return apiRequest<IncidentResponse[]>('/incidents')
}

// GET /api/incidents/{id}
export function getIncidentById(id: number) {
  return apiRequest<IncidentResponse>(`/incidents/${id}`)
}

// POST /api/incidents
export function createIncident(request: IncidentRequest) {
  return apiRequest<IncidentResponse>('/incidents', {
    method: 'POST',
    body: request,
  })
}

// PUT /api/incidents/{id} — sadece ADMIN/SUPERVISOR (backend zorunlu kılıyor)
export function updateIncident(id: number, request: IncidentRequest) {
  return apiRequest<IncidentResponse>(`/incidents/${id}`, {
    method: 'PUT',
    body: request,
  })
}

// DELETE /api/incidents/{id} — sadece ADMIN
export function deleteIncident(id: number) {
  return apiRequest<void>(`/incidents/${id}`, { method: 'DELETE' })
}

// PUT /api/incidents/{id}/assign/{userId} — sadece ADMIN/SUPERVISOR,
// hedef kullanıcı backend'de TECHNICIAN olmalı
export function assignIncident(id: number, userId: number) {
  return apiRequest<IncidentResponse>(`/incidents/${id}/assign/${userId}`, {
    method: 'PUT',
  })
}

// GET /api/incidents/assigned-to-me
export function getMyAssignedIncidents() {
  return apiRequest<IncidentResponse[]>('/incidents/assigned-to-me')
}

// PUT /api/incidents/{id}/status?status=X — query param, body değil.
// Backend yalnızca o an incident'a atanmış technician'ın çağırmasına izin veriyor.
export function updateIncidentStatus(id: number, status: IncidentStatus) {
  return apiRequest<IncidentResponse>(`/incidents/${id}/status`, {
    method: 'PUT',
    query: { status },
  })
}

// GET /api/incidents/{id}/history
export function getIncidentHistory(id: number) {
  return apiRequest<IncidentHistoryResponse[]>(`/incidents/${id}/history`)
}
