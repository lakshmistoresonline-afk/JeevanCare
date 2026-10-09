'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const WORKFLOW_STEPS = [
  { label: 'Book', desc: 'Real slots' },
  { label: 'Check-in', desc: 'Token #T-01' },
  { label: 'Consult', desc: 'Split EMR' },
  { label: 'Prescribe', desc: 'A5 Rx' },
  { label: 'Bill', desc: 'UPI QR' },
]

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen bg-canvas">
      {/* Left Brand & Product Showcase Panel (Desktop 44%) - Matching Panel 2 in reference image */}
      <aside className="relative hidden w-[44%] overflow-hidden bg-sidebar lg:block">
        <Image
          src="/images/login-doctor.jpg"
          alt="JeevanCare Healthcare Platform"
          fill
          priority
          sizes="44vw"
          className="object-cover object-[50%_18%] opacity-25 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar via-sidebar/95 to-sidebar" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="flex w-fit items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/25 backdrop-blur">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-5 text-sidebar-accent" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
              </svg>
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-white">JeevanCare</span>
          </Link>

          <div className="my-auto py-6 space-y-6">
            <div>
              <span className="text-xs font-semibold text-sidebar-accent uppercase tracking-wider">Welcome back</span>
              <h2 className="mt-2 font-display text-3xl xl:text-4xl font-bold leading-tight text-white">
                Care made simple for every clinic.
              </h2>
            </div>

            {/* Bullet Trust Points */}
            <ul className="space-y-3 text-sm text-white/85">
              <li className="flex items-center gap-2.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-sidebar-accent/20 text-sidebar-accent text-xs font-bold">🛡️</span>
                <span className="font-medium">Secure &amp; private — Clinic-level data isolation</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-sidebar-accent/20 text-sidebar-accent text-xs font-bold">🇮🇳</span>
                <span className="font-medium">Built for Indian clinics — ₹ INR, +91 Mobile &amp; UPI</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-sidebar-accent/20 text-sidebar-accent text-xs font-bold">⚡</span>
                <span className="font-medium">Fast and reliable — Instant OPD queue &amp; EMR</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex size-6 items-center justify-center rounded-full bg-sidebar-accent/20 text-sidebar-accent text-xs font-bold">🔒</span>
                <span className="font-medium">Your data stays yours — Industry best practices</span>
              </li>
            </ul>

            {/* 5-Step Workflow Card Stepper */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-xl backdrop-blur-md">
              <div className="text-[11px] font-bold text-sidebar-accent uppercase tracking-wider mb-3">
                Complete Care Workflow
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {WORKFLOW_STEPS.map((s, idx) => (
                  <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <span className="block text-[10px] font-bold text-sidebar-accent">{idx + 1}</span>
                    <span className="block text-[11px] font-semibold text-white mt-0.5">{s.label}</span>
                    <span className="block text-[9px] text-white/60 truncate">{s.desc}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-center text-[10px] text-white/60">
                Built for doctors, owners, staff, and patients.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/15 pt-4 text-xs text-white/50">
            <span>Your clinic, organized.</span>
            <span>+91 · ₹ INR · UPI · Asia/Kolkata</span>
          </div>
        </div>
      </aside>

      {/* Right Content Form Panel — Constrained Width */}
      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[440px] animate-fade-up">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3.5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
              </svg>
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-primary">JeevanCare</span>
          </Link>

          {children}
        </div>
      </section>
    </main>
  )
}
