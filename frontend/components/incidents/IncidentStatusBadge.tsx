import { STATUS_LABELS, type IncidentStatus } from '@/lib/types'

const statusClass: Record<IncidentStatus, string> = {
  OPEN: 'badge-open',
  INVESTIGATING: 'badge-review',
  IN_PROGRESS: 'badge-assigned',
  RESOLVED: 'badge-resolved',
  CLOSED: 'badge-low',
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span className={`badge ${statusClass[status]}`}>
      <span className="status-dot" />
      {STATUS_LABELS[status]}
    </span>
  )
}
