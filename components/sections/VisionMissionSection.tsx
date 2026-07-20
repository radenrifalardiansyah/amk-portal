import type { AboutPageContent } from '@/lib/services'

function SectionHeading({ icon, title, center }: { icon: string; title: string; center?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-3 ${center ? 'mx-auto' : ''}`}>
      <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </span>
      <h2 className="text-4xl font-headline font-bold text-primary">{title}</h2>
    </div>
  )
}

function MissionCard({ index, mission }: { index: number; mission: string }) {
  return (
    <div className="group stagger-item p-8 bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 shadow-sm hover-lift hover:bg-surface-container-highest transition-colors">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-headline font-bold group-hover:bg-primary group-hover:text-white transition-colors duration-300">
        {String(index + 1).padStart(2, '0')}
      </div>
      <p className="mt-5 text-on-surface-variant leading-relaxed">{mission}</p>
    </div>
  )
}

export default function VisionMissionSection({ content }: { content: AboutPageContent }) {
  const hasMissionIntro = Boolean(content.missionIntro?.trim())

  return (
    <section className="relative py-24 bg-surface overflow-hidden reveal scroll-mt-8" id="vision-mission">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(7,82,183,0.07),transparent_55%)]" />

      <div className="max-w-7xl mx-auto px-8 relative z-10 space-y-20">
        {/* Vision */}
        <div className="reveal-left">
          <div className="text-center mb-10">
            <SectionHeading icon="visibility" title={content.visionTitle} center />
          </div>
          <div className="relative max-w-4xl mx-auto p-8 md:p-12 bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 shadow-sm reveal-scale">
            <span className="material-symbols-outlined absolute top-6 right-8 text-primary/10 text-6xl">
              format_quote
            </span>
            <p className="relative text-center text-lg md:text-2xl text-on-surface-variant leading-relaxed font-medium">
              {content.visionText}
            </p>
          </div>
        </div>

        {/* Mission */}
        {hasMissionIntro ? (
          <div className="grid lg:grid-cols-2 gap-12 items-start reveal-right">
            <div className="space-y-6">
              <SectionHeading icon="rocket_launch" title={content.missionTitle} />
              <p className="text-lg text-on-surface-variant leading-relaxed">{content.missionIntro}</p>
            </div>
            <div className="grid gap-6">
              {content.missions.map((mission, i) => (
                <MissionCard key={i} index={i} mission={mission} />
              ))}
            </div>
          </div>
        ) : (
          <div className="reveal-right">
            <div className="text-center mb-12">
              <SectionHeading icon="rocket_launch" title={content.missionTitle} center />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.missions.map((mission, i) => (
                <MissionCard key={i} index={i} mission={mission} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
