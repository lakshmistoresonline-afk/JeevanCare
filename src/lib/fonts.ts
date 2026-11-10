// src/lib/fonts.ts — JeevanCare typography
import { Bricolage_Grotesque, Figtree } from 'next/font/google'

export const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-figtree',
  display: 'swap',
  adjustFontFallback: false,
})

export const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
  adjustFontFallback: false,
})
