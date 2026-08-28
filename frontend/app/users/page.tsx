'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserRound,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react'

import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/hooks/use-auth'
import { ApiError } from '@/lib/api/client'
import {
  createUser,
  getUserDetails,
  getUsers,
} from '@/lib/api/users'

import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  ROLE_LABELS,
  type CreateUserResponse,
  type IncidentStatus,
  type Priority,
  type Role,
  type UserDetailsResponse,
  type UserSummaryResponse,
} from '@/lib/types'

type RoleFilter = 'ALL' | Role

const ROLE_COLORS: Record<Role, {
  background: string
  color: string
  border: string
}> = {
  ADMIN: {
    background: '#eef6ff',
    color: '#1677ff',
    border: '#d9eaff',
  },
  SUPERVISOR: {
    background: '#fff7e8',
    color: '#e99100',
    border: '#ffe8b8',
  },
  TECHNICIAN: {
    background: '#f5efff',
    color: '#8b5cf6',
    border: '#e8dcff',
  },
  OPERATOR: {
    background: '#ecfbf3',
    color: '#16a05d',
    border: '#d5f2e2',
  },
}

const STATUS_COLORS: Record<IncidentStatus, {
  background: string
  color: string
  border: string
}> = {
  OPEN: {
    background: '#fff0f1',
    color: '#e5484d',
    border: '#ffd9db',
  },
  INVESTIGATING: {
    background: '#f5efff',
    color: '#8b5cf6',
    border: '#e8dcff',
  },
  IN_PROGRESS: {
    background: '#fff7e8',
    color: '#e99100',
    border: '#ffe8b8',
  },
  RESOLVED: {
    background: '#ecfbf3',
    color: '#16a05d',
    border: '#d5f2e2',
  },
  CLOSED: {
    background: '#f4f5f7',
    color: '#697386',
    border: '#e5e7eb',
  },
}

const PRIORITY_COLORS: Record<Priority, {
  color: string
}> = {
  LOW: {
    color: '#697386',
  },
  MEDIUM: {
    color: '#1677ff',
  },
  HIGH: {
    color: '#e99100',
  },
  CRITICAL: {
    color: '#e5484d',
  },
}

function getInitials(username: string) {
  const parts = username.trim().split(/[.\s_-]+/)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return username.slice(0, 2).toUpperCase()
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  } catch {
    return date
  }
}

export default function UsersPage() {
  const { role } = useAuth()
  const isAdmin = role === 'ADMIN'

  const [users, setUsers] = useState<UserSummaryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')

  const [selectedUser, setSelectedUser] =
    useState<UserDetailsResponse | null>(null)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [userRole, setUserRole] = useState<Role>('TECHNICIAN')

  const [createError, setCreateError] = useState<string | null>(null)
  const [created, setCreated] =
    useState<CreateUserResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  async function loadUsers(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const data = await getUsers()
      setUsers(data)
    } catch (error) {
      console.error('Kullanıcılar alınamadı:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function openUser(user: UserSummaryResponse) {
    setDrawerOpen(true)
    setDetailsLoading(true)
    setSelectedUser(null)

    try {
      const details = await getUserDetails(user.id)
      setSelectedUser(details)
    } catch (error) {
      console.error('Kullanıcı detayları alınamadı:', error)
    } finally {
      setDetailsLoading(false)
    }
  }

  function closeDrawer() {
    setDrawerOpen(false)

    setTimeout(() => {
      setSelectedUser(null)
    }, 300)
  }

  async function handleCreateUser(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setCreateError(null)

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setCreateError('Ad, soyad ve e-posta alanları zorunludur.')
      return
    }

    setSubmitting(true)

    try {
      const response = await createUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role: userRole,
      })

      setCreated(response)
      setFormOpen(false)

      setFirstName('')
      setLastName('')
      setEmail('')
      setUserRole('TECHNICIAN')

      await loadUsers(true)
    } catch (error) {
      setCreateError(
        error instanceof ApiError
          ? error.message
          : 'Kullanıcı oluşturulamadı.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function copyPassword() {
    if (!created) return

    try {
      await navigator.clipboard.writeText(
        created.temporaryPassword,
      )

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      // Clipboard kullanılamıyorsa şifre ekranda görünmeye devam eder.
    }
  }

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return users.filter((user) => {
      const matchesRole =
        roleFilter === 'ALL' || user.role === roleFilter

      const matchesSearch =
        !normalizedSearch ||
        user.username.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        ROLE_LABELS[user.role]
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesRole && matchesSearch
    })
  }, [users, search, roleFilter])

  const roleCounts = useMemo(() => {
    return {
      ALL: users.length,
      ADMIN: users.filter((u) => u.role === 'ADMIN').length,
      SUPERVISOR: users.filter((u) => u.role === 'SUPERVISOR').length,
      TECHNICIAN: users.filter((u) => u.role === 'TECHNICIAN').length,
      OPERATOR: users.filter((u) => u.role === 'OPERATOR').length,
    }
  }, [users])

  return (
    <AppShell>
      <div className="users-page">

        {/* HEADER */}
        <div className="users-header">
          <div>
            <div className="users-eyebrow">
              YÖNETİM
            </div>

            <div className="users-title-row">
              <div className="users-title-icon">
                <UsersRound size={22} strokeWidth={1.8} />
              </div>

              <div>
                <h1>Kullanıcılar</h1>
                <p>
                  Kurumsal kullanıcı yönetimi ve erişim kontrolü.
                </p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              className="apple-primary-button"
              type="button"
              onClick={() => {
                setFormOpen((value) => !value)
                setCreated(null)
                setCreateError(null)
              }}
            >
              {formOpen ? (
                <X size={16} />
              ) : (
                <Plus size={16} />
              )}

              {formOpen ? 'Vazgeç' : 'Yeni Kullanıcı'}
            </button>
          )}
        </div>

        {/* CREATED USER */}
        {created && (
          <div className="success-card">
            <div className="success-icon">
              <Check size={18} />
            </div>

            <div className="success-content">
              <strong>
                Kullanıcı başarıyla oluşturuldu
              </strong>

              <p>
                {created.username} hesabı oluşturuldu ve
                geçici giriş bilgileri e-posta adresine gönderildi.
              </p>
            </div>

            <div className="temporary-password">
              <span>Geçici şifre</span>

              <strong>
                {created.temporaryPassword}
              </strong>

              <button
                type="button"
                onClick={copyPassword}
              >
                {copied ? (
                  <>
                    <Check size={13} />
                    Kopyalandı
                  </>
                ) : (
                  <>
                    <Clipboard size={13} />
                    Kopyala
                  </>
                )}
              </button>
            </div>

            <button
              className="success-close"
              type="button"
              onClick={() => setCreated(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* CREATE USER */}
        {isAdmin && formOpen && (
          <div className="create-card">
            <div className="create-card-header">
              <div>
                <div className="section-kicker">
                  YENİ HESAP
                </div>

                <h2>Yeni Kullanıcı Oluştur</h2>

                <p>
                  Kullanıcı adı ve geçici şifre sistem
                  tarafından otomatik olarak oluşturulur.
                </p>
              </div>

              <div className="create-card-icon">
                <UserRound size={19} />
              </div>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="create-grid">
                <label className="modern-field">
                  <span>Ad</span>

                  <input
                    value={firstName}
                    onChange={(event) =>
                      setFirstName(event.target.value)
                    }
                    placeholder="Mehmet"
                  />
                </label>

                <label className="modern-field">
                  <span>Soyad</span>

                  <input
                    value={lastName}
                    onChange={(event) =>
                      setLastName(event.target.value)
                    }
                    placeholder="Yılmaz"
                  />
                </label>

                <label className="modern-field">
                  <span>E-posta</span>

                  <div className="input-with-icon">
                    <Mail size={16} />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="kullanici@trt.gov.tr"
                    />
                  </div>
                </label>

                <label className="modern-field">
                  <span>Rol</span>

                  <div className="select-wrap">
                    <select
                      value={userRole}
                      onChange={(event) =>
                        setUserRole(
                          event.target.value as Role,
                        )
                      }
                    >
                      {(
                        Object.keys(
                          ROLE_LABELS,
                        ) as Role[]
                      ).map((item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {ROLE_LABELS[item]}
                        </option>
                      ))}
                    </select>

                    <ChevronDown size={15} />
                  </div>
                </label>
              </div>

              {createError && (
                <div className="form-error">
                  {createError}
                </div>
              )}

              <div className="create-footer">
                <p>
                  <Shield size={14} />
                  Geçici şifre güvenli şekilde oluşturulur ve
                  kullanıcıya e-posta ile gönderilir.
                </p>

                <button
                  className="apple-primary-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? 'Oluşturuluyor...'
                    : 'Kullanıcıyı Oluştur'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* USER LIST */}
        <div className="users-card">

          <div className="users-card-header">
            <div>
              <div className="section-kicker">
                KULLANICI DİZİNİ
              </div>

              <h2>
                Kullanıcı Listesi
                <span>{users.length}</span>
              </h2>

              <p>
                Sistemde kayıtlı kullanıcıları görüntüleyin.
              </p>
            </div>

            <button
              className="refresh-button"
              type="button"
              onClick={() => loadUsers(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? 'refresh-spinning'
                    : ''
                }
              />

              Yenile
            </button>
          </div>

          {/* SEARCH */}
          <div className="users-toolbar">
            <div className="search-box">
              <Search size={17} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="İsim, kullanıcı adı veya e-posta ara..."
              />

              <kbd>⌘ K</kbd>
            </div>

            <div className="role-select">
              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value as RoleFilter,
                  )
                }
              >
                <option value="ALL">
                  Tüm Roller
                </option>

                <option value="ADMIN">
                  Yönetici
                </option>

                <option value="SUPERVISOR">
                  Sorumlu
                </option>

                <option value="TECHNICIAN">
                  Teknisyen
                </option>

                <option value="OPERATOR">
                  Operatör
                </option>
              </select>

              <ChevronDown size={15} />
            </div>
          </div>

          {/* ROLE CHIPS */}
          <div className="role-chips">
            <button
              type="button"
              className={
                roleFilter === 'ALL'
                  ? 'role-chip active'
                  : 'role-chip'
              }
              onClick={() => setRoleFilter('ALL')}
            >
              Tümü
              <span>{roleCounts.ALL}</span>
            </button>

            {(
              [
                'ADMIN',
                'SUPERVISOR',
                'TECHNICIAN',
                'OPERATOR',
              ] as Role[]
            ).map((item) => (
              <button
                key={item}
                type="button"
                className={
                  roleFilter === item
                    ? 'role-chip active'
                    : 'role-chip'
                }
                onClick={() =>
                  setRoleFilter(item)
                }
              >
                {ROLE_LABELS[item]}
                <span>{roleCounts[item]}</span>
              </button>
            ))}
          </div>

          {/* TABLE */}
          <div className="users-table">

            <div className="table-head">
              <div>ID</div>
              <div>KULLANICI</div>
              <div>E-POSTA</div>
              <div>ROL</div>
              <div />
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loader" />
                <span>Kullanıcılar yükleniyor...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Search size={22} />
                </div>

                <strong>
                  Kullanıcı bulunamadı
                </strong>

                <p>
                  Arama veya filtre kriterlerinizi
                  değiştirmeyi deneyin.
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const roleColor =
                  ROLE_COLORS[user.role]

                return (
                  <button
                    key={user.id}
                    type="button"
                    className="user-row"
                    onClick={() => openUser(user)}
                  >
                    <div className="user-id">
                      #{user.id}
                    </div>

                    <div className="user-main">
                      <div className="user-avatar">
                        {getInitials(user.username)}
                      </div>

                      <div className="user-name">
                        <strong>
                          {user.username}
                        </strong>

                        <span>
                          Kullanıcı detaylarını görüntüle
                        </span>
                      </div>
                    </div>

                    <div className="user-email">
                      {user.email}
                    </div>

                    <div>
                      <span
                        className="role-badge"
                        style={{
                          background:
                            roleColor.background,
                          color:
                            roleColor.color,
                          borderColor:
                            roleColor.border,
                        }}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </div>

                    <div className="row-arrow">
                      <ChevronRight size={17} />
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="users-footer">
            <span>
              {filteredUsers.length} kullanıcı gösteriliyor
            </span>

            <div className="pagination">
              <button
                type="button"
                disabled
              >
                <ArrowLeft size={15} />
              </button>

              <button
                type="button"
                className="pagination-active"
              >
                1
              </button>

              <button
                type="button"
                disabled
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DRAWER BACKDROP */}
      {drawerOpen && (
        <div
          className="drawer-backdrop"
          onClick={closeDrawer}
        />
      )}

      {/* USER DETAIL DRAWER */}
      <aside
        className={
          drawerOpen
            ? 'user-drawer open'
            : 'user-drawer'
        }
      >
        <div className="drawer-header">
          <div>
            <div className="section-kicker">
              KULLANICI DETAYI
            </div>

            <h2>
              Kullanıcı Profili
            </h2>
          </div>

          <button
            type="button"
            className="drawer-close"
            onClick={closeDrawer}
          >
            <X size={18} />
          </button>
        </div>

        {detailsLoading ? (
          <div className="drawer-loading">
            <div className="loader" />
            <span>Bilgiler yükleniyor...</span>
          </div>
        ) : selectedUser ? (
          <div className="drawer-content">

            {/* PROFILE */}
            <div className="profile-block">
              <div className="large-avatar">
                {getInitials(
                  selectedUser.username,
                )}
              </div>

              <div className="profile-info">
                <h3>
                  {selectedUser.username}
                </h3>

                <div className="profile-email">
                  <Mail size={13} />
                  {selectedUser.email}
                </div>

                <span
                  className="role-badge"
                  style={{
                    background:
                      ROLE_COLORS[
                        selectedUser.role
                      ].background,
                    color:
                      ROLE_COLORS[
                        selectedUser.role
                      ].color,
                    borderColor:
                      ROLE_COLORS[
                        selectedUser.role
                      ].border,
                  }}
                >
                  {ROLE_LABELS[
                    selectedUser.role
                  ]}
                </span>
              </div>
            </div>

            {/* INFO CARDS */}
            <div className="info-grid">
              <div className="info-card">
                <div className="info-card-icon blue">
                  <Clipboard size={16} />
                </div>

                <span>Kullanıcı ID</span>

                <strong>
                  #{selectedUser.id}
                </strong>
              </div>

              <div className="info-card">
                <div className="info-card-icon purple">
                  <Shield size={16} />
                </div>

                <span>Rol</span>

                <strong>
                  {ROLE_LABELS[
                    selectedUser.role
                  ]}
                </strong>
              </div>
            </div>

            {/* CREATED INCIDENTS */}
            <IncidentSection
              title="Oluşturduğu Olaylar"
              icon={<Clipboard size={16} />}
              count={
                selectedUser.createdIncidents.length
              }
              incidents={
                selectedUser.createdIncidents
              }
              emptyText="Bu kullanıcı henüz bir olay oluşturmamış."
            />

            {/* ASSIGNED INCIDENTS */}
            <IncidentSection
              title="Atandığı Olaylar"
              icon={<Wrench size={16} />}
              count={
                selectedUser.assignedIncidents.length
              }
              incidents={
                selectedUser.assignedIncidents
              }
              emptyText="Bu kullanıcıya henüz bir olay atanmamış."
            />

          </div>
        ) : (
          <div className="drawer-error">
            Kullanıcı bilgileri alınamadı.
          </div>
        )}
      </aside>

      <style jsx>{`
        .users-page {
          position: relative;
          min-height: 100%;
          padding-bottom: 40px;
        }

        .users-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 28px;
        }

        .users-eyebrow,
        .section-kicker {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #9aa1ad;
          margin-bottom: 8px;
        }

        .users-title-row {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .users-title-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e9ebef;
          box-shadow:
            0 5px 20px rgba(20, 30, 50, 0.05);
          color: #20242b;
        }

        .users-title-row h1 {
          margin: 0;
          font-size: 29px;
          letter-spacing: -0.035em;
          color: #17191d;
        }

        .users-title-row p {
          margin: 4px 0 0;
          color: #8b919c;
          font-size: 13px;
        }

        .apple-primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 42px;
          padding: 0 18px;
          border: 0;
          border-radius: 12px;
          background: #d60000;
          color: white;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          box-shadow:
            0 7px 18px rgba(214, 0, 0, 0.16);
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        .apple-primary-button:hover {
          transform: translateY(-1px);
          background: #c40000;
          box-shadow:
            0 10px 25px rgba(214, 0, 0, 0.21);
        }

        .apple-primary-button:active {
          transform: translateY(0);
        }

        .apple-primary-button:disabled {
          opacity: 0.55;
          cursor: default;
          transform: none;
        }

        .users-card,
        .create-card,
        .success-card {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #e7e9ed;
          border-radius: 20px;
          box-shadow:
            0 12px 45px rgba(20, 30, 50, 0.045);
          backdrop-filter: blur(20px);
        }

        .success-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 17px 20px;
          margin-bottom: 18px;
          border-color: #d8f0e1;
          background: #fbfffc;
        }

        .success-icon {
          width: 35px;
          height: 35px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e8f8ee;
          color: #16a05d;
        }

        .success-content {
          min-width: 220px;
          flex: 1;
        }

        .success-content strong {
          display: block;
          font-size: 13px;
          color: #168447;
        }

        .success-content p {
          margin: 4px 0 0;
          font-size: 11px;
          color: #7e9588;
        }

        .temporary-password {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 12px;
          border-radius: 10px;
          background: #f4faf6;
        }

        .temporary-password span {
          color: #89958d;
          font-size: 10px;
        }

        .temporary-password strong {
          font-family: monospace;
          font-size: 12px;
          color: #20242b;
        }

        .temporary-password button {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 0;
          background: transparent;
          color: #168447;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .success-close {
          width: 30px;
          height: 30px;
          border: 0;
          background: transparent;
          color: #a1aaa4;
          cursor: pointer;
          border-radius: 8px;
        }

        .success-close:hover {
          background: #f0f4f1;
        }

        .create-card {
          padding: 25px;
          margin-bottom: 20px;
        }

        .create-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .create-card-header h2 {
          margin: 0;
          font-size: 18px;
          letter-spacing: -0.02em;
          color: #20242b;
        }

        .create-card-header p {
          margin: 6px 0 0;
          color: #9197a1;
          font-size: 11px;
        }

        .create-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f4f5f7;
          color: #596170;
        }

        .create-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 17px;
        }

        .modern-field {
          display: block;
        }

        .modern-field > span {
          display: block;
          margin-bottom: 7px;
          font-size: 11px;
          font-weight: 600;
          color: #515865;
        }

        .modern-field input,
        .modern-field select {
          width: 100%;
          height: 43px;
          padding: 0 13px;
          border: 1px solid #e1e4e9;
          border-radius: 11px;
          outline: none;
          background: #fafbfc;
          color: #24272d;
          font-size: 12px;
          transition:
            border 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
          box-sizing: border-box;
        }

        .modern-field input:focus,
        .modern-field select:focus {
          border-color: #b9c2d0;
          background: #fff;
          box-shadow:
            0 0 0 3px rgba(70, 90, 120, 0.07);
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #a2a8b1;
        }

        .input-with-icon input {
          padding-left: 38px;
        }

        .select-wrap {
          position: relative;
        }

        .select-wrap select {
          appearance: none;
          padding-right: 35px;
        }

        .select-wrap svg {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #8f96a0;
        }

        .form-error {
          margin-top: 16px;
          padding: 11px 13px;
          border-radius: 10px;
          background: #fff2f2;
          border: 1px solid #ffd8d8;
          color: #c73535;
          font-size: 11px;
        }

        .create-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 21px;
          padding-top: 18px;
          border-top: 1px solid #eef0f3;
        }

        .create-footer p {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 0;
          color: #8d949e;
          font-size: 10px;
        }

        .users-card {
          overflow: hidden;
        }

        .users-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 25px 25px 19px;
        }

        .users-card-header h2 {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0;
          font-size: 17px;
          letter-spacing: -0.02em;
          color: #20242b;
        }

        .users-card-header h2 span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          background: #f2f3f5;
          color: #777f8b;
          font-size: 9px;
          font-weight: 700;
        }

        .users-card-header p {
          margin: 5px 0 0;
          font-size: 11px;
          color: #9298a2;
        }

        .refresh-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 38px;
          padding: 0 13px;
          border: 1px solid #e3e6eb;
          border-radius: 10px;
          background: #fff;
          color: #555d68;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .refresh-button:hover {
          background: #f8f9fa;
        }

        .refresh-spinning {
          animation: spin 800ms linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .users-toolbar {
          display: grid;
          grid-template-columns: 1fr 190px;
          gap: 10px;
          padding: 0 25px 13px;
        }

        .search-box,
        .role-select {
          height: 42px;
          border: 1px solid #e4e7eb;
          border-radius: 11px;
          background: #fafbfc;
          display: flex;
          align-items: center;
        }

        .search-box {
          padding: 0 11px;
          gap: 9px;
          color: #9ba2ad;
        }

        .search-box input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #272b32;
          font-size: 11px;
        }

        .search-box input::placeholder {
          color: #a3a9b2;
        }

        .search-box kbd {
          padding: 3px 6px;
          border-radius: 5px;
          border: 1px solid #e1e4e8;
          background: #fff;
          color: #a0a6ae;
          font-size: 9px;
          font-family: inherit;
        }

        .role-select {
          position: relative;
          padding: 0 11px;
        }

        .role-select select {
          appearance: none;
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #454b55;
          font-size: 11px;
        }

        .role-select svg {
          position: absolute;
          right: 11px;
          pointer-events: none;
          color: #8e959f;
        }

        .role-chips {
          display: flex;
          gap: 7px;
          padding: 0 25px 18px;
        }

        .role-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 30px;
          padding: 0 11px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #fff;
          color: #737a85;
          font-size: 10px;
          cursor: pointer;
          transition: all 160ms ease;
        }

        .role-chip:hover {
          border-color: #cfd4db;
          color: #333841;
        }

        .role-chip span {
          color: #a4aab2;
          font-size: 9px;
        }

        .role-chip.active {
          background: #20242b;
          border-color: #20242b;
          color: #fff;
        }

        .role-chip.active span {
          color: #d8dbe0;
        }

        .users-table {
          border-top: 1px solid #eef0f3;
        }

        .table-head,
        .user-row {
          display: grid;
          grid-template-columns: 60px minmax(240px, 1.15fr) minmax(230px, 1fr) 150px 35px;
          align-items: center;
          column-gap: 10px;
          padding: 0 25px;
        }

        .table-head {
          height: 38px;
          background: #fafbfc;
          color: #9da3ac;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .user-row {
          width: 100%;
          min-height: 70px;
          border: 0;
          border-bottom: 1px solid #eef0f3;
          background: #fff;
          text-align: left;
          cursor: pointer;
          transition:
            background 170ms ease,
            box-shadow 170ms ease,
            transform 170ms ease;
        }

        .user-row:hover {
          position: relative;
          z-index: 1;
          background: #fcfcfd;
          box-shadow:
            0 5px 18px rgba(30, 40, 55, 0.055);
        }

        .user-id {
          color: #9ca3ad;
          font-size: 10px;
          font-variant-numeric: tabular-nums;
        }

        .user-main {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .user-avatar,
        .large-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          border-radius: 50%;
          font-weight: 700;
        }

        .user-avatar {
          width: 34px;
          height: 34px;
          background: #f0f4fa;
          color: #58708e;
          font-size: 10px;
          transition: transform 180ms ease;
        }

        .user-row:hover .user-avatar {
          transform: scale(1.06);
        }

        .user-name {
          min-width: 0;
        }

        .user-name strong {
          display: block;
          overflow: hidden;
          color: #20242b;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-name span {
          display: block;
          margin-top: 3px;
          color: #a0a6ae;
          font-size: 9px;
        }

        .user-email {
          overflow: hidden;
          color: #818892;
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 24px;
          padding: 0 9px;
          border: 1px solid;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 700;
          white-space: nowrap;
        }

        .row-arrow {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          color: #aeb4bd;
          transition:
            transform 170ms ease,
            color 170ms ease;
        }

        .user-row:hover .row-arrow {
          transform: translateX(3px);
          color: #555d68;
        }

        .loading-state,
        .empty-state {
          min-height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .loader {
          width: 22px;
          height: 22px;
          border: 2px solid #e4e7eb;
          border-top-color: #252a31;
          border-radius: 50%;
          animation: spin 750ms linear infinite;
        }

        .loading-state span {
          color: #9aa1ab;
          font-size: 10px;
        }

        .empty-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f5f6f8;
          color: #969da7;
        }

        .empty-state strong {
          color: #464c56;
          font-size: 12px;
        }

        .empty-state p {
          margin: 0;
          color: #9aa1aa;
          font-size: 10px;
        }

        .users-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 25px;
          color: #9299a3;
          font-size: 9px;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .pagination button {
          width: 29px;
          height: 29px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e3e6ea;
          border-radius: 8px;
          background: #fff;
          color: #777f89;
          cursor: pointer;
        }

        .pagination button:disabled {
          opacity: 0.4;
          cursor: default;
        }

        .pagination .pagination-active {
          background: #20242b;
          border-color: #20242b;
          color: #fff;
        }

        /* DRAWER */

        .drawer-backdrop {
          position: fixed;
          inset: 0;
          z-index: 90;
          background: rgba(20, 25, 32, 0.17);
          backdrop-filter: blur(7px);
          animation: backdropIn 250ms ease;
        }

        @keyframes backdropIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .user-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 100;
          width: min(510px, 94vw);
          background: rgba(255, 255, 255, 0.97);
          border-left: 1px solid #e6e8ec;
          box-shadow:
            -25px 0 70px rgba(20, 30, 45, 0.13);
          transform: translateX(105%);
          transition:
            transform 350ms cubic-bezier(
              0.22,
              1,
              0.36,
              1
            );
          display: flex;
          flex-direction: column;
        }

        .user-drawer.open {
          transform: translateX(0);
        }

        .drawer-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 27px 28px 21px;
          border-bottom: 1px solid #eef0f3;
        }

        .drawer-header h2 {
          margin: 0;
          color: #20242b;
          font-size: 18px;
          letter-spacing: -0.025em;
        }

        .drawer-close {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e4e7eb;
          border-radius: 10px;
          background: #fff;
          color: #777f8a;
          cursor: pointer;
          transition: all 160ms ease;
        }

        .drawer-close:hover {
          background: #f5f6f8;
          color: #20242b;
        }

        .drawer-content {
          flex: 1;
          overflow-y: auto;
          padding: 27px 28px 40px;
        }

        .profile-block {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 24px;
        }

        .large-avatar {
          width: 62px;
          height: 62px;
          background:
            linear-gradient(
              145deg,
              #edf5ff,
              #f5efff
            );
          color: #467cc0;
          font-size: 18px;
          box-shadow:
            inset 0 0 0 1px rgba(70, 124, 192, 0.06);
        }

        .profile-info h3 {
          margin: 0 0 5px;
          color: #20242b;
          font-size: 18px;
          letter-spacing: -0.02em;
        }

        .profile-email {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 9px;
          color: #9299a3;
          font-size: 10px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
          margin-bottom: 31px;
        }

        .info-card {
          position: relative;
          padding: 15px;
          border: 1px solid #eceef1;
          border-radius: 14px;
          background: #fafbfc;
        }

        .info-card-icon {
          width: 29px;
          height: 29px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          margin-bottom: 12px;
        }

        .info-card-icon.blue {
          background: #edf5ff;
          color: #4786dc;
        }

        .info-card-icon.purple {
          background: #f5efff;
          color: #8b5cf6;
        }

        .info-card span {
          display: block;
          color: #969da6;
          font-size: 9px;
          margin-bottom: 5px;
        }

        .info-card strong {
          color: #2b3038;
          font-size: 12px;
        }

        .incident-section {
          margin-top: 27px;
        }

        .incident-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .incident-section-title {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #242930;
          font-size: 12px;
          font-weight: 700;
        }

        .incident-section-title-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #f3f5f8;
          color: #606a78;
        }

        .incident-count {
          color: #a0a6af;
          font-size: 9px;
        }

        .incident-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .incident-card {
          padding: 14px;
          border: 1px solid #e8eaee;
          border-radius: 14px;
          background: #fff;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease;
        }

        .incident-card:hover {
          transform: translateY(-1px);
          box-shadow:
            0 7px 22px rgba(30, 40, 55, 0.06);
        }

        .incident-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 9px;
        }

        .incident-id {
          color: #a1a7af;
          font-size: 9px;
          font-variant-numeric: tabular-nums;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border: 1px solid;
          border-radius: 7px;
          font-size: 8px;
          font-weight: 700;
          white-space: nowrap;
        }

        .incident-card h4 {
          margin: 0;
          color: #282d34;
          font-size: 11px;
          line-height: 1.45;
        }

        .incident-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 9px;
          color: #969da6;
          font-size: 9px;
        }

        .incident-meta strong {
          font-weight: 600;
        }

        .empty-incidents {
          min-height: 95px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 18px;
          border: 1px dashed #dfe3e8;
          border-radius: 13px;
          background: #fbfcfd;
          color: #a2a9b2;
          font-size: 10px;
        }

        .drawer-loading {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 11px;
          color: #989fa9;
          font-size: 10px;
        }

        .drawer-error {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c73535;
          font-size: 11px;
        }

        @media (max-width: 900px) {
          .users-header {
            align-items: flex-start;
          }

          .table-head,
          .user-row {
            grid-template-columns:
              45px
              minmax(190px, 1fr)
              minmax(170px, 1fr)
              110px
              25px;
          }
        }

        @media (max-width: 700px) {
          .users-header {
            flex-direction: column;
          }

          .users-toolbar {
            grid-template-columns: 1fr;
          }

          .create-grid {
            grid-template-columns: 1fr;
          }

          .create-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .table-head {
            display: none;
          }

          .user-row {
            grid-template-columns: 38px 1fr auto 25px;
            padding: 13px 17px;
          }

          .user-row .user-email {
            display: none;
          }

          .role-chips {
            overflow-x: auto;
          }

          .users-card-header {
            padding: 20px 17px 16px;
          }

          .users-toolbar,
          .role-chips {
            padding-left: 17px;
            padding-right: 17px;
          }

          .users-footer {
            padding-left: 17px;
            padding-right: 17px;
          }

          .drawer-content {
            padding-left: 20px;
            padding-right: 20px;
          }

          .drawer-header {
            padding-left: 20px;
            padding-right: 20px;
          }
        }
      `}</style>
    </AppShell>
  )
}

/* -------------------------------------------------------------------------- */
/* INCIDENT SECTION                                                            */
/* -------------------------------------------------------------------------- */

function IncidentSection({
  title,
  icon,
  count,
  incidents,
  emptyText,
}: {
  title: string
  icon: React.ReactNode
  count: number
  incidents: UserDetailsResponse['createdIncidents']
  emptyText: string
}) {
  return (
    <section className="incident-section">
      <div className="incident-section-header">
        <div className="incident-section-title">
          <div className="incident-section-title-icon">
            {icon}
          </div>

          {title}
        </div>

        <span className="incident-count">
          {count} olay
        </span>
      </div>

      {incidents.length === 0 ? (
        <div className="empty-incidents">
          {emptyText}
        </div>
      ) : (
        <div className="incident-list">
          {incidents.map((incident) => {
            const statusColor =
              STATUS_COLORS[incident.status]

            const priorityColor =
              PRIORITY_COLORS[incident.priority]

            return (
              <div
                className="incident-card"
                key={incident.id}
              >
                <div className="incident-top">
                  <span className="incident-id">
                    #{incident.id}
                  </span>

                  <span
                    className="status-badge"
                    style={{
                      background:
                        statusColor.background,
                      color:
                        statusColor.color,
                      borderColor:
                        statusColor.border,
                    }}
                  >
                    {
                      [
                        incident.status
                      ]
                    }
                  </span>
                </div>

                <h4>
                  {incident.title}
                </h4>

                <div className="incident-meta">
                  <span>
                    Öncelik:{' '}
                    <strong
                      style={{
                        color:
                          priorityColor.color,
                      }}
                    >
                      {
                        PRIORITY_LABELS[
                          incident.priority
                        ]
                      }
                    </strong>
                  </span>

                  {incident.assignedToUsername && (
                    <span>
                      Atanan:{' '}
                      <strong>
                        {
                          incident.assignedToUsername
                        }
                      </strong>
                    </span>
                  )}

                  <span>
                    {formatDate(
                      incident.createdAt,
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}