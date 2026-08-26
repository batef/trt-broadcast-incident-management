'use client'

import { useState } from 'react'
import type { IncidentRequest, IncidentStatus, Priority } from '@/lib/types'
import { PRIORITY_LABELS, STATUS_LABELS } from '@/lib/types'
import { ApiError } from '@/lib/api/client'

const TITLE_MAX = 255
const DESCRIPTION_MAX = 2000

interface Props {
  initial?: Partial<IncidentRequest>
  submitLabel: string
  onSubmit: (request: IncidentRequest) => Promise<void>
}

export function IncidentForm({ initial, submitLabel, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'MEDIUM')
  const [status, setStatus] = useState<IncidentStatus>(initial?.status ?? 'OPEN')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (title.trim().length === 0) next.title = 'Başlık boş bırakılamaz.'
    else if (title.length > TITLE_MAX) next.title = `Başlık ${TITLE_MAX} karakteri geçemez.`
    if (description.trim().length === 0) next.description = 'Açıklama boş bırakılamaz.'
    else if (description.length > DESCRIPTION_MAX)
      next.description = `Açıklama ${DESCRIPTION_MAX} karakteri geçemez.`
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return
    setSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), priority, status })
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Kaydedilirken bir hata oluştu.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <div className="form-section">
        <h2>Olay Bilgileri</h2>
        <p>Yayın operasyonunda tespit edilen teknik olayı kayıt altına alın.</p>

        <label>
          Başlık
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn. Stüdyo 3 ses kartı arızası"
            maxLength={TITLE_MAX}
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title ? (
            <span className="field-error">{errors.title}</span>
          ) : (
            <span className="field-hint">{title.length}/{TITLE_MAX}</span>
          )}
        </label>

        <label>
          Açıklama
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Olayın detaylarını, etkisini ve gözlemleri yazın."
            rows={6}
            maxLength={DESCRIPTION_MAX}
            aria-invalid={Boolean(errors.description)}
          />
          {errors.description ? (
            <span className="field-error">{errors.description}</span>
          ) : (
            <span className="field-hint">{description.length}/{DESCRIPTION_MAX}</span>
          )}
        </label>

        <div className="form-two">
          <label>
            Öncelik
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Durum
            <select value={status} onChange={(e) => setStatus(e.target.value as IncidentStatus)}>
              {(Object.keys(STATUS_LABELS) as IncidentStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {submitError && (
          <div className="callout callout-error" role="alert" style={{ marginTop: 16 }}>
            <p style={{ margin: 0 }}>{submitError}</p>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="primary-btn" disabled={submitting}>
            {submitting ? 'Kaydediliyor...' : submitLabel}
          </button>
        </div>
      </div>

      <div className="callout">
        <div>
          <strong>Not</strong>
          <p>
            Öncelik ve durum alanları operasyon merkezinin mevcut yükünü doğru yansıtmalıdır.
            Kritik olaylar anında ilgili teknisyene bildirilir.
          </p>
        </div>
      </div>
    </form>
  )
}
