import type { IncidentHistoryResponse } from '@/lib/types'

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

// Backend'deki action string'lerini (ör. "CREATED", "STATUS_CHANGED") daha
// okunur bir Türkçe başlığa çeviriyoruz; backend'in ürettiği ham metni de
// (details) altında olduğu gibi gösteriyoruz.
function actionLabel(action: string) {
  const known: Record<string, string> = {
    CREATED: 'Olay oluşturuldu',
    ASSIGNED: 'Teknisyene atandı',
    STATUS_CHANGED: 'Durum değiştirildi',
    UPDATED: 'Olay güncellendi',
  }
  return known[action] ?? action
}

export function IncidentTimeline({ history }: { history: IncidentHistoryResponse[] }) {
  if (history.length === 0) {
    return <p className="muted" style={{ padding: '0 20px 20px' }}>Henüz geçmiş kaydı yok.</p>
  }

  return (
    <div className="timeline">
      {history.map((entry) => (
        <div className="timeline-item" key={entry.id}>
          <div className="timeline-dot" />
          <strong>{actionLabel(entry.action)}</strong>
          {entry.details && <p>{entry.details}</p>}
          <small>
            {entry.username} · {formatDate(entry.createdAt)}
          </small>
        </div>
      ))}
    </div>
  )
}
