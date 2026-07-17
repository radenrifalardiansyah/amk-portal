import type { ContactContent } from '@/lib/services'

const WhatsAppIcon = () => (
  <svg className="w-6 h-6 text-[#25D366]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.88-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
)

export default function ContactSection({ content }: { content: ContactContent }) {
  return (
    <section className="py-24 relative overflow-hidden scroll-mt-8" id="contact">
      <div className="absolute inset-0 bg-primary/5" />
      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className={content.googleFormUrl ? 'grid lg:grid-cols-2 gap-16 items-center' : 'max-w-2xl mx-auto'}>
          <div className="space-y-8 reveal-left">
            <h2 className="text-5xl font-headline font-bold text-primary">{content.heading}</h2>
            <p className="text-xl text-on-surface-variant leading-relaxed">
              {content.description}
            </p>
            <a
              href={`https://wa.me/${content.waNumber}?text=${encodeURIComponent(content.waMessageTemplate)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-4 p-6 bg-surface rounded-2xl border border-outline-variant/20 shadow-sm hover-lift cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                <WhatsAppIcon />
              </div>
              <div>
                <p className="font-bold text-lg text-on-surface">{content.waResponseTitle}</p>
                <p className="text-sm text-on-surface-variant">{content.waResponseSubtitle}</p>
              </div>
            </a>
          </div>

          {content.googleFormUrl && (
            <div className="bg-surface p-2 rounded-3xl shadow-2xl border border-outline-variant/20 reveal-right overflow-hidden">
              <iframe
                src={content.googleFormUrl}
                title="Formulir Kontak"
                className="w-full rounded-2xl"
                height={840}
                frameBorder={0}
                marginHeight={0}
                marginWidth={0}
              >
                Memuat…
              </iframe>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
