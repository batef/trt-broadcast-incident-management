'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { changePassword } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { markPasswordChanged } from '@/lib/auth'
import { useAuth } from '@/hooks/use-auth'

const MIN_LENGTH = 8

export default function ChangePasswordPage() {
  const router = useRouter()
  // redirectIfUnauthenticated: oturum yoksa yine /login'e atar; oturum
  // varsa (mustChangePassword true olsa da) bu sayfada kalınmasına izin verir.
  useAuth()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < MIN_LENGTH) {
      setError(`Şifre en az ${MIN_LENGTH} karakter olmalıdır.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    setSubmitting(true)
    try {
      await changePassword({ newPassword, confirmPassword })
      markPasswordChanged()
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Şifre güncellenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="login-brand">
          <div className="brand-mark">TRT</div>
          <div>
            <strong>TRT BROADCAST</strong>
            <small>INCIDENT MANAGEMENT</small>
          </div>
        </div>
        <div className="visual-copy">
          <div className="overline">
            <ShieldCheck size={13} /> HESAP GÜVENLİĞİ
          </div>
          <h1>
            Devam etmeden önce <em>şifrenizi</em> belirleyin.
          </h1>
          <p>
            Hesabınız geçici bir şifreyle oluşturuldu. Güvenliğiniz için sisteme erişmeden önce
            kalıcı bir şifre belirlemeniz gerekiyor.
          </p>
        </div>
        <div className="copyright">© {new Date().getFullYear()} TRT — Tüm hakları saklıdır.</div>
      </div>

      <div className="login-form-wrap">
        <div className="login-card">
          <div className="mobile-login-logo">
            <div className="brand-mark">TRT</div>
          </div>
          <h2>Şifrenizi belirleyin</h2>
          <p className="login-sub">
            İlk girişiniz olduğu için devam etmeden önce yeni bir şifre belirlemeniz gerekiyor.
          </p>

          {success ? (
            <div className="callout" style={{ borderColor: '#cdeadb', background: '#ebf8ef', color: '#168447' }}>
              <p style={{ margin: 0 }}>Şifreniz başarıyla güncellendi. Yönlendiriliyorsunuz...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>
                Yeni Şifre
                <div className="password-input">
                  <input
                    type={show ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} aria-label="Şifreyi göster/gizle">
                    {show ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </label>
              <label>
                Yeni Şifre Tekrar
                <div className="password-input">
                  <input
                    type={show ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </div>
              </label>
              <span className="field-hint" style={{ marginTop: -10, marginBottom: 6 }}>
                En az {MIN_LENGTH} karakter olmalıdır.
              </span>

              {error && (
                <div className="callout callout-error" role="alert" style={{ marginTop: 12 }}>
                  <p style={{ margin: 0 }}>{error}</p>
                </div>
              )}

              <button type="submit" className="login-btn" disabled={submitting}>
                {submitting ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
