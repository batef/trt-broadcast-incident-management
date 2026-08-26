'use client'

import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { IncidentForm } from '@/components/incidents/IncidentForm'
import { createIncident } from '@/lib/api/incidents'
import type { IncidentRequest } from '@/lib/types'

export default function NewIncidentPage() {
  const router = useRouter()

  async function handleSubmit(request: IncidentRequest) {
    const created = await createIncident(request)
    router.push(`/incidents/${created.id}`)
  }

  return (
    <AppShell>
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">OPERASYON / OLAYLAR</p>
          <h1>Yeni Olay</h1>
          <p className="lead">Yayın operasyonunda tespit edilen yeni bir teknik olayı kaydedin.</p>
        </div>
      </div>
      <div className="panel">
        <IncidentForm submitLabel="Olayı Oluştur" onSubmit={handleSubmit} />
      </div>
    </AppShell>
  )
}
