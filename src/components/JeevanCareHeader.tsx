'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconMenu, IconX } from '@/components/icons'
import {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  findLanguageByCode,
  parseGoogtransCookie,
  formatGoogtransCookie,
  type LanguageOption,
} from '@/lib/language'
import { GoogleTranslateScript } from '@/components/GoogleTranslateScript'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/clinics', label: 'Clinics & Doctors' },
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/security', label: 'Security' },
  { href: '/faq', label: 'FAQ' },
]

export function JeevanCareHeader() {
  const pathname = usePathname()
  const [langOpen, setLangOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedLang, setSelectedLang] = useState<LanguageOption>(DEFAULT_LANGUAGE)
  const [accessibilityMode, setAccessibilityMode] = useState(false)

  // Restore language preference on mount from cookie or localStorage
  useEffect(() => {
    const cookieCode = parseGoogtransCookie(document.cookie)
    const storedCode = localStorage.getItem('jeevancare_lang') || cookieCode
    const active = findLanguageByCode(storedCode)
    setSelectedLang(active)
  }, [])

  const handleLanguageChange = (option: LanguageOption) => {
    setLangOpen(false)
    if (option.code === selectedLang.code) return // Prevent unnecessary reload if unchanged

    // Format googtrans cookies
    const hostname = typeof window !== 'undefined' ? window.location.hostname : undefined
    const cookieStrings = formatGoogtransCookie(option.code, hostname)
    cookieStrings.forEach((c) => {
      document.cookie = c
    })

    localStorage.setItem('jeevancare_lang', option.code)
    setSelectedLang(option)

    // Trigger single page reload to apply or clear Google Translate DOM transformations
    window.location.reload()
  }

  return (
    <>
      <GoogleTranslateScript />
      <header className={`sticky top-0 z-50 border-b border-border/80 bg-canvas/95 backdrop-blur-md ${accessibilityMode ? 'contrast-125' : ''}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-12">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm shadow-2xs">
              J
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-primary">JeevanCare</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 sm:gap-2 md:flex">
            {NAV_LINKS.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors rounded-lg ${
                    isActive
                      ? 'text-primary bg-secondary/60'
                      : 'text-muted-foreground hover:text-primary hover:bg-secondary/30'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Accessibility Contrast Toggle */}
            <button
              type="button"
              onClick={() => setAccessibilityMode((v) => !v)}
              title="Toggle Accessibility High Contrast"
              aria-label="Toggle Accessibility High Contrast"
              className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-2xs transition-colors hover:border-primary hover:text-primary"
            >
              <span className="text-xs font-bold">♿</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                aria-expanded={langOpen}
                aria-label="Select Language"
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-ink shadow-2xs transition-colors hover:border-primary"
              >
                <span>🇮🇳</span>
                <span className="hidden sm:inline">{selectedLang.label}</span>
                <span className="text-[10px] text-muted-foreground">▼</span>
              </button>
              {langOpen && (
                <div className="absolute end-0 mt-2 w-48 rounded-2xl border border-border bg-card p-1.5 shadow-md animate-fade-up z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => handleLanguageChange(l)}
                      className={`w-full rounded-xl px-3 py-2 text-start text-xs font-semibold transition-colors ${
                        l.code === selectedLang.code
                          ? 'bg-primary-soft text-primary font-bold'
                          : 'text-muted-foreground hover:bg-secondary hover:text-primary'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Auth Action Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-ink shadow-2xs transition-colors hover:border-primary hover:text-primary"
              >
                Clinic Login
              </Link>
              <Link
                href="/clinics"
                className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-primary/90"
              >
                Find a Doctor
              </Link>
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle Navigation Menu"
              className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-ink shadow-2xs md:hidden"
            >
              {mobileMenuOpen ? <IconX size={18} /> : <IconMenu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Sheet */}
        {mobileMenuOpen && (
          <div className="border-t border-border/80 bg-card p-4 shadow-lg md:hidden animate-fade-up">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
                      isActive ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-secondary/40'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-4 pt-3 border-t border-border/80 flex flex-col gap-2">
              <Link
                href="/patient/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl border border-border bg-canvas px-4 py-2.5 text-center text-xs font-bold text-ink"
              >
                Patient Portal Sign In
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl bg-primary px-4 py-2.5 text-center text-xs font-bold text-white shadow-2xs"
              >
                Clinic Workspace Login
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
