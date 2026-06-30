'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function HeroSection() {
  const btnRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return

    const onMove = (e: MouseEvent) => {
      const pos = btn.getBoundingClientRect()
      const x = (e.clientX - pos.left - pos.width / 2) * 0.4
      const y = (e.clientY - pos.top - pos.height / 2) * 0.4
      btn.style.transform = `translate(${x}px, ${y}px)`
    }
    const onLeave = () => { btn.style.transform = 'translate(0px, 0px)' }

    btn.addEventListener('mousemove', onMove)
    btn.addEventListener('mouseleave', onLeave)
    return () => {
      btn.removeEventListener('mousemove', onMove)
      btn.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden" id="home">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.08),transparent_70%)] animate-fluid" />
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-surface to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8 reveal-left active">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-outline-variant/30 bg-surface-container-low/50">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium tracking-widest uppercase text-on-surface-variant">
              Creative Digital Agency Bogor
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-headline font-bold tracking-[-0.04em] text-primary leading-[0.9] flex flex-col">
            <span>Collaboration</span>
            <span>Meets</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">
              Innovation
            </span>
          </h1>

          <p className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed font-body">
            Digital Creative Agency inovatif di Bogor sebagai One-Stop Solution untuk estetika visual,
            produksi video sinematik, dan strategi pemasaran berbasis data.
          </p>

          <div className="flex items-center space-x-6 pt-4">
            <Link
              href="/#contact"
              ref={btnRef}
              className="magnetic-btn btn-pulse px-8 py-4 hero-gradient text-on-primary font-headline font-extrabold text-lg rounded-xl hover:scale-105 transition-all duration-300 relative overflow-hidden flex items-center justify-center"
            >
              <div className="shine-sweep" />
              <span className="relative z-10">Mulai Kolaborasi</span>
            </Link>
            <Link href="/#services" className="group flex items-center space-x-3 text-primary font-headline font-bold">
              <span>Explore Services</span>
              <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>

        <div className="hidden lg:block relative reveal-right active">
          <div className="aspect-square rounded-full border border-primary/10 absolute -inset-10 animate-[spin_20s_linear_infinite]" />
          <div className="aspect-square rounded-full border border-primary/5 absolute -inset-20 animate-[spin_35s_linear_infinite_reverse]" />
          <div className="relative z-10 w-full h-[500px]">
            <Image
              src="/images/company.png"
              alt="Hero Visual"
              fill
              className="rounded-[2rem] shadow-2xl shadow-primary/20 border border-outline-variant/20 object-cover animate-float"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
