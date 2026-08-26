'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff, Radio } from 'lucide-react'
import { login } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { saveSession } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password) {
      setError('Kullanıcı adı ve şifre gereklidir.')
      return
    }
    setSubmitting(true)
    try {
      const { token, role, mustChangePassword } = await login({
        username: username.trim(),
        password,
      })
      saveSession(token, role, mustChangePassword, remember)
      router.push(mustChangePassword ? '/change-password' : '/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Kullanıcı adı veya şifre hatalı.')
      } else {
        setError(err instanceof ApiError ? err.message : 'Giriş yapılamadı.')
      }
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
            <Radio size={13} /> OPERASYON MERKEZİ
          </div>
          <h1>
            Yayının kalbi. <em>Her an</em> kontrol altında.
          </h1>
          <p>
            Yayın operasyonlarındaki teknik olayları tek merkezden takip edin, önceliklendirin ve
            ilgili teknisyene anında yönlendirin.
          </p>
        </div>
        <div className="signal-art" aria-hidden>
          <span className="signal-label">SİNYAL DURUMU</span>
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} style={{ height: `${20 + ((i * 37) % 70)}%` }} />
          ))}
        </div>
        <div className="copyright">© {new Date().getFullYear()} TRT — Tüm hakları saklıdır.</div>
      </div>

      <div className="login-form-wrap">
        <div className="login-card">
          <div className="mobile-login-logo">
            <div className="brand-mark">TRT</div>
          </div>
          <h2>Giriş Yap</h2>
          <p className="login-sub">Devam etmek için kurumsal hesabınızla oturum açın.</p>

          <form onSubmit={handleSubmit}>
            <label>
              Kullanıcı adı
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="kullanici.adi"
              />
            </label>
            <label>
              Şifre
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </label>

            <div className="login-options">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Beni hatırla
              </label>
              <span className="muted" style={{ fontSize: 10 }}>
                Şifremi unuttum · IT ile iletişime geçin
              </span>
            </div>

            {error && (
              <div className="callout callout-error" role="alert" style={{ marginTop: 18 }}>
                <p style={{ margin: 0 }}>{error}</p>
              </div>
            )}

            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="login-help">
            Erişim sorunlarınız için IT Operasyon ekibiyle iletişime geçin.
          </div>
        </div>
      </div>
    </div>
  )
}
