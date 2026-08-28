'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'

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

import { getTechnicians } from '@/lib/api/users'

import { ApiError } from '@/lib/api/client'

import {
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

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const incidentId = Number(id)

  const router = useRouter()

  const { username, role } = useAuth()

  const canManage =
    role === 'ADMIN' || role === 'SUPERVISOR'

  const canDelete =
    role === 'ADMIN'

  const [incident, setIncident] =
    useState<IncidentResponse | null>(null)

  const [history, setHistory] =
    useState<IncidentHistoryResponse[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [editing, setEditing] =
    useState(false)

  const [deleting, setDeleting] =
    useState(false)

  const [actionError, setActionError] =
    useState<string | null>(null)

  /*
   * --------------------------------------------------
   * TEKNİSYEN ATAMA
   * --------------------------------------------------
   */

  const [assignOpen, setAssignOpen] =
    useState(false)

  const [technicians, setTechnicians] =
    useState<UserSummaryResponse[]>([])

  const [techniciansLoading, setTechniciansLoading] =
    useState(false)

  const [technicianSearch, setTechnicianSearch] =
    useState('')

  const [selectedTechnician, setSelectedTechnician] =
    useState<UserSummaryResponse | null>(null)

  const [assignError, setAssignError] =
    useState<string | null>(null)

  const [assigning, setAssigning] =
    useState(false)

  const [lastAssigned, setLastAssigned] =
    useState<{
      user: UserSummaryResponse
      at: string
    } | null>(null)

  const [toast, setToast] =
    useState<string | null>(null)

  const [statusUpdating, setStatusUpdating] =
    useState(false)

  /*
   * --------------------------------------------------
   * OLAYI GETİR
   * --------------------------------------------------
   */

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const [incidentData, historyData] =
        await Promise.all([
          getIncidentById(incidentId),

          getIncidentHistory(
            incidentId,
          ).catch(() => []),
        ])

      setIncident(incidentData)

      setHistory(historyData)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Olay yüklenemedi.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!Number.isNaN(incidentId)) {
      load()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId])

  /*
   * --------------------------------------------------
   * TOAST
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => {
      setToast(null)
    }, 3000)

    return () => clearTimeout(timer)
  }, [toast])

  /*
   * --------------------------------------------------
   * TEKNİSYENLERİ GETİR
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!assignOpen) return

    let cancelled = false

    async function loadTechnicians() {
      setTechniciansLoading(true)

      setAssignError(null)

      try {
        const data =
          await getTechnicians()

        if (!cancelled) {
          setTechnicians(data)
        }
      } catch (err) {
        if (!cancelled) {
          setAssignError(
            err instanceof ApiError
              ? err.message
              : 'Teknisyenler yüklenemedi.',
          )
        }
      } finally {
        if (!cancelled) {
          setTechniciansLoading(false)
        }
      }
    }

    loadTechnicians()

    return () => {
      cancelled = true
    }
  }, [assignOpen])

  /*
   * --------------------------------------------------
   * OLAY GÜNCELLE
   * --------------------------------------------------
   */

  async function handleUpdate(
    request: Parameters<
      typeof updateIncident
    >[1],
  ) {
    const updated =
      await updateIncident(
        incidentId,
        request,
      )

    setIncident(updated)

    setEditing(false)

    await load()
  }

  /*
   * --------------------------------------------------
   * OLAY SİL
   * --------------------------------------------------
   */

  async function handleDelete() {
    setActionError(null)

    setDeleting(true)

    try {
      await deleteIncident(
        incidentId,
      )

      router.push('/incidents')
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : 'Bu olay silinemedi.',
      )

      setDeleting(false)
    }
  }

  /*
   * --------------------------------------------------
   * TEKNİSYEN ATA
   * --------------------------------------------------
   */

  async function handleAssign(
    e: React.FormEvent,
  ) {
    e.preventDefault()

    setAssignError(null)

    if (!selectedTechnician) {
      setAssignError(
        'Lütfen bir teknisyen seçin.',
      )

      return
    }

    /*
     * Aynı teknisyene tekrar atama yapma.
     */

    if (
      incident?.assignedToUsername ===
      selectedTechnician.username
    ) {
      setAssignError(
        'Bu olay zaten bu teknisyene atanmış.',
      )

      return
    }

    const targetUser =
      selectedTechnician

    setAssigning(true)

    try {
      const updated =
        await assignIncident(
          incidentId,
          targetUser.id,
        )

      setIncident(updated)

      setLastAssigned({
        user: targetUser,
        at: new Date().toISOString(),
      })

      setAssignOpen(false)

      setTechnicianSearch('')

      setSelectedTechnician(null)

      setToast(
        `${targetUser.username} olaya atandı.`,
      )

      await load()
    } catch (err) {
      setAssignError(
        err instanceof ApiError
          ? err.message
          : 'Atama başarısız oldu.',
      )
    } finally {
      setAssigning(false)
    }
  }

  /*
   * --------------------------------------------------
   * DURUM DEĞİŞTİR
   * --------------------------------------------------
   */

  async function handleStatusChange(
    newStatus: IncidentResponse['status'],
  ) {
    setActionError(null)

    setStatusUpdating(true)

    try {
      const updated =
        await updateIncidentStatus(
          incidentId,
          newStatus,
        )

      setIncident(updated)

      await load()
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : 'Durum güncellenemedi.',
      )
    } finally {
      setStatusUpdating(false)
    }
  }

  /*
   * --------------------------------------------------
   * GEÇERSİZ ID
   * --------------------------------------------------
   */

  if (Number.isNaN(incidentId)) {
    return (
      <AppShell>
        <ErrorState
          message="Geçersiz olay ID."
        />
      </AppShell>
    )
  }

  /*
   * --------------------------------------------------
   * ARAMA
   * --------------------------------------------------
   */

  const filteredTechnicians =
    technicians.filter(
      (technician) => {
        const query =
          technicianSearch
            .trim()
            .toLocaleLowerCase(
              'tr-TR',
            )

        if (!query) {
          return true
        }

        return (
          technician.username
            .toLocaleLowerCase(
              'tr-TR',
            )
            .includes(query) ||
          technician.email
            .toLocaleLowerCase(
              'tr-TR',
            )
            .includes(query)
        )
      },
    )

  /*
   * --------------------------------------------------
   * SON ATAMA
   * --------------------------------------------------
   */

  const assignedDisplay =
    lastAssigned &&
    lastAssigned.user.username ===
      incident?.assignedToUsername
      ? lastAssigned
      : null

  /*
   * --------------------------------------------------
   * RENDER
   * --------------------------------------------------
   */

  return (
    <AppShell>

      {/* TOAST */}

      {toast && (
        <div className="toast">
          <CheckCircle2 size={15} />

          {toast}
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div
          className="panel"
          style={{
            padding: 28,
          }}
        >
          <div
            className="skeleton skeleton-line"
            style={{
              width: '40%',
              height: 24,
              marginBottom: 16,
            }}
          />

          <div
            className="skeleton skeleton-line"
            style={{
              width: '100%',
              marginBottom: 8,
            }}
          />

          <div
            className="skeleton skeleton-line"
            style={{
              width: '80%',
            }}
          />
        </div>

      ) : error || !incident ? (

        <ErrorState
          message={
            error ??
            'Olay bulunamadı.'
          }
          onRetry={load}
        />

      ) : editing ? (

        /*
         * ------------------------------------------------
         * EDIT MODE
         * ------------------------------------------------
         */

        <>
          <div className="page-heading compact">

            <div>
              <p className="eyebrow">
                OLAY #{incident.id}
              </p>

              <h1>
                Olayı Düzenle
              </h1>

              <p className="lead">
                Değişiklikler için ADMIN
                veya SUPERVISOR yetkisi
                gereklidir.
              </p>
            </div>

            <button
              className="secondary-btn"
              onClick={() =>
                setEditing(false)
              }
              type="button"
            >
              <X size={14} />

              Vazgeç
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

        /*
         * ------------------------------------------------
         * DETAIL
         * ------------------------------------------------
         */

        <>

          <div className="page-heading">

            <div>

              <p className="eyebrow">
                OLAY #{incident.id}
              </p>

              <h1>
                {incident.title}
              </h1>

              <div className="detail-badges">

                <IncidentStatusBadge
                  status={incident.status}
                />

                <IncidentPriorityBadge
                  priority={
                    incident.priority
                  }
                />

              </div>

            </div>

          </div>

          {actionError && (
            <ErrorState
              message={actionError}
            />
          )}

          <div className="content-grid">

            {/* ==========================================
                SOL PANEL
               ========================================== */}

            <div
              className="panel"
              style={{
                padding: 24,
              }}
            >

              {/* AÇIKLAMA */}

              <h2
                style={{
                  fontSize: 15,
                  margin:
                    '0 0 10px',
                }}
              >
                Açıklama
              </h2>

              <p
                style={{
                  fontSize: 12,
                  color: '#666',
                  lineHeight: 1.7,
                  margin:
                    '0 0 24px',
                }}
              >
                {
                  incident.description
                }
              </p>

              {/* ======================================
                  BİLGİ KARTLARI
                 ====================================== */}

              <div
                className="detail-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(3, minmax(0, 1fr))',
                  gap: 12,
                  marginTop: 28,
                }}
              >

                {/* OLUŞTURAN */}

                <div
                  style={{
                    padding: 16,
                    border:
                      '1px solid #e8e8ed',
                    borderRadius: 16,
                    background:
                      '#fafafa',
                    minHeight: 104,
                  }}
                >

                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: 8,
                      marginBottom: 14,
                      color: '#777',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing:
                        '0.08em',
                      textTransform:
                        'uppercase',
                    }}
                  >

                    <UserRound
                      size={14}
                    />

                    Oluşturan

                  </div>

                  <strong
                    style={{
                      display:
                        'block',
                      fontSize: 14,
                      color: '#171717',
                    }}
                  >
                    {
                      incident.createdByUsername ??
                      '—'
                    }
                  </strong>

                  <small
                    className="muted"
                    style={{
                      display:
                        'block',
                      marginTop: 5,
                    }}
                  >
                    Olayı oluşturan
                    kullanıcı
                  </small>

                </div>

                {/* ATANAN */}

                <div
                  style={{
                    padding: 16,
                    border:
                      '1px solid #e8e8ed',
                    borderRadius: 16,
                    background:
                      '#fafafa',
                    minHeight: 104,
                  }}
                >

                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: 8,
                      marginBottom: 14,
                      color: '#777',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing:
                        '0.08em',
                      textTransform:
                        'uppercase',
                    }}
                  >

                    <Wrench
                      size={14}
                    />

                    Atanan

                  </div>

                  {incident.assignedToUsername ? (

                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: 10,
                      }}
                    >

                      <div
                        className="tiny-avatar"
                        style={{
                          width: 30,
                          height: 30,
                          flexShrink: 0,
                        }}
                      >
                        {
                          incident.assignedToUsername
                            .slice(
                              0,
                              2,
                            )
                            .toUpperCase()
                        }
                      </div>

                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >

                        <strong
                          style={{
                            display:
                              'block',
                            fontSize: 14,
                          }}
                        >
                          {
                            incident.assignedToUsername
                          }
                        </strong>

                        <small
                          className="muted"
                          style={{
                            display:
                              'block',
                            marginTop: 4,
                          }}
                        >
                          Teknisyen
                        </small>

                      </div>

                    </div>

                  ) : (

                    <>
                      <strong
                        style={{
                          display:
                            'block',
                          fontSize: 14,
                          color: '#777',
                        }}
                      >
                        Atanmadı
                      </strong>

                      <small
                        className="muted"
                        style={{
                          display:
                            'block',
                          marginTop: 5,
                        }}
                      >
                        Henüz teknisyen
                        atanmadı
                      </small>
                    </>

                  )}

                </div>

                {/* OLUŞTURULMA */}

                <div
                  style={{
                    padding: 16,
                    border:
                      '1px solid #e8e8ed',
                    borderRadius: 16,
                    background:
                      '#fafafa',
                    minHeight: 104,
                  }}
                >

                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: 8,
                      marginBottom: 14,
                      color: '#777',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing:
                        '0.08em',
                      textTransform:
                        'uppercase',
                    }}
                  >

                    <CalendarDays
                      size={14}
                    />

                    Oluşturulma

                  </div>

                  <strong
                    style={{
                      display:
                        'block',
                      fontSize: 14,
                      lineHeight: 1.4,
                    }}
                  >
                    {formatDate(
                      incident.createdAt,
                    )}
                  </strong>

                  <small
                    className="muted"
                    style={{
                      display:
                        'block',
                      marginTop: 5,
                    }}
                  >
                    Olayın sisteme
                    kaydedildiği zaman
                  </small>

                </div>

                {/* SON ATAMA */}

                {assignedDisplay && (
                  <div
                    style={{
                      gridColumn:
                        '1 / -1',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: 12,
                      padding:
                        '13px 16px',
                      borderRadius: 14,
                      background:
                        '#f7f7f9',
                      border:
                        '1px solid #ececf0',
                    }}
                  >

                    <Clock3
                      size={16}
                      style={{
                        color: '#777',
                        flexShrink: 0,
                      }}
                    />

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >

                      <small
                        style={{
                          display:
                            'block',
                          color: '#777',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing:
                            '0.07em',
                          textTransform:
                            'uppercase',
                          marginBottom: 3,
                        }}
                      >
                        Son atama zamanı
                      </small>

                      <strong
                        style={{
                          fontSize: 12,
                        }}
                      >
                        {formatDate(
                          assignedDisplay.at,
                        )}
                      </strong>

                    </div>

                  </div>
                )}

              </div>

              {/* ======================================
                  DURUM
                 ====================================== */}

              {username &&
                incident.assignedToUsername ===
                  username && (

                <div>

                  <h2
                    style={{
                      fontSize: 13,
                      margin:
                        '20px 0 6px',
                    }}
                  >
                    Durumu Güncelle
                  </h2>

                  <p
                    className="muted"
                    style={{
                      fontSize: 11,
                      margin: 0,
                    }}
                  >
                    Bu olay size atandığı
                    için durumu
                    değiştirebilirsiniz.
                  </p>

                  <div
                    className="status-quick"
                  >

                    {nextAllowedStatuses(
                      incident.status,
                    ).map((s) => (

                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            s,
                          )
                        }
                        disabled={
                          statusUpdating
                        }
                      >
                        {
                          STATUS_LABELS[
                            s
                          ]
                        } olarak
                        işaretle
                      </button>

                    ))}

                    {nextAllowedStatuses(
                      incident.status,
                    ).length === 0 && (

                      <span
                        className="muted"
                        style={{
                          fontSize: 11,
                        }}
                      >
                        Bu olay için başka
                        bir duruma geçiş
                        yapılamaz.
                      </span>

                    )}

                  </div>

                </div>

              )}

              {/* ======================================
                  AKSİYONLAR
                 ====================================== */}

              <div
                className="detail-actions"
              >

                {canManage && (
                  <button
                    className="secondary-btn"
                    onClick={() =>
                      setEditing(true)
                    }
                    type="button"
                  >
                    <Pencil
                      size={13}
                    />

                    Düzenle
                  </button>
                )}

                {canManage && (
                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setAssignOpen(
                        (value) =>
                          !value,
                      )

                      setAssignError(
                        null,
                      )

                      setTechnicianSearch(
                        '',
                      )

                      setSelectedTechnician(
                        null,
                      )
                    }}
                    type="button"
                  >
                    <UserPlus
                      size={13}
                    />

                    {incident.assignedToUsername
                      ? 'Teknisyeni Değiştir'
                      : 'Teknisyene Ata'}
                  </button>
                )}

                {canDelete && (
                  <button
                    className="secondary-btn"
                    onClick={
                      handleDelete
                    }
                    disabled={
                      deleting
                    }
                    type="button"
                    style={{
                      color:
                        'var(--trt-red)',
                      borderColor:
                        '#f6cccf',
                    }}
                  >
                    <Trash2
                      size={13}
                    />

                    {deleting
                      ? 'Siliniyor...'
                      : 'Sil'}
                  </button>
                )}

              </div>

              {/* ======================================
                  TEKNİSYEN ATAMA PANELİ
                 ====================================== */}

              {canManage &&
                assignOpen && (

                <form
                  onSubmit={
                    handleAssign
                  }
                  style={{
                    marginTop: 22,
                    maxWidth: 570,
                  }}
                >

                  {/* BAŞLIK */}

                  <div
                    style={{
                      marginBottom: 15,
                    }}
                  >

                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'space-between',
                        gap: 12,
                        marginBottom: 5,
                      }}
                    >

                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: 9,
                        }}
                      >

                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            display:
                              'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'center',
                            background:
                              '#f5f5f7',
                            border:
                              '1px solid #e8e8ed',
                            color:
                              '#555',
                          }}
                        >
                          <Wrench
                            size={15}
                          />
                        </div>

                        <div>

                          <h3
                            style={{
                              margin: 0,
                              fontSize: 14,
                              fontWeight: 650,
                              letterSpacing:
                                '-0.01em',
                              color:
                                '#171717',
                            }}
                          >
                            Teknisyen seç
                          </h3>

                          <p
                            style={{
                              margin:
                                '3px 0 0',
                              fontSize: 10,
                              color:
                                '#999',
                            }}
                          >
                            Olayı atamak
                            istediğiniz
                            teknisyeni seçin.
                          </p>

                        </div>

                      </div>

                      <span
                        style={{
                          display:
                            'inline-flex',
                          alignItems:
                            'center',
                          gap: 5,
                          padding:
                            '6px 9px',
                          borderRadius:
                            999,
                          background:
                            '#f5f5f7',
                          border:
                            '1px solid #e8e8ed',
                          color:
                            '#777',
                          fontSize: 9,
                          fontWeight: 650,
                          whiteSpace:
                            'nowrap',
                        }}
                      >
                        <UserRound
                          size={11}
                        />

                        {
                          technicians.length
                        }{' '}
                        teknisyen
                      </span>

                    </div>

                  </div>

                  {/* ARAMA */}

                  <div
                    style={{
                      position:
                        'relative',
                      marginBottom: 12,
                    }}
                  >

                    <Search
                      size={16}
                      style={{
                        position:
                          'absolute',
                        left: 14,
                        top: '50%',
                        transform:
                          'translateY(-50%)',
                        color:
                          '#999',
                        pointerEvents:
                          'none',
                      }}
                    />

                    <input
                      type="text"
                      value={
                        technicianSearch
                      }
                      onChange={(e) =>
                        setTechnicianSearch(
                          e.target.value,
                        )
                      }
                      placeholder="İsim veya e-posta ile ara..."
                      style={{
                        width:
                          '100%',
                        height: 46,
                        boxSizing:
                          'border-box',
                        padding:
                          '0 44px 0 42px',
                        borderRadius:
                          13,
                        border:
                          '1px solid #e5e5e7',
                        background:
                          '#f8f8fa',
                        fontSize: 12,
                        color:
                          '#171717',
                        outline:
                          'none',
                        boxShadow:
                          'inset 0 1px 2px rgba(0,0,0,0.02)',
                        transition:
                          'border-color 160ms ease, background 160ms ease, box-shadow 160ms ease',
                      }}
                    />

                    {technicianSearch && (
                      <button
                        type="button"
                        onClick={() =>
                          setTechnicianSearch(
                            '',
                          )
                        }
                        aria-label="Aramayı temizle"
                        style={{
                          position:
                            'absolute',
                          right: 10,
                          top: '50%',
                          transform:
                            'translateY(-50%)',
                          width: 26,
                          height: 26,
                          border: 0,
                          borderRadius:
                            '50%',
                          background:
                            '#e8e8ed',
                          color:
                            '#666',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          cursor:
                            'pointer',
                        }}
                      >
                        <X
                          size={13}
                        />
                      </button>
                    )}

                  </div>

                  {/* TEKNİSYEN LİSTESİ */}

                  <div
                    style={{
                      display:
                        'flex',
                      flexDirection:
                        'column',
                      gap: 8,
                      maxHeight: 280,
                      overflowY:
                        'auto',
                      padding:
                        '2px 1px 4px',
                    }}
                  >

                    {techniciansLoading ? (

                      <div
                        className="callout"
                        style={{
                          padding: 14,
                          margin: 0,
                        }}
                      >
                        <span className="muted">
                          Teknisyenler
                          yükleniyor...
                        </span>
                      </div>

                    ) : (

                      filteredTechnicians.map(
                        (technician) => {

                          const selected =
                            selectedTechnician?.id ===
                            technician.id

                          const alreadyAssigned =
                            incident.assignedToUsername ===
                            technician.username

                          /*
                           * Backend'den gelen
                           * available / activeIncidentCount
                           * alanları.
                           */

                          const tech =
                            technician as UserSummaryResponse & {
                              available?: boolean
                              activeIncidentCount?: number
                            }

                          const available =
                            tech.available ??
                            true

                          const activeCount =
                            tech.activeIncidentCount ??
                            0

                          return (

                            <button
                              key={
                                technician.id
                              }
                              type="button"
                              disabled={
                                alreadyAssigned
                              }
                              onClick={() => {

                                if (
                                  !alreadyAssigned
                                ) {
                                  setSelectedTechnician(
                                    technician,
                                  )
                                }

                              }}
                              style={{
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                gap: 12,
                                width:
                                  '100%',
                                padding:
                                  '13px 14px',
                                borderRadius:
                                  16,
                                border:
                                  selected
                                    ? '1.5px solid #111'
                                    : alreadyAssigned
                                      ? '1px solid #e5e5e7'
                                      : '1px solid #e8e8e8',
                                background:
                                  selected
                                    ? '#f7f7f8'
                                    : '#fff',
                                cursor:
                                  alreadyAssigned
                                    ? 'not-allowed'
                                    : 'pointer',
                                textAlign:
                                  'left',
                                opacity:
                                  alreadyAssigned
                                    ? 0.55
                                    : 1,
                                transition:
                                  'all 160ms ease',
                                boxShadow:
                                  selected
                                    ? '0 6px 20px rgba(0,0,0,0.08)'
                                    : '0 1px 2px rgba(0,0,0,0.025)',
                              }}
                            >

                              {/* AVATAR */}

                              <div
                                className="tiny-avatar"
                                style={{
                                  width: 38,
                                  height: 38,
                                  flexShrink: 0,
                                  fontSize: 10,
                                  fontWeight: 700,
                                }}
                              >
                                {
                                  technician.username
                                    .slice(
                                      0,
                                      2,
                                    )
                                    .toUpperCase()
                                }
                              </div>

                              {/* BİLGİ */}

                              <div
                                style={{
                                  minWidth:
                                    0,
                                  flex: 1,
                                }}
                              >

                                <strong
                                  style={{
                                    display:
                                      'block',
                                    fontSize: 12,
                                    color:
                                      '#171717',
                                  }}
                                >
                                  {
                                    technician.username
                                  }
                                </strong>

                                <small
                                  className="muted"
                                  style={{
                                    display:
                                      'block',
                                    marginTop:
                                      3,
                                    fontSize:
                                      10,
                                  }}
                                >
                                  {
                                    technician.email
                                  }
                                </small>

                              </div>

                              {/* DURUM */}

                              <div
                                style={{
                                  flexShrink:
                                    0,
                                  textAlign:
                                    'right',
                                }}
                              >

                                {alreadyAssigned ? (

                                  <div
                                    style={{
                                      display:
                                        'inline-flex',
                                      alignItems:
                                        'center',
                                      gap: 5,
                                      padding:
                                        '6px 9px',
                                      borderRadius:
                                        999,
                                      background:
                                        '#ecfdf3',
                                      color:
                                        '#16834b',
                                      fontSize:
                                        9,
                                      fontWeight:
                                        700,
                                    }}
                                  >

                                    <CheckCircle2
                                      size={11}
                                    />

                                    Atanmış

                                  </div>

                                ) : (

                                  <>

                                    <div
                                      style={{
                                        display:
                                          'inline-flex',
                                        alignItems:
                                          'center',
                                        gap: 5,
                                        padding:
                                          '6px 9px',
                                        borderRadius:
                                          999,
                                        background:
                                          available
                                            ? '#ecfdf3'
                                            : '#fff1f2',
                                        color:
                                          available
                                            ? '#16834b'
                                            : '#b42318',
                                        fontSize:
                                          9,
                                        fontWeight:
                                          700,
                                      }}
                                    >

                                      <span
                                        style={{
                                          width: 5,
                                          height: 5,
                                          borderRadius:
                                            '50%',
                                          background:
                                            'currentColor',
                                        }}
                                      />

                                      {available
                                        ? 'Müsait'
                                        : 'Meşgul'}

                                    </div>

                                    {!available &&
                                      activeCount >
                                        0 && (

                                      <small
                                        className="muted"
                                        style={{
                                          display:
                                            'block',
                                          marginTop:
                                            4,
                                          fontSize:
                                            9,
                                        }}
                                      >
                                        {
                                          activeCount
                                        }{' '}
                                        aktif olay
                                      </small>

                                    )}

                                  </>

                                )}

                              </div>

                              {/* SEÇİLİ */}

                              {selected && (
                                <CheckCircle2
                                  size={17}
                                  className="ok"
                                />
                              )}

                            </button>

                          )
                        },
                      )

                    )}

                    {!techniciansLoading &&
                      filteredTechnicians.length ===
                        0 && (

                      <div
                        className="callout"
                        style={{
                          padding: 14,
                          margin: 0,
                        }}
                      >

                        <strong>
                          Teknisyen bulunamadı
                        </strong>

                        <p>
                          Arama kriterinize
                          uygun bir
                          teknisyen
                          bulunamadı.
                        </p>

                      </div>

                    )}

                  </div>

                  {/* AYIRICI + BUTON */}

                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 15,
                      borderTop:
                        '1px solid #eeeeF0',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'flex-end',
                    }}
                  >

                    <button
                      className="primary-btn"
                      type="submit"
                      disabled={
                        assigning ||
                        !selectedTechnician ||
                        selectedTechnician.username ===
                          incident.assignedToUsername
                      }
                      style={{
                        minWidth: 145,
                        height: 42,
                        borderRadius: 12,
                      }}
                    >

                      {assigning
                        ? 'Atanıyor...'
                        : incident.assignedToUsername
                          ? 'Teknisyeni Değiştir →'
                          : 'Atama Yap →'}

                    </button>

                  </div>

                  {assignError && (
                    <span
                      className="field-error"
                      style={{
                        display:
                          'block',
                        marginTop: 8,
                      }}
                    >
                      {assignError}
                    </span>
                  )}

                </form>

              )}

            </div>

            {/* ==========================================
                SAĞ PANEL — OLAY GEÇMİŞİ
               ========================================== */}

            <div className="panel full-panel">

              <div className="panel-head">

                <div>

                  <h2>
                    Olay Geçmişi
                  </h2>

                  <p>
                    Bu olayla ilgili
                    tüm aksiyonlar
                  </p>

                </div>

              </div>

              <IncidentTimeline
                history={history}
              />

            </div>

          </div>

        </>

      )}

    </AppShell>
  )
}