'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  Ticket,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/hooks/use-theme'
import { getAllIncidents } from '@/lib/api/incidents'
import type { IncidentResponse } from '@/lib/types'

const nav = [
  { href: '/dashboard', label: 'Ana Sayfa', icon: LayoutDashboard },
  { href: '/incidents', label: 'Olaylar', icon: Ticket },
  { href: '/assigned', label: 'Bana Atananlar', icon: UserRound },
  { href: '/users', label: 'Kullanıcılar', icon: Users },
]

function Logo() {
  return (
    <div className="brand-mark" aria-label="TRT Broadcast">
      TRT
    </div>
  )
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { username, logout } = useAuth()
  const { dark, setDark } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [allIncidents, setAllIncidents] = useState<IncidentResponse[] | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  async function openSearch() {
    setSearchOpen(true)
    if (!allIncidents) {
      try {
        const data = await getAllIncidents()
        setAllIncidents(data)
      } catch {
        setAllIncidents([])
      }
    }
  }

  const searchResults = useMemo(() => {
    if (!allIncidents || query.trim().length === 0) return []
    const q = query.trim().toLowerCase()
    return allIncidents
      .filter((i) => i.title.toLowerCase().includes(q) || String(i.id).includes(q))
      .slice(0, 8)
  }, [allIncidents, query])

  const breadcrumbLabel = () => {
    if (pathname === '/dashboard') return 'Genel Bakış'
    const match = nav.find((n) => active(n.href))
    if (match) return match.label
    if (pathname.startsWith('/settings')) return 'Ayarlar'
    if (pathname.startsWith('/profile')) return 'Profil'
    return pathname.split('/')[1] || 'Genel Bakış'
  }

  return (
    <div className={dark ? 'app-shell dark-mode' : 'app-shell'}>
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-top">
          <Logo />
          <div>
            <strong>TRT BROADCAST</strong>
            <small>INCIDENT MANAGEMENT</small>
          </div>
          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Menüyü kapat"
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace">
          <span className="pulse-dot" /> Ankara Operasyon Merkezi <ChevronDown size={14} />
        </div>
        <nav className="nav-list" aria-label="Ana menü">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              onClick={() => setMobileOpen(false)}
              className={active(href) ? 'active' : ''}
              href={href}
              key={href}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-label">SİSTEM</div>
        <nav className="nav-list">
          <Link className={active('/settings') ? 'active' : ''} href="/settings">
            <Settings size={18} />
            <span>Ayarlar</span>
          </Link>
          <Link className={active('/profile') ? 'active' : ''} href="/profile">
            <UserRound size={18} />
            <span>Profil</span>
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <Link href="/profile" className="user-mini" style={{ color: 'inherit' }}>
            <div className="avatar">{username ? initials(username) : '—'}</div>
            <div>
              <strong>{username ?? 'Bilinmiyor'}</strong>
              <small>Oturum açık</small>
            </div>
          </Link>
          <button className="logout" onClick={logout} type="button">
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="header">
          <button
            className="mobile-menu icon-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Menüyü aç"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            <span>Operasyon</span>
            <span>/</span>
            <strong>{breadcrumbLabel()}</strong>
          </div>
          <div className="header-actions">
            <div className="search-box" ref={searchRef} style={{ position: 'relative' }}>
              <Search size={13} />
              <input
                placeholder="Olay ara (başlık veya ID)..."
                aria-label="Global arama"
                value={query}
                onFocus={openSearch}
                onChange={(e) => setQuery(e.target.value)}
              />
              {searchOpen && query.trim().length > 0 && (
                <div className="search-results">
                  {allIncidents === null ? (
                    <div className="muted-row">Aranıyor...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="muted-row">Sonuç bulunamadı.</div>
                  ) : (
                    searchResults.map((incident) => (
                      <a
                        key={incident.id}
                        href={`/incidents/${incident.id}`}
                        onClick={(e) => {
                          e.preventDefault()
                          setSearchOpen(false)
                          setQuery('')
                          router.push(`/incidents/${incident.id}`)
                        }}
                      >
                        <strong>#{incident.id}</strong> {incident.title}
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              className="icon-btn"
              onClick={() => setDark(!dark)}
              aria-label="Temayı değiştir"
              type="button"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-btn notification" aria-label="Bildirimler" type="button">
              <Bell size={18} />
            </button>
            <Link href="/profile" className="header-avatar">
              {username ? initials(username) : '—'}
            </Link>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
