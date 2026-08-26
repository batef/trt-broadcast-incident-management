'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { IncidentTable } from '@/components/incidents/IncidentTable'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { getMyAssignedIncidents } from '@/lib/api/incidents'
import { ApiError } from '@/lib/api/client'
import type { IncidentResponse } from '@/lib/types'

export default function AssignedPage() {
  const [incidents, setIncidents] = useState<IncidentResponse[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyAssignedIncidents()
      setIncidents(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Atanan olaylar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <AppShell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OPERASYON</p>
          <h1>Bana Atananlar</h1>
          <p className="lead">Size atanmış ve takip etmeniz gereken olaylar.</p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <div className="panel full-panel">
        {loading ? (
          <div className="table-wrap">
            <table>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="skeleton-row">
                    <td colSpan={8}>
                      <div className="skeleton skeleton-line" style={{ width: '100%' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !incidents || incidents.length === 0 ? (
          <EmptyState
            title="Size atanmış olay bulunmuyor."
            description="Yeni bir olay size atandığında burada görünecek."
          />
        ) : (
          <IncidentTable incidents={incidents} />
        )}
      </div>
    </AppShell>
  )
}
