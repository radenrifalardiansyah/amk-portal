import type { Service } from '@/data/services'
import type { CompanyProfile } from '@/lib/services'

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

export default function FaqSection({ services, company }: { services: Service[]; company: CompanyProfile }) {
  const faqs = buildFaqs(services, company)

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <section className="py-24 bg-surface-container-lowest scroll-mt-8" id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-4xl mx-auto px-8">
        <div className="text-center mb-16 reveal-scale">
          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-4">
            FAQ
          </span>
          <h2 className="text-4xl font-headline font-bold text-primary">Pertanyaan Umum</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group p-6 bg-surface rounded-2xl border border-outline-variant/20 shadow-sm"
            >
              <summary className="flex items-center justify-between cursor-pointer font-bold text-lg text-on-surface list-none">
                {faq.question}
                <span className="material-symbols-outlined text-primary transition-transform group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <p className="mt-4 text-on-surface-variant leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
