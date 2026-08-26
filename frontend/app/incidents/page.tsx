'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { IncidentTable } from '@/components/incidents/IncidentTable'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { getAllIncidents } from '@/lib/api/incidents'
import { ApiError } from '@/lib/api/client'
import { PRIORITY_LABELS, STATUS_LABELS, type IncidentResponse, type IncidentStatus, type Priority } from '@/lib/types'

const PAGE_SIZE = 10

type SortKey = 'newest' | 'oldest' | 'priority'

const priorityWeight: Record<Priority, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentResponse[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL')
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(1)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllIncidents()
      setIncidents(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Olaylar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, priorityFilter, sort])

  const filtered = useMemo(() => {
    if (!incidents) return []
    let result = incidents.filter((i) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        q.length === 0 || i.title.toLowerCase().includes(q) || String(i.id).includes(q)
      const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter
      const matchesPriority = priorityFilter === 'ALL' || i.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })
    result = [...result].sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return priorityWeight[b.priority] - priorityWeight[a.priority]
    })
    return result
  }, [incidents, search, statusFilter, priorityFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <AppShell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OPERASYON</p>
          <h1>Olaylar</h1>
          <p className="lead">Tüm yayın operasyon olaylarını görüntüleyin ve yönetin.</p>
        </div>
        <Link href="/incidents/new" className="primary-btn">
          <Plus size={15} /> Yeni Olay
        </Link>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <div className="panel full-panel">
        <div className="toolbar">
          <div className="filter-search" style={{ flex: 1, maxWidth: 320 }}>
            <Search size={13} />
            <input
              placeholder="Başlık veya ID ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Olay ara"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | 'ALL')}
            aria-label="Durum filtrele"
          >
            <option value="ALL">Tüm Durumlar</option>
            {(Object.keys(STATUS_LABELS) as IncidentStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | 'ALL')}
            aria-label="Öncelik filtrele"
          >
            <option value="ALL">Tüm Öncelikler</option>
            {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sırala"
          >
            <option value="newest">En Yeni</option>
            <option value="oldest">En Eski</option>
            <option value="priority">Önceliğe Göre</option>
          </select>
        </div>

        {loading ? (
          <div className="table-wrap">
            <table>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="skeleton-row">
                    <td colSpan={8}>
                      <div className="skeleton skeleton-line" style={{ width: '100%' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Henüz kayıtlı olay bulunmuyor."
            description={
              incidents && incidents.length > 0
                ? 'Arama veya filtre kriterlerinize uyan olay yok.'
                : undefined
            }
          />
        ) : (
          <>
            <IncidentTable incidents={paged} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderTop: '1px solid var(--line)',
              }}
            >
              <span className="muted" style={{ fontSize: 11 }}>
                {filtered.length} sonuçtan {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, filtered.length)} arası
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="secondary-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  type="button"
                >
                  <ChevronLeft size={14} /> Önceki
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  type="button"
                >
                  Sonraki <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
