'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const JOURNEY_STEPS = [
  { n: '01', label: 'Book', desc: 'Real slots' },
  { n: '02', label: 'Check-in', desc: 'Token #T-01' },
  { n: '03', label: 'Consult', desc: 'Split EMR' },
  { n: '04', label: 'Prescribe', desc: 'A5 Rx' },
  { n: '05', label: 'Documents', desc: 'Lab PDF' },
  { n: '06', label: 'Bill', desc: 'UPI QR' },
]

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen bg-canvas">
      {/* Left Brand & Product Showcase Panel (Desktop 44%) */}
      <aside className="relative hidden w-[44%] overflow-hidden bg-sidebar lg:block">
        <Image
          src="/images/login-doctor.jpg"
          alt="JeevanCare Healthcare Platform"
          fill
          priority
          sizes="44vw"
          className="object-cover object-[50%_18%] opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar via-sidebar/95 to-sidebar" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="flex w-fit items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/25 backdrop-blur">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4.5 text-sidebar-accent" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
              </svg>
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-white">JeevanCare</span>
          </Link>

          <div className="my-auto py-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sidebar-accent/20 px-3 py-1 text-xs font-semibold text-sidebar-accent ring-1 ring-sidebar-accent/30">
              <span>🇮🇳</span> Designed for Indian Healthcare
            </span>

            <h2 className="mt-4 font-display text-3xl font-semibold leading-snug text-white xl:text-4xl">
              Healthcare, connected.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              Everything your care journey needs, in one place.
            </p>

            {/* Real Product Showcase UI Card */}
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-2 rounded-full bg-sidebar-accent animate-ping" />
                  <span className="text-[11px] font-bold tracking-wider text-sidebar-accent uppercase">
                    Live OPD Queue Tracker
                  </span>
                </div>
                <span className="rounded bg-sidebar-accent px-2 py-0.5 text-[10px] font-extrabold text-sidebar">
                  Token #T-01
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                <div>
                  <div className="font-semibold text-white">Dr. Kavya Nair</div>
                  <div className="text-[10px] text-white/70">General Medicine · JeevanCare Thrissur Clinic</div>
                </div>
                <div className="text-end">
                  <div className="tabular font-bold text-sidebar-accent">06/10/2026</div>
                  <div className="tabular text-[10px] text-white/70">Fee: ₹500</div>
                </div>
              </div>
            </div>

            {/* Connected 6-Step Visual Journey */}
            <div className="mt-6 border-t border-white/15 pt-5">
              <div className="text-[11px] font-semibold text-white/60 uppercase tracking-wider mb-3">
                Complete Outpatient Care Journey
              </div>
              <div className="grid grid-cols-3 gap-2">
                {JOURNEY_STEPS.map((s) => (
                  <div key={s.n} className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                    <span className="text-[10px] font-bold text-sidebar-accent">{s.n}</span>
                    <div className="text-[11px] font-semibold text-white leading-tight mt-0.5">{s.label}</div>
                    <div className="text-[9px] text-white/60">{s.desc}</div>
                  </div>
                ))}
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
            <span className="font-display text-xl font-semibold tracking-tight text-primary">JeevanCare</span>
          </Link>

          {children}
        </div>
      </section>
    </main>
  )
}
