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
    <header className={`sticky top-0 z-50 border-b border-border/70 bg-canvas/90 backdrop-blur-md ${accessibilityMode ? 'contrast-125' : ''}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
            </svg>
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-primary">JeevanCare</span>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden items-center gap-1 sm:gap-2 md:flex">
          <a href="#how" className="px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-ink">
            How it works
          </a>
          <a href="#features" className="px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-ink">
            Features
          </a>
        </nav>

        {/* Right Nav Controls */}
        <div className="flex items-center gap-2.5">
          {/* Accessibility Toggle */}
          <button
            type="button"
            onClick={() => setAccessibilityMode((v) => !v)}
            title="Toggle Accessibility High Contrast"
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <span className="text-sm font-bold">♿</span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary"
            >
              <span>🇮🇳</span>
              <span>{selectedLang}</span>
              <span className="text-[10px] text-muted-foreground">▼</span>
            </button>
            {langOpen && (
              <div className="absolute end-0 mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-lg animate-fade-up">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleLanguageChange(l.label, l.code)}
                    className="w-full rounded-lg px-3 py-2 text-start text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
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
              href="/patient/login"
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              Patient Portal
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-primary/90"
            >
              Clinic Workspace
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
