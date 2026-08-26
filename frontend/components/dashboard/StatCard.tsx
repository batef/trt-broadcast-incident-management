import type { LucideIcon } from 'lucide-react'

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: number
  icon: LucideIcon
  tone?: 'default' | 'red' | 'green' | 'blue'
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone !== 'default' ? tone : ''}`}>
        <Icon size={17} />
      </div>
      <div>
        <p>{label}</p>
        <h3>{value}</h3>
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card skeleton-card">
      <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 7 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton-line" style={{ width: '60%', marginBottom: 10 }} />
        <div className="skeleton skeleton-line" style={{ width: '35%', height: 20 }} />
      </div>
    </div>
  )
}
