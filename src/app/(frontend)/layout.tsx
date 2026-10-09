import React from 'react'
import { Toaster } from 'sonner'
import { PwaRegister } from '@/components/PwaRegister'
import { figtree, bricolage } from '@/lib/fonts'
import './globals.css'

export const metadata = {
  title: 'JeevanCare — Your Trusted Healthcare Companion',
  description:
    'JeevanCare — Your Trusted Healthcare Companion. Simple, connected healthcare for patients, doctors and clinics.',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#0d6e60',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${bricolage.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d6e60" />
      </head>
      <body>
        {children}
        <Toaster position="top-right" richColors />
        <PwaRegister />
      </body>
    </html>
  )
}
