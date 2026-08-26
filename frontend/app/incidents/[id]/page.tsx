'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Pencil, Trash2, UserPlus, X } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { IncidentStatusBadge } from '@/components/incidents/IncidentStatusBadge'
import { IncidentPriorityBadge } from '@/components/incidents/IncidentPriorityBadge'
import { IncidentTimeline } from '@/components/incidents/IncidentTimeline'
import { IncidentForm } from '@/components/incidents/IncidentForm'
import { ErrorState } from '@/components/common/ErrorState'
import { useAuth } from '@/hooks/use-auth'
import {
  assignIncident,
  deleteIncident,
  getIncidentById,
  getIncidentHistory,
  updateIncident,
  updateIncidentStatus,
} from '@/lib/api/incidents'
import { getUserSummary } from '@/lib/api/users'
import { ApiError } from '@/lib/api/client'
import {
  ROLE_LABELS,
  STATUS_LABELS,
  nextAllowedStatuses,
  type IncidentHistoryResponse,
  type IncidentResponse,
  type UserSummaryResponse,
} from '@/lib/types'

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; user: UserSummaryResponse }
  | { status: 'not-found' }
  | { status: 'invalid-role'; user: UserSummaryResponse }

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const incidentId = Number(id)
  const router = useRouter()
  const { username, role } = useAuth()
  const canManage = role === 'ADMIN' || role === 'SUPERVISOR'
  const canDelete = role === 'ADMIN'

  const [incident, setIncident] = useState<IncidentResponse | null>(null)
  const [history, setHistory] = useState<IncidentHistoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignUserId, setAssignUserId] = useState('')
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' })
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [lastAssigned, setLastAssigned] = useState<{ user: UserSummaryResponse; at: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [statusUpdating, setStatusUpdating] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [incidentData, historyData] = await Promise.all([
        getIncidentById(incidentId),
        getIncidentHistory(incidentId).catch(() => []),
      ])
      setIncident(incidentData)
      setHistory(historyData)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Olay yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!Number.isNaN(incidentId)) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Kullanıcı ID'si girilirken 400ms debounce ile GET /api/users/{id}
  // sorgulanır ve bulunan kullanıcı (varsa) doğrudan gösterilir.
  useEffect(() => {
    if (lookupTimer.current) clearTimeout(lookupTimer.current)
    const trimmed = assignUserId.trim()
    if (trimmed.length === 0) {
      setLookup({ status: 'idle' })
      return
    }
    const numeric = Number(trimmed)
    if (!Number.isInteger(numeric) || numeric <= 0) {
      setLookup({ status: 'idle' })
      return
    }
    setLookup({ status: 'loading' })
    lookupTimer.current = setTimeout(async () => {
      try {
        const user = await getUserSummary(numeric)
        setLookup(user.role === 'TECHNICIAN' ? { status: 'found', user } : { status: 'invalid-role', user })
      } catch {
        setLookup({ status: 'not-found' })
      }
    }, 400)
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current)
    }
  }, [assignUserId])

  async function handleUpdate(request: Parameters<typeof updateIncident>[1]) {
    const updated = await updateIncident(incidentId, request)
    setIncident(updated)
    setEditing(false)
    load()
  }

  async function handleDelete() {
    setActionError(null)
    setDeleting(true)
    try {
      await deleteIncident(incidentId)
      router.push('/incidents')
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Bu olay silinemedi.')
      setDeleting(false)
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    setAssignError(null)
    if (lookup.status !== 'found') return
    const targetUser = lookup.user
    setAssigning(true)
    try {
      const updated = await assignIncident(incidentId, targetUser.id)
      setIncident(updated)
      setLastAssigned({ user: targetUser, at: new Date().toISOString() })
      setAssignOpen(false)
      setAssignUserId('')
      setLookup({ status: 'idle' })
      setToast(`${targetUser.username} olaya atandı.`)
      load()
    } catch (err) {
      setAssignError(err instanceof ApiError ? err.message : 'Atama başarısız oldu.')
    } finally {
      setAssigning(false)
    }
  }

  async function handleStatusChange(newStatus: IncidentResponse['status']) {
    setActionError(null)
    setStatusUpdating(true)
    try {
      const updated = await updateIncidentStatus(incidentId, newStatus)
      setIncident(updated)
      load()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Durum güncellenemedi.')
    } finally {
      setStatusUpdating(false)
    }
  }

  if (Number.isNaN(incidentId)) {
    return (
      <AppShell>
        <ErrorState message="Geçersiz olay ID." />
      </AppShell>
    )
  }

  const assignedDisplay =
    lastAssigned && lastAssigned.user.username === incident?.assignedToUsername ? lastAssigned : null

  return (
    <AppShell>
      {toast && (
        <div className="toast">
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      {loading ? (
        <div className="panel" style={{ padding: 28 }}>
          <div className="skeleton skeleton-line" style={{ width: '40%', height: 24, marginBottom: 16 }} />
          <div className="skeleton skeleton-line" style={{ width: '100%', marginBottom: 8 }} />
          <div className="skeleton skeleton-line" style={{ width: '80%' }} />
        </div>
      ) : error || !incident ? (
        <ErrorState message={error ?? 'Olay bulunamadı.'} onRetry={load} />
      ) : editing ? (
        <>
          <div className="page-heading compact">
            <div>
              <p className="eyebrow">OLAY #{incident.id}</p>
              <h1>Olayı Düzenle</h1>
              <p className="lead">Değişiklikler için ADMIN veya SUPERVISOR yetkisi gereklidir.</p>
            </div>
            <button className="secondary-btn" onClick={() => setEditing(false)} type="button">
              <X size={14} /> Vazgeç
            </button>
          </div>
          <div className="panel">
            <IncidentForm
              initial={incident}
              submitLabel="Değişiklikleri Kaydet"
              onSubmit={handleUpdate}
            />
          </div>
        </>
      ) : (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">OLAY #{incident.id}</p>
              <h1>{incident.title}</h1>
              <div className="detail-badges">
                <IncidentStatusBadge status={incident.status} />
                <IncidentPriorityBadge priority={incident.priority} />
              </div>
            </div>
          </div>

          {actionError && <ErrorState message={actionError} />}

          <div className="content-grid">
            <div className="panel" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 15, margin: '0 0 10px' }}>Açıklama</h2>
              <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7, margin: '0 0 24px' }}>
                {incident.description}
              </p>

              <div className="detail-grid">
                <div>
                  <small>Oluşturan</small>
                  <strong>{incident.createdByUsername ?? '—'}</strong>
                </div>
                <div>
                  <small>Atanan</small>
                  {assignedDisplay ? (
                    <div className="assignee" style={{ marginTop: 2 }}>
                      <div className="tiny-avatar">
                        {assignedDisplay.user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ display: 'block' }}>{assignedDisplay.user.username}</strong>
                        <small className="muted">{ROLE_LABELS[assignedDisplay.user.role]}</small>
                      </div>
                    </div>
                  ) : (
                    <strong>{incident.assignedToUsername ?? 'Atanmadı'}</strong>
                  )}
                </div>
                <div>
                  <small>Oluşturulma Tarihi</small>
                  <strong>{formatDate(incident.createdAt)}</strong>
                </div>
                {assignedDisplay && (
                  <div>
                    <small>Atama Zamanı</small>
                    <strong>{formatDate(assignedDisplay.at)}</strong>
                  </div>
                )}
              </div>

              {username && incident.assignedToUsername === username && (
                <div>
                  <h2 style={{ fontSize: 13, margin: '20px 0 6px' }}>Durumu Güncelle</h2>
                  <p className="muted" style={{ fontSize: 11, margin: 0 }}>
                    Bu olay size atandığı için durumu değiştirebilirsiniz.
                  </p>
                  <div className="status-quick">
                    {nextAllowedStatuses(incident.status).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStatusChange(s)}
                        disabled={statusUpdating}
                      >
                        {STATUS_LABELS[s]} olarak işaretle
                      </button>
                    ))}
                    {nextAllowedStatuses(incident.status).length === 0 && (
                      <span className="muted" style={{ fontSize: 11 }}>
                        Bu olay için başka bir duruma geçiş yapılamaz.
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="detail-actions">
                {canManage && (
                  <button className="secondary-btn" onClick={() => setEditing(true)} type="button">
                    <Pencil size={13} /> Düzenle
                  </button>
                )}
                {canManage && (
                  <button
                    className="secondary-btn"
                    onClick={() => setAssignOpen((v) => !v)}
                    type="button"
                  >
                    <UserPlus size={13} /> Teknisyene Ata
                  </button>
                )}
                {canDelete && (
                  <button
                    className="secondary-btn"
                    onClick={handleDelete}
                    disabled={deleting}
                    type="button"
                    style={{ color: 'var(--trt-red)', borderColor: '#f6cccf' }}
                  >
                    <Trash2 size={13} /> {deleting ? 'Siliniyor...' : 'Sil'}
                  </button>
                )}
              </div>

              {canManage && assignOpen && (
                <form onSubmit={handleAssign} style={{ marginTop: 18, maxWidth: 380 }}>
                  <label className="form-section" style={{ margin: 0 }}>
                    Teknisyen Kullanıcı ID&apos;si
                    <input
                      type="number"
                      min={1}
                      value={assignUserId}
                      onChange={(e) => setAssignUserId(e.target.value)}
                      placeholder="Örn. 5"
                    />
                  </label>

                  {lookup.status === 'loading' && (
                    <p className="field-hint" style={{ marginTop: 8 }}>Kullanıcı sorgulanıyor...</p>
                  )}
                  {lookup.status === 'not-found' && (
                    <p className="field-error" style={{ marginTop: 8 }}>
                      Bu ID ile kayıtlı kullanıcı bulunamadı.
                    </p>
                  )}
                  {lookup.status === 'invalid-role' && (
                    <p className="field-error" style={{ marginTop: 8 }}>
                      {lookup.user.username} bir teknisyen değil ({ROLE_LABELS[lookup.user.role]}). Olaylar
                      yalnızca teknisyenlere atanabilir.
                    </p>
                  )}
                  {lookup.status === 'found' && (
                    <div className="assignee" style={{ marginTop: 10 }}>
                      <div className="tiny-avatar">{lookup.user.username.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <strong style={{ display: 'block' }}>{lookup.user.username}</strong>
                        <small className="muted">
                          {ROLE_LABELS[lookup.user.role]} · {lookup.user.email}
                        </small>
                      </div>
                      <CheckCircle2 size={15} className="ok" style={{ marginLeft: 'auto' }} />
                    </div>
                  )}

                  <div className="form-actions" style={{ marginTop: 14 }}>
                    <button className="primary-btn" type="submit" disabled={assigning || lookup.status !== 'found'}>
                      {assigning ? 'Atanıyor...' : 'Atama Yap'}
                    </button>
                  </div>
                  {assignError && (
                    <span className="field-error" style={{ display: 'block', marginTop: 8 }}>
                      {assignError}
                    </span>
                  )}
                </form>
              )}
            </div>

            <div className="panel full-panel">
              <div className="panel-head">
                <div>
                  <h2>Olay Geçmişi</h2>
                  <p>Bu olayla ilgili tüm aksiyonlar</p>
                </div>
              </div>
              <IncidentTimeline history={history} />
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
