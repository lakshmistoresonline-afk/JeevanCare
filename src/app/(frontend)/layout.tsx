import React from 'react'
import { figtree, bricolage } from '@/lib/fonts'
import './globals.css'

export const metadata = {
  title: 'JeevanCare — Your Trusted Healthcare Companion',
  description:
    'JeevanCare — Your Trusted Healthcare Companion. Simple, connected healthcare for patients, doctors and clinics.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${bricolage.variable}`}>
      <body>{children}</body>
    </html>
  )
}
