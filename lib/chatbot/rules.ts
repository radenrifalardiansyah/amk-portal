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
}

const GREETING_KEYWORDS = ['halo', 'hai', 'hi', 'hello', 'pagi', 'siang', 'sore', 'malam']
const SERVICES_KEYWORDS = ['layanan', 'jasa', 'servis', 'service', 'produk', 'harga', 'biaya', 'tarif']
const PORTFOLIO_KEYWORDS = ['portofolio', 'portfolio', 'karya', 'proyek', 'project', 'contoh kerja', 'hasil kerja']
const CONTACT_KEYWORDS = ['kontak', 'hubungi', 'whatsapp', 'wa', 'nomor', 'telepon', 'email', 'alamat', 'admin', 'lokasi', 'kantor']

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => new RegExp(`\\b${keyword}\\b`, 'i').test(text))
}

// Pure keyword matching over data already in Firestore — no external AI/LLM call, no cost.
export function getBotReply(userText: string, ctx: BotReplyContext): BotReply {
  const text = userText.trim().toLowerCase()
  if (!text) return { text: 'Silakan tulis pertanyaan Anda ya 🙂', needsAdmin: false }

  if (matchesAny(text, CONTACT_KEYWORDS)) {
    const wa = ctx.company.waNumber || ctx.company.phone
    const lines = [
      'Anda bisa menghubungi kami langsung:',
      wa ? `- WhatsApp: wa.me/${wa}` : null,
      ctx.company.email ? `- Email: ${ctx.company.email}` : null,
      ctx.company.address ? `- Alamat: ${ctx.company.address}` : null,
    ].filter(Boolean)
    return { text: lines.join('\n'), needsAdmin: false }
  }

  if (matchesAny(text, SERVICES_KEYWORDS)) {
    if (ctx.services.length === 0) {
      return { text: 'Maaf, data layanan belum tersedia saat ini. Tim kami akan segera membantu.', needsAdmin: true }
    }
    const list = ctx.services.slice(0, 6).map((s) => `- ${s.title}: ${s.subtitle}`).join('\n')
    return { text: `Berikut layanan utama kami:\n${list}\n\nKetik "kontak" untuk konsultasi lebih lanjut dengan tim kami.`, needsAdmin: false }
  }

  if (matchesAny(text, PORTFOLIO_KEYWORDS)) {
    const published = ctx.portfolio.filter((p) => p.status === 'published').slice(0, 5)
    if (published.length === 0) {
      return { text: 'Maaf, data portofolio belum tersedia saat ini. Tim kami akan segera membantu.', needsAdmin: true }
    }
    const list = published.map((p) => `- ${p.title} (${p.client})`).join('\n')
    return { text: `Beberapa proyek yang pernah kami kerjakan:\n${list}\n\nLihat selengkapnya di halaman Portfolio ya!`, needsAdmin: false }
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
