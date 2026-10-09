'use client'

import { useState } from 'react'
import { btnGhost, btnPrimary } from './primitives'
import { IconPrinter, IconX } from './icons'

export function ReceptionQrModal({
  clinicName,
  city,
  phone,
  tenantId,
}: {
  clinicName?: string | null
  city?: string | null
  phone?: string | null
  tenantId?: string | null
}) {
  const [open, setOpen] = useState(false)

  const checkInUrl = `http://localhost:3000/patient/register?tenant=${tenantId || ''}`

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${btnGhost} text-xs gap-1.5`}
      >
        <span>📱 Print Reception Check-in QR</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-white p-6 shadow-2xl text-center flex flex-col items-center animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Reception Check-in Poster
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Poster Preview */}
            <div className="my-6 rounded-2xl border-2 border-primary/20 bg-canvas/40 p-6 w-full flex flex-col items-center text-center">
              <div className="size-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg mb-2">
                +
              </div>
              <h2 className="font-display text-lg font-bold text-ink">{clinicName || 'JeevanCare Clinic'}</h2>
              <p className="text-xs text-muted-foreground">{city || 'Thrissur'} · Phone: {phone || '+91 9847011111'}</p>

              <div className="my-5 bg-white p-3 rounded-xl border border-border shadow-xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(checkInUrl)}`}
                  alt="Scan to Check In"
                  width={160}
                  height={160}
                  className="rounded-lg object-contain"
                />
              </div>

              <div className="text-xs font-bold text-primary uppercase tracking-wide">
                Scan to Get Token or Check In
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground max-w-[200px]">
                Point your phone camera at this QR code to register or claim your OPD walk-in token instantly.
              </p>
            </div>

            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className={`${btnPrimary} w-full text-xs gap-1.5`}
              >
                <IconPrinter size={15} /> Print Poster for Reception
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
