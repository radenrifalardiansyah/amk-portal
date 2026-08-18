import type { Service } from '@/data/services'
import type { PortfolioProject } from '@/data/portfolio'
import type { CompanyProfile } from '@/lib/services'

export interface BotReplyContext {
  services: Service[]
  portfolio: PortfolioProject[]
  company: CompanyProfile
}

export interface BotReply {
  text: string
  needsAdmin: boolean
  /** Anchor id on the homepage the widget should scroll to instead of narrating an answer. */
  sectionId?: string
}

const GREETING_KEYWORDS = ['halo', 'hai', 'hi', 'hello', 'pagi', 'siang', 'sore', 'malam']
const SERVICES_KEYWORDS = ['layanan', 'jasa', 'servis', 'service', 'produk', 'harga', 'biaya', 'tarif']
const PORTFOLIO_KEYWORDS = ['portofolio', 'portfolio', 'karya', 'proyek', 'project', 'contoh kerja', 'hasil kerja']
const CONTACT_KEYWORDS = ['kontak', 'hubungi', 'whatsapp', 'wa', 'nomor', 'telepon', 'email', 'alamat', 'admin', 'lokasi', 'kantor']
const ORDER_KEYWORDS = ['pesan', 'order', 'pemesanan', 'booking']
const HOURS_KEYWORDS = ['jam operasional', 'jam kerja', 'jam buka', 'operasional', 'buka jam berapa']
const LEGAL_KEYWORDS = ['legal', 'legalitas', 'resmi', 'nib', 'badan hukum', 'perusahaan resmi', 'terdaftar']

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => new RegExp(`\\b${keyword}\\b`, 'i').test(text))
}

// Pure keyword matching over data already in Firestore — no external AI/LLM call, no cost.
export function getBotReply(userText: string, ctx: BotReplyContext): BotReply {
  const text = userText.trim().toLowerCase()
  if (!text) return { text: 'Silakan tulis pertanyaan Anda ya 🙂', needsAdmin: false }

  if (matchesAny(text, CONTACT_KEYWORDS)) {
    return { text: 'Baik, ini dia bagian Kontak kami 👇', needsAdmin: false, sectionId: 'contact' }
  }

  if (matchesAny(text, SERVICES_KEYWORDS)) {
    if (ctx.services.length === 0) {
      return { text: 'Maaf, data layanan belum tersedia saat ini. Tim kami akan segera membantu.', needsAdmin: true }
    }
    return { text: 'Baik, ini dia bagian Layanan Kami 👇', needsAdmin: false, sectionId: 'services' }
  }

  if (matchesAny(text, PORTFOLIO_KEYWORDS)) {
    const published = ctx.portfolio.filter((p) => p.status === 'published')
    if (published.length === 0) {
      return { text: 'Maaf, data portofolio belum tersedia saat ini. Tim kami akan segera membantu.', needsAdmin: true }
    }
    return { text: 'Baik, ini dia bagian Portofolio kami 👇', needsAdmin: false, sectionId: 'portfolio' }
  }

  if (matchesAny(text, ORDER_KEYWORDS)) {
    return {
      text: 'Untuk melakukan pemesanan, klik tombol "Hubungi Admin" di bawah ini ya. Tim kami akan bantu proses pemesanan Anda secara langsung.',
      needsAdmin: false,
    }
  }

  if (matchesAny(text, HOURS_KEYWORDS)) {
    return {
      text: 'Tim kami aktif membalas setiap hari kerja, Senin–Sabtu pukul 09.00–17.00 WIB. Di luar jam tersebut, pesan Anda tetap kami terima dan akan dibalas secepatnya.',
      needsAdmin: false,
    }
  }

  if (matchesAny(text, LEGAL_KEYWORDS)) {
    return {
      text: `Ya, ${ctx.company.legalName || 'PT. Adikara Mandala Kreasi'} adalah perusahaan resmi berbadan hukum di Indonesia dengan NIB terdaftar, sehingga setiap kerja sama dijamin secara legal.`,
      needsAdmin: false,
    }
  }

  if (matchesAny(text, GREETING_KEYWORDS)) {
    return {
      text: 'Halo! Saya Asisten AMK 👋 Ada yang bisa saya bantu? Anda bisa tanya soal "layanan", "portofolio", atau "kontak".',
      needsAdmin: false,
    }
  }

  return {
    text: 'Maaf, saya belum bisa menjawab pertanyaan itu secara otomatis. Pesan Anda sudah diteruskan ke tim kami dan akan segera dibalas ya 🙏',
    needsAdmin: true,
  }
}
