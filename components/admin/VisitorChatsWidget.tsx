'use client'

import { useEffect, useRef, useState } from 'react'
import { visitorChatService } from '@/lib/services'
import type { VisitorMessage, VisitorConversationMeta } from '@/lib/services'
import { theme } from '@/lib/admin-theme'

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  return `${hours} jam lalu`
}

export default function VisitorChatsWidget({ collapsed = false, onBadgeChange }: {
  collapsed?: boolean
  onBadgeChange?: (needsAdmin: number) => void
} = {}) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'list' | 'chat'>('list')
  const [conversations, setConversations] = useState<VisitorConversationMeta[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<VisitorMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => visitorChatService.watchAllConversations(setConversations), [])

  useEffect(() => {
    if (!activeId) { setMessages([]); return }
    return visitorChatService.watchMessages(activeId, setMessages)
  }, [activeId])

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

  const needsAdminCount = conversations.filter((c) => c.needsAdmin).length
  const active = conversations.find((c) => c.id === activeId)

  useEffect(() => {
    onBadgeChange?.(needsAdminCount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsAdminCount])

  useEffect(() => {
    if (collapsed) setOpen(false)
  }, [collapsed])

  const openChat = (id: string) => {
    setActiveId(id)
    setView('chat')
  }

  const backToList = () => {
    setView('list')
    setActiveId(null)
  }

  const handleSend = async () => {
    if (!activeId || !input.trim()) return
    const text = input
    setInput('')
    setSending(true)
    try {
      await visitorChatService.sendAdminMessage(activeId, text)
    } finally {
      setSending(false)
    }
  }

  const handleClose = async () => {
    if (!activeId) return
    await visitorChatService.closeConversation(activeId)
    backToList()
  }

  if (collapsed) return null

  return (
    <div ref={rootRef} className="fixed z-40 bottom-[88px] lg:bottom-6" style={{ right: 82 }}>
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
                    <span className="material-symbols-outlined" style={{ fontSize: 17, color: theme.accent }}>support_agent</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline }}>Chat Pengunjung</p>
                    <p style={{ fontSize: 11, color: theme.textMuted }}>{needsAdminCount} butuh balasan admin</p>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                  {conversations.length === 0 && (
                    <p style={{ fontSize: 12, color: theme.textMuted, padding: '20px 8px', textAlign: 'center' }}>Belum ada percakapan pengunjung.</p>
                  )}
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => openChat(c.id)}
                      style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: c.needsAdmin ? theme.dangerSoft : theme.accentSoft,
                        color: c.needsAdmin ? theme.danger : theme.accent,
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Pengunjung #{c.id.slice(0, 6)}
                        </p>
                        <p style={{ fontSize: 10.5, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.lastMessageText || 'Belum ada pesan'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        {c.lastMessageAt && <span style={{ fontSize: 9.5, color: theme.textMuted }}>{relativeTime(c.lastMessageAt)}</span>}
                        {c.needsAdmin && <span style={{ width: 9, height: 9, borderRadius: '50%', background: theme.danger }} />}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: '12px 14px', borderBottom: `1px solid ${theme.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={backToList} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: theme.textMuted, padding: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
                  </button>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: theme.accentSoft, color: theme.accent,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Pengunjung #{activeId?.slice(0, 6)}
                    </p>
                    {(active?.visitorEmail || active?.visitorPhone) && (
                      <p style={{ fontSize: 10.5, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {[active?.visitorEmail, active?.visitorPhone].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  {active?.status !== 'closed' && (
                    <button
                      onClick={handleClose}
                      title="Tandai selesai"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: theme.textMuted, padding: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                    </button>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {messages.length === 0 && (
                    <p style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', marginTop: 20 }}>Belum ada pesan.</p>
                  )}
                  {messages.map((m) => {
                    const mine = m.sender === 'admin'
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: mine ? 'flex-end' : 'flex-start' }}>
                          {!mine && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: theme.textMuted, paddingLeft: 10 }}>
                              {m.sender === 'bot' ? 'Asisten AMK' : 'Pengunjung'}
                            </span>
                          )}
                          <div style={{
                            padding: '8px 12px', borderRadius: 14, whiteSpace: 'pre-line',
                            borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4,
                            background: mine ? theme.accent : theme.surfaceSoft,
                            color: mine ? '#fff' : theme.text,
                            fontSize: 12.5, lineHeight: 1.4, wordBreak: 'break-word',
                            border: mine ? 'none' : `1px solid ${theme.border}`,
                          }}>
                            {m.text}
                          </div>
                          <span style={{ fontSize: 9.5, color: theme.textMuted, padding: '0 4px' }}>
                            {new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div style={{ borderTop: `1px solid ${theme.divider}` }}>
                  <div style={{ display: 'flex', gap: 8, padding: '10px 12px' }}>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      placeholder="Balas sebagai admin..."
                      style={{ flex: 1, fontSize: 12.5, padding: '9px 12px', borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surfaceSoft, color: theme.text, outline: 'none' }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !input.trim()}
                      style={{
                        width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: (sending || !input.trim()) ? theme.surfaceSoft : theme.accent,
                        color: (sending || !input.trim()) ? theme.textMuted : '#fff',
                        cursor: (sending || !input.trim()) ? 'not-allowed' : 'pointer',
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
          title="Chat Pengunjung"
          style={{
            position: 'relative', width: 50, height: 50, borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
            boxShadow: '0 8px 20px rgba(7,82,183,0.35)', color: '#fff', transition: 'transform 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>support_agent</span>
          {needsAdminCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, minWidth: 19, height: 19, padding: '0 4px', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: theme.danger, color: '#fff', fontSize: 10.5, fontWeight: 700,
              border: `2px solid ${theme.bg}`,
            }}>
              {needsAdminCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
