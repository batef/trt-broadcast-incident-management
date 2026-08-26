import { PRIORITY_LABELS, type Priority } from '@/lib/types'

const priorityClass: Record<Priority, string> = {
  LOW: 'badge-low',
  MEDIUM: 'badge-medium',
  HIGH: 'badge-high',
  CRITICAL: 'badge-critical',
}

export function IncidentPriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge ${priorityClass[priority]}`}>{PRIORITY_LABELS[priority]}</span>
}
