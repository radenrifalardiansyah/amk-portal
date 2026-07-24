'use client'

import { useEffect, useRef, useState } from 'react'
import { usersService, isSessionActive, chatService, getDmConversationId, TEAM_CHAT_ID } from '@/lib/services'
import type { AdminUser, SessionUser, ChatMessage, ChatConversationMeta } from '@/lib/services'
import { theme } from '@/lib/admin-theme'

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  return `${hours} jam lalu`
}

function hasUnread(meta: ChatConversationMeta | null | undefined, myEmail: string): boolean {
  if (!meta?.lastMessageAt) return false
  const readAt = meta.lastReadAt?.[myEmail]
  if (!readAt) return true
  return new Date(readAt).getTime() < new Date(meta.lastMessageAt).getTime()
}

// A message counts as "read" once every recipient's last-read mark is at or past its timestamp.
function isReadByAll(message: ChatMessage, recipients: string[], lastReadAt: Record<string, string> | undefined): boolean {
  if (recipients.length === 0) return false
  return recipients.every((email) => {
    const readAt = lastReadAt?.[email]
    return !!readAt && new Date(readAt).getTime() >= new Date(message.createdAt).getTime()
  })
}

interface ActiveChat {
  id: string
  type: 'team' | 'dm'
  title: string
  otherEmail?: string
}

export default function ActiveAccountsWidget({ session, canKick, collapsed = false, onBadgeChange }: {
  session: SessionUser; canKick: boolean; collapsed?: boolean
  onBadgeChange?: (info: { active: number; unread: number }) => void
}) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [open, setOpen] = useState(false)
  const [kickTarget, setKickTarget] = useState<string | null>(null)
  const [kicking, setKicking] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const [view, setView] = useState<'list' | 'chat'>('list')
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null)
  const [teamMeta, setTeamMeta] = useState<ChatConversationMeta | null>(null)
  const [dmMetas, setDmMetas] = useState<ChatConversationMeta[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => usersService.watchUsers(setUsers), [])
  useEffect(() => chatService.watchTeamMeta(setTeamMeta), [])
  useEffect(() => chatService.watchMyDmMetas(session.email, setDmMetas), [session.email])

  useEffect(() => {
    if (!activeChat) { setMessages([]); return }
    setSendError(false)
    return chatService.watchMessages(activeChat.id, setMessages)
  }, [activeChat?.id])

  useEffect(() => {
    if (!activeChat || !open) return
    chatService.markRead(activeChat.id, session.email)
  }, [activeChat?.id, open, messages.length, session.email])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const activeUsers = users.filter((u) => isSessionActive(u.activeSession))
  const otherUsers = users.filter((u) => u.email !== session.email)
  const sortedOtherUsers = [...otherUsers].sort((a, b) => {
    const aActive = isSessionActive(a.activeSession)
    const bActive = isSessionActive(b.activeSession)
    if (aActive !== bActive) return aActive ? -1 : 1
    if (aActive && bActive) return new Date(b.activeSession!.lastActiveAt).getTime() - new Date(a.activeSession!.lastActiveAt).getTime()
    return (a.name || a.email).localeCompare(b.name || b.email)
  })

  const selfUser = users.find((u) => u.email === session.email)
  const selfActive = isSessionActive(selfUser?.activeSession)

  const dmMetaByOtherEmail = new Map<string, ChatConversationMeta>()
  dmMetas.forEach((m) => {
    const other = m.participants?.find((p) => p !== session.email)
    if (other) dmMetaByOtherEmail.set(other, m)
  })

  const activeChatMeta = activeChat?.type === 'team' ? teamMeta : dmMetaByOtherEmail.get(activeChat?.otherEmail || '')
  const activeChatRecipients = activeChat?.type === 'team'
    ? otherUsers.map((u) => u.email)
    : (activeChat?.otherEmail ? [activeChat.otherEmail] : [])

  const teamUnread = hasUnread(teamMeta, session.email)
  const dmUnreadCount = sortedOtherUsers.filter((u) => hasUnread(dmMetaByOtherEmail.get(u.email), session.email)).length
  const totalUnreadCount = (teamUnread ? 1 : 0) + dmUnreadCount

  useEffect(() => {
    onBadgeChange?.({ active: activeUsers.length, unread: totalUnreadCount })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUsers.length, totalUnreadCount])

  useEffect(() => {
    if (collapsed) setOpen(false)
  }, [collapsed])

  const openChat = (type: 'team' | 'dm', id: string, title: string, otherEmail?: string) => {
    setActiveChat({ id, type, title, otherEmail })
    setView('chat')
  }

  const backToList = () => {
    setView('list')
    setActiveChat(null)
  }

  const handleSend = async () => {
    if (!activeChat || !messageInput.trim()) return
    const text = messageInput
    setMessageInput('')
    setSendError(false)
    setSending(true)
    try {
      await chatService.sendMessage({
        conversationId: activeChat.id,
        type: activeChat.type,
        participants: activeChat.type === 'dm' ? [session.email, activeChat.otherEmail!] : undefined,
        senderEmail: session.email,
        senderName: session.name || session.email,
        text,
      })
    } catch {
      setMessageInput(text)
      setSendError(true)
    } finally {
      setSending(false)
    }
  }

  const handleKick = async (email: string) => {
    setKicking(email)
    try {
      await usersService.kick(email)
    } finally {
      setKicking(null)
      setKickTarget(null)
    }
  }

  if (collapsed) return null

  return (
    <div ref={rootRef} className="fixed z-40 bottom-[88px] lg:bottom-6" style={{ right: 16 }}>
      <div style={{ position: 'relative' }}>
        {open && (
          <div
            className="admin-modal-card"
            style={{
              position: 'absolute', bottom: 'calc(100% + 12px)', right: 0, width: 340, height: 460,
              display: 'flex', flexDirection: 'column',
              background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16,
              boxShadow: theme.shadowElevated, overflow: 'hidden',
            }}
          >
            {view === 'list' ? (
              <>
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${theme.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.accentSoft,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17, color: theme.accent }}>group</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline }}>Akun & Chat</p>
                    <p style={{ fontSize: 11, color: theme.textMuted }}>{activeUsers.length} sedang online</p>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                  <button
                    onClick={() => openChat('team', TEAM_CHAT_ID, 'Chat Tim')}
                    style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.accentSoft,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: theme.accent }}>groups</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: theme.text }}>Chat Tim</p>
                      <p style={{ fontSize: 10.5, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {teamMeta?.lastMessageText || 'Ruang chat bersama semua akun'}
                      </p>
                    </div>
                    {teamUnread && <span style={{ width: 9, height: 9, borderRadius: '50%', background: theme.danger, flexShrink: 0 }} />}
                  </button>

                  <div style={{ margin: '8px 8px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.textMuted }}>
                    Akun Anda
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', borderRadius: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0, position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff',
                      background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
                    }}>
                      {(session.name || session.email)[0].toUpperCase()}
                      <span style={{
                        position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%',
                        background: selfActive ? '#22C55E' : theme.textMuted, border: `2px solid ${theme.surface}`,
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {session.name || session.email} <span style={{ fontWeight: 500, color: theme.textMuted }}>(Anda)</span>
                      </p>
                      <p style={{ fontSize: 10.5, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selfActive ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>

                  <div style={{ margin: '8px 8px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.textMuted }}>
                    Semua Akun
                  </div>

                  {sortedOtherUsers.length === 0 && (
                    <p style={{ fontSize: 12, color: theme.textMuted, padding: '12px 8px', textAlign: 'center' }}>Belum ada akun lain.</p>
                  )}
                  {sortedOtherUsers.map((u) => {
                    const active = isSessionActive(u.activeSession)
                    const unread = hasUnread(dmMetaByOtherEmail.get(u.email), session.email)
                    const confirming = kickTarget === u.email
                    return (
                      <div key={u.email} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 8px', borderRadius: 10 }}>
                        <button
                          onClick={() => openChat('dm', getDmConversationId(session.email, u.email), u.name || u.email, u.email)}
                          style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%', flexShrink: 0, position: 'relative',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: '#fff',
                            background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
                          }}>
                            {(u.name || u.email)[0].toUpperCase()}
                            <span style={{
                              position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%',
                              background: active ? '#22C55E' : theme.textMuted, border: `2px solid ${theme.surface}`,
                            }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12.5, fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.name || u.email}
                            </p>
                            <p style={{ fontSize: 10.5, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {active
                                ? `${u.activeSession!.device === 'mobile' ? 'Mobile' : 'Desktop'} · Aktif ${relativeTime(u.activeSession!.lastActiveAt)}`
                                : 'Offline'}
                            </p>
                          </div>
                          {unread && <span style={{ width: 9, height: 9, borderRadius: '50%', background: theme.danger, flexShrink: 0 }} />}
                        </button>
                        {canKick && active && (
                          confirming ? (
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <button
                                onClick={() => handleKick(u.email)}
                                disabled={kicking === u.email}
                                title="Konfirmasi keluarkan"
                                style={{ color: '#fff', background: theme.danger, border: 'none', borderRadius: 8, padding: '5px 8px', fontSize: 10.5, fontWeight: 600, cursor: kicking === u.email ? 'not-allowed' : 'pointer' }}
                              >
                                {kicking === u.email ? '...' : 'Yakin?'}
                              </button>
                              <button
                                onClick={() => setKickTarget(null)}
                                title="Batal"
                                style={{ color: theme.textMuted, background: 'none', border: 'none', padding: '5px', cursor: 'pointer', display: 'flex' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setKickTarget(u.email)}
                              title="Keluarkan akun ini"
                              style={{ color: theme.danger, background: theme.dangerSoft, border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', flexShrink: 0 }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>logout</span>
                            </button>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: '12px 14px', borderBottom: `1px solid ${theme.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={backToList} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: theme.textMuted, padding: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
                  </button>
                  <div style={{
                    width: 30, height: 30, borderRadius: activeChat?.type === 'team' ? 10 : '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: theme.accentSoft, color: theme.accent, fontSize: 12, fontWeight: 700,
                  }}>
                    {activeChat?.type === 'team'
                      ? <span className="material-symbols-outlined" style={{ fontSize: 16 }}>groups</span>
                      : (activeChat?.title || '?')[0].toUpperCase()}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeChat?.title}
                  </p>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {messages.length === 0 && (
                    <p style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', marginTop: 20 }}>Belum ada pesan. Mulai obrolan!</p>
                  )}
                  {messages.map((m) => {
                    const mine = m.senderEmail === session.email
                    const read = mine && isReadByAll(m, activeChatRecipients, activeChatMeta?.lastReadAt)
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: mine ? 'flex-end' : 'flex-start' }}>
                          {activeChat?.type === 'team' && !mine && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: theme.textMuted, paddingLeft: 10 }}>{m.senderName}</span>
                          )}
                          <div style={{
                            padding: '8px 12px', borderRadius: 14,
                            borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4,
                            background: mine ? theme.accent : theme.surfaceSoft,
                            color: mine ? '#fff' : theme.text,
                            fontSize: 12.5, lineHeight: 1.4, wordBreak: 'break-word',
                            border: mine ? 'none' : `1px solid ${theme.border}`,
                          }}>
                            {m.text}
                          </div>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9.5, color: theme.textMuted, padding: '0 4px' }}>
                            {new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            {mine && (
                              <span className="material-symbols-outlined" style={{ fontSize: 13, color: read ? theme.accent : theme.textMuted }}>
                                {read ? 'done_all' : 'done'}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div style={{ borderTop: `1px solid ${theme.divider}` }}>
                  {sendError && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: theme.danger, padding: '6px 12px 0' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
                      Gagal terkirim. Periksa koneksi lalu kirim ulang.
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8, padding: '10px 12px' }}>
                    <input
                      value={messageInput}
                      onChange={(e) => { setMessageInput(e.target.value); setSendError(false) }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      placeholder="Tulis pesan..."
                      style={{ flex: 1, fontSize: 12.5, padding: '9px 12px', borderRadius: 10, border: `1px solid ${sendError ? theme.danger : theme.border}`, background: theme.surfaceSoft, color: theme.text, outline: 'none' }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !messageInput.trim()}
                      style={{
                        width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: (sending || !messageInput.trim()) ? theme.surfaceSoft : theme.accent,
                        color: (sending || !messageInput.trim()) ? theme.textMuted : '#fff',
                        cursor: (sending || !messageInput.trim()) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>send</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          title="Akun & Chat"
          style={{
            position: 'relative', width: 50, height: 50, borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
            boxShadow: '0 8px 20px rgba(7,82,183,0.35)', color: '#fff', transition: 'transform 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>group</span>
          {activeUsers.length > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, minWidth: 19, height: 19, padding: '0 4px', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#22C55E', color: '#fff', fontSize: 10.5, fontWeight: 700,
              border: `2px solid ${theme.bg}`,
            }}>
              {activeUsers.length}
            </span>
          )}
          {totalUnreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, left: -4, minWidth: 19, height: 19, padding: '0 4px', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: theme.danger, color: '#fff', fontSize: 10.5, fontWeight: 700,
              border: `2px solid ${theme.bg}`,
            }}>
              {totalUnreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
