'use client'

import { useState } from 'react'
import Link from 'next/link'

const LANGUAGES = [
  { label: 'English', code: 'en' },
  { label: 'हिन्दी (Hindi)', code: 'hi' },
  { label: 'മലയാളം (Malayalam)', code: 'ml' },
  { label: 'தமிழ் (Tamil)', code: 'ta' },
  { label: 'తెలుగు (Telugu)', code: 'te' },
]

export function JeevanCareHeader() {
  const [langOpen, setLangOpen] = useState(false)
  const [selectedLang, setSelectedLang] = useState('English')
  const [accessibilityMode, setAccessibilityMode] = useState(false)

  const handleLanguageChange = (label: string, code: string) => {
    setSelectedLang(label)
    setLangOpen(false)
    if (code === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    } else {
      document.cookie = `googtrans=/en/${code}; path=/`
    }
    window.location.reload()
  }

  return (
    <header className={`sticky top-0 z-50 border-b border-border/80 bg-canvas/95 backdrop-blur-md ${accessibilityMode ? 'contrast-125' : ''}`}>
      <div className="w-full flex h-16 items-center justify-between px-6 sm:px-12 lg:px-16 xl:px-24">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm shadow-2xs">
            J
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-primary">JeevanCare</span>
        </Link>

        {/* Center Navigation Links (Matching Panel 1 in Reference Image) */}
        <nav className="hidden items-center gap-1 sm:gap-2 md:flex">
          <a href="#features" className="px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary">
            Features
          </a>
          <a href="#clinics" className="px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary">
            For Clinics
          </a>
          <a href="#patients" className="px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary">
            For Patients
          </a>
          <a href="#pricing" className="px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary">
            Pricing
          </a>
          <a href="#faq" className="px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary">
            FAQ
          </a>
        </nav>

        {/* Right Nav Controls */}
        <div className="flex items-center gap-3">
          {/* Accessibility Toggle */}
          <button
            type="button"
            onClick={() => setAccessibilityMode((v) => !v)}
            title="Toggle Accessibility High Contrast"
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-2xs transition-colors hover:border-primary hover:text-primary"
          >
            <span className="text-xs font-bold">♿</span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs transition-colors hover:border-primary"
            >
              <span>🇮🇳</span>
              <span>{selectedLang}</span>
              <span className="text-[10px] text-muted-foreground">▼</span>
            </button>
            {langOpen && (
              <div className="absolute end-0 mt-2 w-48 rounded-2xl border border-border bg-card p-1.5 shadow-md animate-fade-up z-50">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleLanguageChange(l.label, l.code)}
                    className="w-full rounded-xl px-3 py-2 text-start text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Direct Intent-Based Auth Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-ink shadow-2xs transition-colors hover:border-primary hover:text-primary"
            >
              Clinic Login
            </Link>
            <Link
              href="/patient/appointments/book"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-primary/90"
            >
              Book an Appointment &rarr;
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
