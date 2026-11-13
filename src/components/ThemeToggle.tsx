'use client'

import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jeevancare-theme')
      const darkPref = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
      setIsDark(darkPref)
      if (darkPref) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('jeevancare-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('jeevancare-theme', 'light')
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-sidebar-foreground/80 transition-colors hover:bg-white/[0.06] hover:text-sidebar-active-fg border border-sidebar-border"
      title="Toggle Clinical Dark Mode for Night Shifts"
    >
      <span className="flex items-center gap-2">
        <span>{isDark ? '🌙' : '☀️'}</span>
        <span>{isDark ? 'Night Shift Dark Mode' : 'Light Clinical Mode'}</span>
      </span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber/20 text-amber-600'}`}>
        {isDark ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}
