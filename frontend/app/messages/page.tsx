'use client'

import './messages.css'

import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { getCurrentUsername } from '@/lib/auth'

import {
  createConversation,
  getConversations,
  getMessages,
  getMessagingUsers,
  sendMessage,
} from '@/lib/api/conversations'

import type {
  ConversationResponse,
  MessageResponse,
  SendMessageRequest,
  UserSummaryResponse,
} from '@/lib/types'

export default function MessagesPage() {
  const [conversations, setConversations] = useState<
    ConversationResponse[]
  >([])

  const [users, setUsers] = useState<
    UserSummaryResponse[]
  >([])

  const [selectedConversation, setSelectedConversation] =
    useState<ConversationResponse | null>(null)

  const [messages, setMessages] = useState<
    MessageResponse[]
  >([])

  const [messageText, setMessageText] = useState('')

  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)

  const [messagesLoading, setMessagesLoading] =
    useState(false)

  const [sending, setSending] = useState(false)

  // Mobilde konuşma listesi açık mı?
  const [mobileListOpen, setMobileListOpen] =
    useState(true)

  const currentUsername = getCurrentUsername()

  // =========================================================
  // VERİLERİ YÜKLE
  // =========================================================

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      const [
        conversationData,
        userData,
      ] = await Promise.all([
        getConversations(),
        getMessagingUsers(),
      ])

      setConversations(conversationData)
      setUsers(userData)

      // Desktop'ta ilk konuşmayı otomatik aç.
      // Mobilde ise liste açık kalsın.
      if (
        conversationData.length > 0 &&
        window.innerWidth > 700
      ) {
        await selectConversation(
          conversationData[0]
        )
      }
    } catch (error) {
      console.error(
        'Mesajlaşma verileri alınamadı:',
        error
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // KARŞI TARAFI BUL
  // =========================================================

  function getOtherParticipant(
    conversation: ConversationResponse
  ) {
    return (
      conversation.participants.find(
        (participant) =>
          participant.username !== currentUsername
      ) ??
      conversation.participants[0]
    )
  }

  // =========================================================
  // KONUŞMA SEÇ
  // =========================================================

  async function selectConversation(
    conversation: ConversationResponse
  ) {
    setSelectedConversation(conversation)

    // Mobilde konuşmaya girildiğinde
    // konuşma listesi kapanır.
    setMobileListOpen(false)

    try {
      setMessagesLoading(true)

      const data = await getMessages(
        conversation.id
      )

      setMessages(data)
    } catch (error) {
      console.error(
        'Mesajlar alınamadı:',
        error
      )

      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  // =========================================================
  // YENİ KONUŞMA BAŞLAT
  // =========================================================

  async function startConversation(
    user: UserSummaryResponse
  ) {
    try {
      const conversation =
        await createConversation(user.id)

      setConversations((current) => {
        const exists = current.some(
          (item) =>
            item.id === conversation.id
        )

        if (exists) {
          return current
        }

        return [
          conversation,
          ...current,
        ]
      })

      setSearch('')

      await selectConversation(
        conversation
      )
    } catch (error) {
      console.error(
        'Konuşma oluşturulamadı:',
        error
      )
    }
  }

  // =========================================================
  // MESAJ GÖNDER
  // =========================================================

  async function handleSendMessage() {
    if (
      !selectedConversation ||
      !messageText.trim() ||
      sending
    ) {
      return
    }

    const request: SendMessageRequest = {
      conversationId:
        selectedConversation.id,
      content: messageText.trim(),
    }

    try {
      setSending(true)

      const newMessage =
        await sendMessage(request)

      setMessages((current) => [
        ...current,
        newMessage,
      ])

      // Sol taraftaki son mesajı güncelle
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id ===
          selectedConversation.id
            ? {
                ...conversation,
                lastMessage:
                  newMessage.content,
                lastMessageAt:
                  newMessage.createdAt,
              }
            : conversation
        )
      )

      setMessageText('')
    } catch (error) {
      console.error(
        'Mesaj gönderilemedi:',
        error
      )
    } finally {
      setSending(false)
    }
  }

  // =========================================================
  // MEVCUT KONUŞMALARI ARA
  // =========================================================

  const filteredConversations =
    useMemo(() => {
      const value =
        search.trim().toLowerCase()

      if (!value) {
        return conversations
      }

      return conversations.filter(
        (conversation) =>
          conversation.participants.some(
            (participant) =>
              participant.username
                .toLowerCase()
                .includes(value) ||
              participant.email
                .toLowerCase()
                .includes(value)
          )
      )
    }, [
      conversations,
      search,
    ])

  // =========================================================
  // KULLANICILARI ARA
  // =========================================================

  const filteredUsers =
    useMemo(() => {
      const value =
        search.trim().toLowerCase()

      if (!value) {
        return []
      }

      return users.filter(
        (user) =>
          user.username !==
            currentUsername &&
          (
            user.username
              .toLowerCase()
              .includes(value) ||
            user.email
              .toLowerCase()
              .includes(value)
          )
      )
    }, [
      users,
      search,
      currentUsername,
    ])

  // =========================================================
  // ZATEN KONUŞULAN KİŞİLERİ ÇIKAR
  // =========================================================

  const newUsers =
    useMemo(() => {
      const conversationUserIds =
        new Set(
          conversations.flatMap(
            (conversation) =>
              conversation.participants
                .filter(
                  (participant) =>
                    participant.username !==
                    currentUsername
                )
                .map(
                  (participant) =>
                    participant.id
                )
          )
        )

      return filteredUsers.filter(
        (user) =>
          !conversationUserIds.has(user.id)
      )
    }, [
      filteredUsers,
      conversations,
      currentUsername,
    ])

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <AppShell>

      <div className="messages-page">

        {/* =================================================
            SOL PANEL / KONUŞMA LİSTESİ
            ================================================= */}

        <aside
          className={`messages-sidebar ${
            mobileListOpen
              ? 'mobile-open'
              : ''
          }`}
        >

          {/* BAŞLIK */}

          <div className="messages-sidebar-header">

            <p className="eyebrow">
              İLETİŞİM
            </p>

            <h1>
              Mesajlar
            </h1>

          </div>

          {/* =================================================
              KİŞİ ARAMA
              ================================================= */}

          <div className="messages-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Kişi ara..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          {/* =================================================
              ARAMA SONUÇLARI
              ================================================= */}

          {search.trim() &&
            newUsers.length > 0 && (

              <div className="message-search-results">

                <p className="eyebrow">
                  KULLANICILAR
                </p>

                {newUsers.map(
                  (user) => (

                    <button
                      key={user.id}
                      type="button"
                      className="message-search-user"
                      onClick={() =>
                        startConversation(
                          user
                        )
                      }
                    >

                      <div className="conversation-avatar">

                        {user.username
                          .slice(0, 2)
                          .toUpperCase()}

                      </div>

                      <div className="message-search-user-info">

                        <strong>
                          {user.username}
                        </strong>

                        <span>
                          {user.email}
                        </span>

                      </div>

                    </button>

                  )
                )}

              </div>

            )}

          {/* =================================================
              KONUŞMA LİSTESİ
              ================================================= */}

          <div className="conversation-list">

            {loading && (

              <div className="messages-empty">
                Konuşmalar yükleniyor...
              </div>

            )}

            {!loading &&
              filteredConversations.map(
                (conversation) => {

                  const participant =
                    getOtherParticipant(
                      conversation
                    )

                  const active =
                    selectedConversation?.id ===
                    conversation.id

                  return (

                    <button
                      key={conversation.id}
                      type="button"
                      className={`conversation-item ${
                        active
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        selectConversation(
                          conversation
                        )
                      }
                    >

                      {/* Avatar */}

                      <div className="conversation-avatar">

                        {participant?.username
                          ?.slice(0, 2)
                          .toUpperCase()}

                      </div>

                      {/* Kullanıcı */}

                      <div className="conversation-info">

                        <strong>
                          {
                            participant?.username
                          }
                        </strong>

                        <span>
                          {
                            conversation.lastMessage ||
                            'Henüz mesaj yok'
                          }
                        </span>

                      </div>

                      {/* Saat */}

                      {conversation.lastMessageAt && (

                        <time>
                          {new Date(
                            conversation.lastMessageAt
                          ).toLocaleTimeString(
                            'tr-TR',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </time>

                      )}

                    </button>

                  )
                }
              )}

            {/* Arama sonucu yok */}

            {!loading &&
              search.trim() &&
              filteredConversations.length ===
                0 &&
              newUsers.length === 0 && (

                <div className="messages-empty">
                  Kullanıcı bulunamadı.
                </div>

              )}

            {/* Hiç konuşma yok */}

            {!loading &&
              !search.trim() &&
              conversations.length ===
                0 && (

                <div className="messages-empty">
                  Henüz konuşmanız yok.
                </div>

              )}

          </div>

        </aside>

        {/* =================================================
            SAĞ CHAT PANELİ
            ================================================= */}

        <section className="chat-panel">

          {!selectedConversation ? (

            /* =================================================
               KONUŞMA SEÇİLMEDİ
               ================================================= */

            <div className="chat-empty">

              <div className="chat-empty-icon">
                💬
              </div>

              <h2>
                Bir konuşma seçin
              </h2>

              <p>
                Mesajlaşmaya başlamak için
                soldan bir konuşma seçin.
              </p>

            </div>

          ) : (

            <>

              {/* =================================================
                  CHAT HEADER
                  ================================================= */}

              <header className="chat-header">

                {/* Mobil geri butonu */}

                <button
                  type="button"
                  className="mobile-back-button"
                  onClick={() =>
                    setMobileListOpen(true)
                  }
                  aria-label="Konuşmalara dön"
                >
                  ←
                </button>

                {/* Avatar */}

                <div className="chat-user-avatar">

                  {getOtherParticipant(
                    selectedConversation
                  )
                    ?.username
                    ?.slice(0, 2)
                    .toUpperCase()}

                </div>

                {/* Kullanıcı */}

                <div>

                  <h2>
                    {
                      getOtherParticipant(
                        selectedConversation
                      )?.username
                    }
                  </h2>

                  <span className="online-status">

                    <i />

                    Çevrimiçi

                  </span>

                </div>

              </header>

              {/* =================================================
                  MESAJLAR
                  ================================================= */}

              <div className="chat-messages">

                {messagesLoading && (

                  <div className="messages-empty">
                    Mesajlar yükleniyor...
                  </div>

                )}

                {!messagesLoading &&
                  messages.length === 0 && (

                    <div className="chat-no-messages">

                      <span>
                        💬
                      </span>

                      <p>
                        Henüz mesaj yok.
                      </p>

                      <small>
                        İlk mesajı göndererek
                        konuşmayı başlat.
                      </small>

                    </div>

                  )}

                {!messagesLoading &&
                  messages.map(
                    (message) => {

                      /*
                       * Kendi mesajımız sağda,
                       * karşı tarafın mesajı solda.
                       */

                      const mine =
                        message.senderUsername ===
                        currentUsername

                      return (

                        <div
                          key={message.id}
                          className={`message-row ${
                            mine
                              ? 'mine'
                              : 'theirs'
                          }`}
                        >

                          <div className="message-bubble">

                            <p>
                              {
                                message.content
                              }
                            </p>

                            <time>
                              {new Date(
                                message.createdAt
                              ).toLocaleTimeString(
                                'tr-TR',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </time>

                          </div>

                        </div>

                      )
                    }
                  )}

              </div>

              {/* =================================================
                  MESAJ YAZMA
                  ================================================= */}

              <div className="message-composer">

                <input
                  type="text"
                  placeholder="Mesajınızı yazın..."
                  value={messageText}
                  onChange={(event) =>
                    setMessageText(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {

                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey
                    ) {

                      event.preventDefault()

                      handleSendMessage()

                    }

                  }}
                />

                <button
                  type="button"
                  onClick={
                    handleSendMessage
                  }
                  disabled={
                    sending ||
                    !messageText.trim()
                  }
                  aria-label="Mesaj gönder"
                >
                  ➤
                </button>

              </div>

            </>

          )}

        </section>

      </div>

    </AppShell>
  )
}