'use client'

import { useState, FormEvent } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const WA_NUMBER = '6285155336838'

const WhatsAppIcon = () => (
  <svg className="w-6 h-6 text-[#25D366]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.88-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
)

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', company: '', service: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { name, company, service, message } = form

    try {
      await addDoc(collection(db, 'leads'), {
        name,
        company: company || null,
        service,
        message,
        createdAt: serverTimestamp(),
      })
    } catch {
      // buka WA tetap jalan meski Firestore gagal
    }

    const text =
      'Halo Tim AMK,%0A%0A' +
      'Saya ingin berkonsultasi mengenai proyek digital.%0A' +
      `*Nama:* ${name}%0A` +
      `*Perusahaan:* ${company || '-'}%0A` +
      `*Layanan Diminati:* ${service}%0A%0A` +
      `*Pesan:*%0A${message}`
    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, '_blank')
    setLoading(false)
  }

  const inputClass =
    'w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-on-surface'

  return (
    <section className="py-24 relative overflow-hidden" id="contact">
      <div className="absolute inset-0 bg-primary/5" />
      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 reveal-left">
            <h2 className="text-5xl font-headline font-bold text-primary">Mari Berkarya Bersama</h2>
            <p className="text-xl text-on-surface-variant leading-relaxed">
              Punya ide proyek luar biasa atau butuh konsultasi terkait strategi digital Anda? Jangan ragu untuk
              menyapa kami.
            </p>
            <div className="flex items-center space-x-4 p-6 bg-surface rounded-2xl border border-outline-variant/20 shadow-sm hover-lift">
              <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                <WhatsAppIcon />
              </div>
              <div>
                <p className="font-bold text-lg text-on-surface">Respon Cepat via WhatsApp</p>
                <p className="text-sm text-on-surface-variant">Kami biasanya membalas dalam waktu 1 jam kerja.</p>
              </div>
            </div>
          </div>

          <div className="bg-surface p-8 md:p-12 rounded-3xl shadow-2xl border border-outline-variant/20 reveal-right">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="wa-name" className="block text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="wa-name"
                    required
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="wa-company" className="block text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                    Perusahaan / Instansi
                  </label>
                  <input
                    type="text"
                    id="wa-company"
                    className={inputClass}
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="wa-service" className="block text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                  Layanan yang Diminati
                </label>
                <select
                  id="wa-service"
                  required
                  className={`${inputClass} appearance-none`}
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                >
                  <option value="" disabled>Pilih Layanan Utama</option>
                  <option value="Cinematic Visuals (Video Produksi)">Cinematic Visuals (Video Produksi)</option>
                  <option value="Pro Audio (Podcast/Sonic Branding)">Pro Audio (Podcast/Sonic Branding)</option>
                  <option value="Data-Driven Marketing (Precision Growth)">Data-Driven Marketing (Precision Growth)</option>
                  <option value="AI Creative Assistant (Market Intelligence)">AI Creative Assistant (Market Intelligence)</option>
                  <option value="O2O Brand Experience (Hybrid Activation)">O2O Brand Experience (Hybrid Activation)</option>
                  <option value="Konsultasi Umum">Konsultasi Umum / Lainnya</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="wa-message" className="block text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                  Pesan Singkat
                </label>
                <textarea
                  id="wa-message"
                  rows={4}
                  required
                  className={`${inputClass} resize-none`}
                  placeholder="Ceritakan sedikit tentang kebutuhan Anda..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full magnetic-btn py-4 bg-primary text-white font-headline font-bold rounded-xl shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all flex justify-center items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Mengirim...' : 'Kirim ke WhatsApp Kami'}</span>
                <span className="material-symbols-outlined">{loading ? 'hourglass_empty' : 'send'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
