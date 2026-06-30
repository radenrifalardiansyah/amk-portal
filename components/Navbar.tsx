'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const navLinks = [
  { label: 'Home', href: '/#home' },
  { label: 'About', href: '/#about' },
  { label: 'Services', href: '/#services' },
  { label: 'Portfolio', href: '/#portfolio' },
  { label: 'Leadership', href: '/#leadership' },
  { label: 'Contact', href: '/#contact' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => setIsOpen(false)

  return (
    <>
      <nav className="fixed top-0 w-full z-50 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-[30px] shadow-[0_4px_30px_rgba(37,99,235,0.08)]">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-[#60a5fa] to-primary" />
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center space-x-3 text-2xl font-bold tracking-tighter text-on-surface font-headline">
            <Image
              src="/images/logo.png"
              alt="AMK Logo"
              width={64}
              height={64}
              className="h-16 w-auto object-contain mix-blend-multiply"
            />
          </Link>

          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link font-headline tracking-[-0.04em] font-bold text-on-surface-variant hover:text-primary transition-all duration-500 ease-in-out"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link
            href="/#contact"
            className="hidden md:block font-headline tracking-[-0.04em] font-bold text-primary px-6 py-2 border border-primary/20 rounded-full hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-500 ease-in-out"
          >
            Mulai Kolaborasi
          </Link>

          <button
            id="mobile-menu-btn"
            className="md:hidden text-primary p-2"
            aria-label="Toggle mobile menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="material-symbols-outlined text-3xl transition-transform duration-300">
              {isOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-surface/95 backdrop-blur-xl transition-transform duration-500 ease-in-out md:hidden flex flex-col justify-center items-center space-y-8 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={closeMenu}
            className="text-3xl font-headline font-bold text-on-surface hover:text-primary transition-colors"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/#contact"
          onClick={closeMenu}
          className="mt-8 px-8 py-4 bg-primary text-white font-headline font-bold rounded-full shadow-lg"
        >
          Mulai Kolaborasi
        </Link>
      </div>
    </>
  )
}
