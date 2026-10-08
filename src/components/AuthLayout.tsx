'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IconCheck } from '@/components/icons'

const WORKFLOW_STEPS = [
  { n: '01', title: 'APPOINTMENT', desc: 'Real-time available slots' },
  { n: '02', title: 'OPD QUEUE', desc: 'Live token stepper (#T-01)' },
  { n: '03', title: 'CONSULTATION', desc: 'Split-pane EMR & vitals' },
  { n: '04', title: 'PRESCRIPTION', desc: 'A5 Rx & 1-tap WhatsApp' },
  { n: '05', title: 'DOCUMENTS', desc: 'Lab reports & X-rays' },
  { n: '06', title: 'BILLING', desc: '₹ INR & Dynamic UPI QR' },
]

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen bg-canvas">
      {/* Left Brand & Workflow Panel (Desktop 44%) */}
      <aside className="relative hidden w-[44%] overflow-hidden bg-sidebar lg:block">
        <Image
          src="/images/login-doctor.jpg"
          alt="JeevanCare Healthcare Platform"
          fill
          priority
          sizes="44vw"
          className="object-cover object-[50%_18%] opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/60 to-sidebar/30" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="flex w-fit items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/25 backdrop-blur">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4.5 text-sidebar-accent" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
              </svg>
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-white">JeevanCare</span>
          </Link>

          <div className="my-auto py-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sidebar-accent/20 px-3 py-1 text-xs font-semibold text-sidebar-accent ring-1 ring-sidebar-accent/30">
              <span>🇮🇳</span> Designed for Indian Clinics &amp; Patients
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-snug text-white xl:text-4xl">
              Healthcare, connected.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              One secure place for appointments, consultations, prescriptions, medical documents, and ₹ UPI payments.
            </p>

            {/* Subtle Workflow Stepper */}
            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/15 pt-6">
              {WORKFLOW_STEPS.map((s) => (
                <div key={s.n} className="flex items-start gap-2.5 rounded-lg bg-white/5 p-2.5 backdrop-blur-xs">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-sidebar-accent text-[10px] font-bold text-sidebar">
                    {s.n}
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold text-white tracking-wide">{s.title}</div>
                    <div className="text-[10px] text-white/70">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/15 pt-4 text-xs text-white/50">
            <span>Aapka clinic, organized.</span>
            <span>Asia/Kolkata (IST) · ₹ INR</span>
          </div>
        </div>
      </aside>

      {/* Right Content Form Panel */}
      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">
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
