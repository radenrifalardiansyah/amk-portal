'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  visitorChatService, getOrCreateVisitorId, servicesService, portfolioService,
} from '@/lib/services'
import type { CompanyProfile, VisitorMessage, VisitorConversationMeta } from '@/lib/services'
import type { Service } from '@/data/services'
import type { PortfolioProject } from '@/data/portfolio'
import { getBotReply } from '@/lib/chatbot/rules'

const QUICK_REPLIES = [
  'Layanan Kami',
  'Lihat Portofolio',
  'Kontak & Alamat',
  'Cara Pemesanan',
  'Jam Operasional',
  'Legalitas & NIB',
  'Hubungi Admin',
]

export default function VisitorChatWidget({ company }: { company: CompanyProfile }) {
  const [open, setOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [meta, setMeta] = useState<VisitorConversationMeta | null>(null)
  const [messages, setMessages] = useState<VisitorMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [submittingContact, setSubmittingContact] = useState(false)
  const servicesRef = useRef<Service[]>([])
  const portfolioRef = useRef<PortfolioProject[]>([])
  const metaRef = useRef<VisitorConversationMeta | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setConversationId(getOrCreateVisitorId())
  }, [])

  useEffect(() => {
    if (!conversationId) return
    return visitorChatService.watchConversation(conversationId, (m) => { metaRef.current = m; setMeta(m) })
  }, [conversationId])

  useEffect(() => {
    if (!conversationId) return
    return visitorChatService.watchMessages(conversationId, setMessages)
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  // Load FAQ source data lazily, only once the visitor actually opens the widget.
  useEffect(() => {
    if (!open || dataLoaded) return
    Promise.all([servicesService.getAll(), portfolioService.getAllPublished()]).then(([services, portfolio]) => {
      servicesRef.current = services
      portfolioRef.current = portfolio
      setDataLoaded(true)
    })
  }, [open, dataLoaded])

  async function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed || !conversationId || sending) return
    setSending(true)
    setInput('')
    try {
      await visitorChatService.sendVisitorMessage(conversationId, trimmed)
      // An admin already took this conversation over — don't have the bot talk over them.
      if (metaRef.current?.status === 'handled') return
      const reply = getBotReply(trimmed, {
        services: servicesRef.current,
        portfolio: portfolioRef.current,
        company,
      })
      const link = reply.sectionId ? `/#${reply.sectionId}` : undefined
      await visitorChatService.sendBotReply(conversationId, reply.text, reply.needsAdmin, link)
      if (reply.sectionId) {
        document.getElementById(reply.sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } finally {
      setSending(false)
    }
  }

  // "Hubungi Admin" always hands off to a human, instead of the keyword-matched bot reply.
  async function handleContactAdmin() {
    if (!conversationId || sending) return
    setSending(true)
    try {
      await visitorChatService.sendVisitorMessage(conversationId, 'Hubungi Admin')
      if (metaRef.current?.status === 'handled') return
      await visitorChatService.sendBotReply(
        conversationId,
        'Baik, tim admin kami akan segera membantu Anda. Mohon isi email dan nomor HP di bawah ini ya 🙏',
        true,
      )
    } finally {
      setSending(false)
    }
  }

  async function handleContactSubmit(e: FormEvent) {
    e.preventDefault()
    if (!conversationId || !contactEmail.trim() || !contactPhone.trim() || submittingContact) return
    setSubmittingContact(true)
    try {
      await visitorChatService.submitContactInfo(conversationId, contactEmail, contactPhone)
      setContactEmail('')
      setContactPhone('')
    } finally {
      setSubmittingContact(false)
    }
  }

  const showContactForm = Boolean(meta?.needsAdmin) && !meta?.contactSubmitted && meta?.status !== 'closed'

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[92vw] max-w-sm h-[70vh] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-black/5 flex flex-col overflow-hidden">
          <div className="hero-gradient text-surface px-4 py-3 flex items-center justify-between shrink-0">
            <div>
              <p className="font-semibold text-sm">Asisten AMK</p>
              <p className="text-xs text-white/70">Biasanya membalas dalam beberapa saat</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Tutup live chat"
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
            {messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-4">
                Mulai percakapan dengan menyapa atau pilih topik di bawah 👇
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-line ${
                    m.sender === 'visitor'
                      ? 'hero-gradient text-surface rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                  {m.link && (
                    <a
                      href={m.link}
                      onClick={() => setOpen(false)}
                      className={`block mt-1 text-xs font-medium underline underline-offset-2 ${
                        m.sender === 'visitor' ? 'text-white' : 'text-primary'
                      }`}
                    >
                      Buka bagian ini →
                    </a>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {showContactForm ? (
            <form
              onSubmit={handleContactSubmit}
              className="px-3 pt-2 pb-1 flex flex-col gap-2 bg-gray-50 shrink-0"
            >
              <p className="text-xs text-gray-500">
                Isi email &amp; nomor HP Anda agar admin bisa segera menghubungi Anda:
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Email"
                  className="flex-1 min-w-0 text-xs px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-primary"
                />
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="No. HP"
                  className="flex-1 min-w-0 text-xs px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={submittingContact || !contactEmail.trim() || !contactPhone.trim()}
                className="text-xs px-3 py-2 rounded-full hero-gradient text-surface disabled:opacity-50 transition-opacity"
              >
                Kirim ke Admin
              </button>
            </form>
          ) : (
            <div className="px-3 pt-2 flex flex-wrap gap-2 bg-gray-50 shrink-0">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => (q === 'Hubungi Admin' ? handleContactAdmin() : handleSend(q))}
                  disabled={sending}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input) }}
            className="flex items-center gap-2 p-3 border-t border-gray-100 bg-white shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pesan..."
              className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Kirim pesan"
              className="w-9 h-9 shrink-0 flex items-center justify-center hero-gradient text-surface rounded-full disabled:opacity-40 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Tutup live chat' : 'Buka live chat'}
        className="w-14 h-14 hero-gradient text-surface rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <span className="material-symbols-outlined">chat</span>
        )}
      </button>
    </div>
  )
}
