'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useTheme } from '@/hooks/use-theme'

const NOTIF_KEY = 'trt_incident_notifications'

export default function SettingsPage() {
  const { dark, setDark } = useTheme()
  const [notifyCritical, setNotifyCritical] = useState(true)
  const [notifyAssigned, setNotifyAssigned] = useState(true)

  useEffect(() => {
    const saved = window.localStorage.getItem(NOTIF_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setNotifyCritical(Boolean(parsed.critical))
        setNotifyAssigned(Boolean(parsed.assigned))
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      NOTIF_KEY,
      JSON.stringify({ critical: notifyCritical, assigned: notifyAssigned }),
    )
  }, [notifyCritical, notifyAssigned])

  return (
    <AppShell>
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">HESAP</p>
          <h1>Ayarlar</h1>
          <p className="lead">Görünüm ve bildirim tercihlerinizi yönetin.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: 28 }}>
        <div className="settings-list">
          <h2>Görünüm</h2>
          <label className="checkbox">
            <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
            Koyu tema kullan
          </label>
          <span className="field-hint" style={{ marginTop: -8 }}>
            Tercihiniz bu tarayıcıda saklanır ve tüm sayfalara uygulanır.
          </span>

          <h2>Bildirimler</h2>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={notifyCritical}
              onChange={(e) => setNotifyCritical(e.target.checked)}
            />
            Kritik önceliğe sahip yeni olaylarda bildir
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={notifyAssigned}
              onChange={(e) => setNotifyAssigned(e.target.checked)}
            />
            Bana bir olay atandığında bildir
          </label>
          <span className="field-hint" style={{ marginTop: -8 }}>
            Backend'de bildirim gönderen bir servis bulunmuyor; bu tercihler yalnızca bu
            tarayıcıdaki bildirim arayüzünün davranışını belirler.
          </span>
        </div>
      </div>
    </AppShell>
  )
}
