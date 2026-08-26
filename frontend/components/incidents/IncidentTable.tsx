import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { IncidentStatusBadge } from '@/components/incidents/IncidentStatusBadge'
import { IncidentPriorityBadge } from '@/components/incidents/IncidentPriorityBadge'
import type { IncidentResponse } from '@/lib/types'

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function IncidentTable({ incidents }: { incidents: IncidentResponse[] }) {
  return (
    <>
      <div className="table-wrap incident-table-desktop">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Başlık</th>
              <th>Öncelik</th>
              <th>Durum</th>
              <th>Oluşturan</th>
              <th>Atanan</th>
              <th>Tarih</th>
              <th aria-hidden />
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id}>
                <td className="muted">#{incident.id}</td>
                <td>
                  <div className="incident-title">
                    <strong>{incident.title}</strong>
                  </div>
                </td>
                <td>
                  <IncidentPriorityBadge priority={incident.priority} />
                </td>
                <td>
                  <IncidentStatusBadge status={incident.status} />
                </td>
                <td className="muted">{incident.createdByUsername ?? '—'}</td>
                <td>
                  {incident.assignedToUsername ? (
                    <div className="assignee">
                      <div className="tiny-avatar">
                        {incident.assignedToUsername.slice(0, 2).toUpperCase()}
                      </div>
                      {incident.assignedToUsername}
                    </div>
                  ) : (
                    <span className="muted">Atanmadı</span>
                  )}
                </td>
                <td className="muted">{formatDate(incident.createdAt)}</td>
                <td>
                  <Link href={`/incidents/${incident.id}`} className="row-more" aria-label="Detay">
                    <ChevronRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="incident-card-list">
        {incidents.map((incident) => (
          <Link href={`/incidents/${incident.id}`} key={incident.id} className="incident-mobile-card">
            <div className="incident-mobile-card-top">
              <span className="muted">#{incident.id}</span>
              <IncidentStatusBadge status={incident.status} />
            </div>
            <strong>{incident.title}</strong>
            <div className="incident-mobile-card-bottom">
              <IncidentPriorityBadge priority={incident.priority} />
              <span className="muted">{formatDate(incident.createdAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
