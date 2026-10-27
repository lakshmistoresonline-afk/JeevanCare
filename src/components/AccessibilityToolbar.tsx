'use client'

import { useState, useEffect } from 'react'

export function AccessibilityToolbar() {
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hc = localStorage.getItem('jeevancare_hc') === '1'
    const lt = localStorage.getItem('jeevancare_lt') === '1'
    setHighContrast(hc)
    setLargeText(lt)
    if (hc) document.documentElement.classList.add('contrast-125')
    if (lt) document.documentElement.classList.add('text-lg')
  }, [])

  const toggleHighContrast = () => {
    const next = !highContrast
    setHighContrast(next)
    localStorage.setItem('jeevancare_hc', next ? '1' : '0')
    if (next) document.documentElement.classList.add('contrast-125')
    else document.documentElement.classList.remove('contrast-125')
  }

  const toggleLargeText = () => {
    const next = !largeText
    setLargeText(next)
    localStorage.setItem('jeevancare_lt', next ? '1' : '0')
    if (next) document.documentElement.classList.add('text-lg')
    else document.documentElement.classList.remove('text-lg')
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 hidden sm:flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 shadow-lg backdrop-blur-md text-xs">
      <span className="font-bold text-primary">♿ Accessibility:</span>
      <button
        type="button"
        onClick={toggleHighContrast}
        className={`rounded-full px-2.5 py-0.5 font-semibold transition-colors ${
          highContrast ? 'bg-primary text-white' : 'bg-secondary text-ink hover:bg-secondary/80'
        }`}
      >
        High Contrast
      </button>
      <button
        type="button"
        onClick={toggleLargeText}
        className={`rounded-full px-2.5 py-0.5 font-semibold transition-colors ${
          largeText ? 'bg-primary text-white' : 'bg-secondary text-ink hover:bg-secondary/80'
        }`}
      >
        Large Text
      </button>
    </div>
  )
}
