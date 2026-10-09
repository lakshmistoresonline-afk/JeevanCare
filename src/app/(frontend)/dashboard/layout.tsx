import React from 'react'
import { requireDashboardSession } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { CommandPalette } from '@/components/CommandPalette'
import { ReceptionQrModal } from '@/components/ReceptionQrModal'
import { logoutAction } from '@/app/(frontend)/login/actions'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, tenant } = await requireDashboardSession()

  // Existing sessions of a suspended clinic see a stop screen (spec §8.5).
  if (tenant?.status === 'suspended') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas px-4 text-center">
        <div className="font-display text-xl font-semibold text-primary">JeevanCare</div>
        <h1 className="text-lg font-semibold">This clinic&apos;s account is suspended</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Please contact support to reactivate your clinic.
        </p>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        clinicName={tenant?.name ?? 'Clinic'}
        userName={user.name}
        role={user.role}
      />
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top App Chrome Header with Command Palette & Reception QR Poster trigger */}
        <header className="hidden h-14 items-center justify-between border-b border-border bg-card px-6 md:flex">
          <CommandPalette />
          <div className="flex items-center gap-3">
            <ReceptionQrModal
              clinicName={tenant?.name}
              city={tenant?.city}
              phone={tenant?.phone}
              tenantId={tenant?.id ? String(tenant.id) : null}
            />
          </div>
        </header>

        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 md:hidden">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold">JeevanCare</span>
            <span className="text-xs text-muted-foreground">· {tenant?.name ?? 'Clinic'}</span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-xs font-medium text-red hover:underline">
              Sign out
            </button>
          </form>
        </header>
        <main className="flex-1 overflow-x-hidden px-4 pt-6 pb-24 sm:px-6 md:pb-8">
          <div className="mx-auto max-w-7xl animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  )
}
