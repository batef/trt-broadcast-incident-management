'use client'

import { useState } from 'react'
import { Copy, Plus, ShieldAlert, X } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/hooks/use-auth'
import { createUser } from '@/lib/api/users'
import { ApiError } from '@/lib/api/client'
import { ROLE_LABELS, type CreateUserResponse, type Role } from '@/lib/types'

// ÖNEMLİ: Backend'de kullanıcıları LİSTELEYEN bir endpoint yok
// (yalnızca POST /api/users var, ve artık sadece ADMIN çağırabiliyor).
// Bu yüzden aşağıdaki tablo tamamen kurgusal/demo veridir — yalnızca
// tasarımı göstermek içindir ve backend'den gelmiyor.
const demoUsers: { username: string; role: Role; status: 'active' | 'inactive'; lastActive: string }[] = [
  { username: 'operasyon.merkezi', role: 'ADMIN', status: 'active', lastActive: '2 dk önce' },
  { username: 'teknisyen.demo1', role: 'TECHNICIAN', status: 'active', lastActive: '18 dk önce' },
  { username: 'sorumlu.demo1', role: 'SUPERVISOR', status: 'active', lastActive: '1 sa önce' },
  { username: 'teknisyen.demo2', role: 'TECHNICIAN', status: 'inactive', lastActive: '3 gün önce' },
]

export default function UsersPage() {
  const { role } = useAuth()
  const isAdmin = role === 'ADMIN'

  const [formOpen, setFormOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [userRole, setUserRole] = useState<Role>('TECHNICIAN')
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreateUserResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !email.trim()) {
      setError('Kullanıcı adı ve e-posta gereklidir.')
      return
    }
    setSubmitting(true)
    try {
      const response = await createUser({ username: username.trim(), email: email.trim(), role: userRole })
      setCreated(response)
      setFormOpen(false)
      setUsername('')
      setEmail('')
      setUserRole('TECHNICIAN')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kullanıcı oluşturulamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyPassword() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.temporaryPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard erişimi yoksa sessizce yok say; şifre zaten ekranda görünür
    }
  }

  return (
    <AppShell>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YÖNETİM</p>
          <h1>Kullanıcılar</h1>
          <p className="lead">Kurumsal kullanıcı yönetimi.</p>
        </div>
        {isAdmin && (
          <button className="primary-btn" onClick={() => { setFormOpen((v) => !v); setCreated(null) }} type="button">
            {formOpen ? <X size={15} /> : <Plus size={15} />}
            {formOpen ? 'Vazgeç' : 'Yeni Kullanıcı'}
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="callout" style={{ marginBottom: 20 }}>
          <ShieldAlert size={16} />
          <div>
            <strong>Sınırlı erişim</strong>
            <p>Yeni kullanıcı oluşturma yalnızca ADMIN rolündeki kullanıcılara açıktır.</p>
          </div>
        </div>
      )}

      {created && (
        <div className="panel" style={{ padding: 24, marginBottom: 24, borderColor: '#cdeadb' }}>
          <h2 style={{ fontSize: 15, margin: '0 0 4px', color: '#168447' }}>Geçici şifre oluşturuldu</h2>
          <p className="muted" style={{ fontSize: 11, margin: '0 0 18px' }}>
            Bu şifre yalnızca şimdi gösterilir, daha sonra tekrar görüntülenemez.
          </p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <small className="field-hint" style={{ display: 'block', marginBottom: 4 }}>Kullanıcı</small>
              <strong>{created.username}</strong>
            </div>
            <div>
              <small className="field-hint" style={{ display: 'block', marginBottom: 4 }}>Rol</small>
              <strong>{ROLE_LABELS[created.role]}</strong>
            </div>
            <div>
              <small className="field-hint" style={{ display: 'block', marginBottom: 4 }}>Geçici Şifre</small>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontFamily: 'monospace', fontSize: 14 }}>{created.temporaryPassword}</strong>
                <button className="link-btn" onClick={copyPassword} type="button">
                  <Copy size={12} style={{ verticalAlign: -2 }} /> {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </div>
          </div>
          <div className="callout" style={{ marginBottom: 0, background: '#fff8e9', borderColor: '#f3e5c9', color: '#8a6100' }}>
            <p style={{ margin: 0 }}>
              Bu şifreyi güvenli şekilde kullanıcıya iletin. Kullanıcı ilk girişte yeni bir şifre
              belirlemek zorundadır.
            </p>
          </div>
        </div>
      )}

      {isAdmin && formOpen && (
        <div className="panel" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Yeni Kullanıcı Oluştur</h2>
          <p className="muted" style={{ fontSize: 11, margin: '0 0 20px' }}>
            Şifre alanı yoktur — sisteme ilk girişte kullanılacak geçici şifreyi backend üretir.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-two">
              <label>
                Kullanıcı Adı
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="kullanici.adi" />
              </label>
              <label>
                E-posta
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kullanici@trt.gov.tr"
                />
              </label>
            </div>
            <label>
              Rol
              <select value={userRole} onChange={(e) => setUserRole(e.target.value as Role)}>
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
            {error && (
              <div className="callout callout-error" role="alert" style={{ marginBottom: 16, marginTop: 16 }}>
                <p style={{ margin: 0 }}>{error}</p>
              </div>
            )}
            <div className="form-actions" style={{ marginTop: 8 }}>
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? 'Oluşturuluyor...' : 'Kullanıcıyı Oluştur'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel full-panel">
        <div className="panel-head">
          <div>
            <h2>Kullanıcı Listesi</h2>
            <p>Backend şu an kullanıcı listeleme uç noktası sunmuyor</p>
          </div>
          <span className="demo-tag">Demo veri</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kullanıcı Adı</th>
                <th>Rol</th>
                <th>Durum</th>
                <th>Son Aktivite</th>
                <th aria-hidden />
              </tr>
            </thead>
            <tbody>
              {demoUsers.map((user) => (
                <tr key={user.username}>
                  <td>
                    <div className="assignee">
                      <div className="tiny-avatar">{user.username.slice(0, 2).toUpperCase()}</div>
                      {user.username}
                    </div>
                  </td>
                  <td className="muted">{ROLE_LABELS[user.role]}</td>
                  <td>
                    <span className={`badge ${user.status === 'active' ? 'badge-low' : 'badge-review'}`}>
                      <span className="status-dot" />
                      {user.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="muted">{user.lastActive}</td>
                  <td>
                    <button
                      className="row-more"
                      disabled
                      title="Bu işlem backend'de henüz desteklenmiyor"
                      type="button"
                    >
                      •••
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
