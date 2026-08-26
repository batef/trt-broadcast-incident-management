'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertOctagon, CheckCircle2, CircleDot, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/hooks/use-auth'
import { getAllIncidents } from '@/lib/api/incidents'
import { ApiError } from '@/lib/api/client'
import { StatCard, StatCardSkeleton } from '@/components/dashboard/StatCard'
import { SystemStatus } from '@/components/dashboard/SystemStatus'
import { IncidentTable } from '@/components/incidents/IncidentTable'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import type { IncidentResponse } from '@/lib/types'

export default function DashboardPage() {
  const { username } = useAuth()
  const [incidents, setIncidents] = useState<IncidentResponse[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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

  const stats = useMemo(() => {
    if (!incidents) return null
    return {
      open: incidents.filter((i) => i.status === 'OPEN').length,
      inProgress: incidents.filter((i) => i.status === 'IN_PROGRESS').length,
      resolved: incidents.filter((i) => i.status === 'RESOLVED').length,
      critical: incidents.filter((i) => i.priority === 'CRITICAL').length,
    }
  }, [incidents])

  const recent = useMemo(() => {
    if (!incidents) return []
    return [...incidents]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
  }, [incidents])

  return (
    <AppShell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">GENEL BAKIŞ</p>
          <h1>Günaydın{username ? `, ${username}` : ''}</h1>
          <p className="lead">Yayın operasyonlarının güncel durumu.</p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <div className="stats-grid">
        {loading || !stats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Açık Olaylar" value={stats.open} icon={CircleDot} tone="red" />
            <StatCard label="Devam Eden Olaylar" value={stats.inProgress} icon={Loader2} tone="blue" />
            <StatCard label="Çözülen Olaylar" value={stats.resolved} icon={CheckCircle2} tone="green" />
            <StatCard label="Kritik Olaylar" value={stats.critical} icon={AlertOctagon} tone="red" />
          </>
        )}
      </div>

      <div className="content-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Son Olaylar</h2>
              <p>En son bildirilen teknik olaylar</p>
            </div>
            <a href="/incidents" className="text-link">
              Tümünü Gör
            </a>
          </div>
          {loading ? (
            <div className="table-wrap">
              <table>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="skeleton-row">
                      <td colSpan={7}>
                        <div className="skeleton skeleton-line" style={{ width: '100%' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : recent.length === 0 ? (
            <EmptyState title="Henüz kayıtlı olay bulunmuyor." />
          ) : (
            <IncidentTable incidents={recent} />
          )}
        </div>

        <SystemStatus />
      </div>
    </AppShell>
  )
}
