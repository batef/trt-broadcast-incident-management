import { AlertTriangle, RotateCcw } from 'lucide-react'

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="callout callout-error" role="alert">
      <AlertTriangle size={16} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0 }}>{message}</p>
      </div>
      {onRetry && (
        <button className="secondary-btn" onClick={onRetry} type="button">
          <RotateCcw size={13} />
          Tekrar dene
        </button>
      )}
    </div>
  )
}
