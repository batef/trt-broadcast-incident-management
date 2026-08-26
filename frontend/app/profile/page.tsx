'use client'

import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/hooks/use-auth'

export default function ProfilePage() {
  const { username } = useAuth()

  return (
    <AppShell>
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">HESAP</p>
          <h1>Profil</h1>
          <p className="lead">Oturum bilgileriniz.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: 28, maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26 }}>
          <div className="avatar" style={{ width: 52, height: 52, fontSize: 16 }}>
            {username ? username.slice(0, 2).toUpperCase() : '—'}
          </div>
          <div>
            <strong style={{ fontSize: 15, display: 'block' }}>{username ?? 'Bilinmiyor'}</strong>
            <span className="muted" style={{ fontSize: 11 }}>Oturum açık</span>
          </div>
        </div>

        <div className="callout" style={{ marginBottom: 0 }}>
          <div>
            <strong>Sınırlı profil bilgisi</strong>
            <p>
              Backend, giriş belirtecinde (JWT) yalnızca kullanıcı adınızı taşıyor; e-posta,
              rol veya diğer bilgilerinizi döndüren bir uç nokta bulunmuyor. Bu yüzden burada
              yalnızca kullanıcı adınızı gösterebiliyoruz.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
