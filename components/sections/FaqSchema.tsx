import type { Service } from '@/data/services'
import type { CompanyProfile } from '@/lib/services'

// FAQ data used only for FAQPage structured data (SEO/GEO) — the same answers
// are already surfaced to visitors interactively via the live chat quick
// replies (see lib/chatbot/rules.ts), so no visible on-page duplicate here.
function buildFaqs(services: Service[], company: CompanyProfile) {
  const serviceNames = services.slice(0, 6).map((s) => s.title).join(', ')
  const wa = company.waNumber || company.phone

  return [
    {
      question: 'Layanan apa saja yang ditawarkan AMK Agency?',
      answer: serviceNames
        ? `AMK Agency menyediakan layanan integrated creative, media, & technology, di antaranya: ${serviceNames}. Setiap layanan dirancang sebagai business growth partner untuk memperkuat posisi brand Anda.`
        : 'AMK Agency menyediakan layanan integrated creative, media, & technology sebagai business growth partner untuk memperkuat posisi brand Anda.',
    },
    {
      question: 'Bagaimana cara memesan atau berkolaborasi dengan AMK Agency?',
      answer: 'Anda bisa klik tombol "Hubungi Admin" pada live chat di situs ini, atau langsung menghubungi kami via WhatsApp. Tim kami akan membantu proses konsultasi dan pemesanan secara langsung.',
    },
    {
      question: 'Kapan jam operasional AMK Agency?',
      answer: 'Tim kami aktif membalas setiap hari kerja, Senin–Sabtu pukul 09.00–17.00 WIB. Di luar jam tersebut, pesan Anda tetap kami terima dan akan dibalas secepatnya.',
    },
    {
      question: 'Apakah AMK Agency legal dan resmi berbadan hukum?',
      answer: `Ya. ${company.legalName || 'PT. Adikara Mandala Kreasi'} adalah perusahaan resmi berbadan hukum di Indonesia dengan NIB terdaftar, sehingga setiap kerja sama dijamin secara legal.`,
    },
    {
      question: 'Bagaimana cara menghubungi AMK Agency?',
      answer: [
        wa ? `WhatsApp di wa.me/${wa}` : null,
        company.email ? `email ke ${company.email}` : null,
        company.address ? `atau mengunjungi kantor kami di ${company.address}` : null,
      ].filter(Boolean).join(', ') || 'Hubungi kami melalui live chat atau kontak yang tersedia di situs ini.',
    },
  ]
}

export default function FaqSchema({ services, company }: { services: Service[]; company: CompanyProfile }) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: buildFaqs(services, company).map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  )
}
