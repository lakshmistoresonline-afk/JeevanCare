'use client'

import { useState } from 'react'
import { PrintButton } from './PrintButton'
import { WhatsAppShareButton } from './WhatsAppShareButton'
import Link from 'next/link'

export function PrintFormatCustomizer({
  backHref,
  waUrl,
  waLabel = 'Send Rx via WhatsApp',
  onFormatChange,
}: {
  backHref: string
  waUrl?: string
  waLabel?: string
  onFormatChange?: (config: { format: 'A4' | 'A5'; showHeader: boolean; showSignature: boolean }) => void
}) {
  const [format, setFormat] = useState<'A4' | 'A5'>('A5')
  const [showHeader, setShowHeader] = useState(true)
  const [showSignature, setShowSignature] = useState(true)

  const handleFormat = (f: 'A4' | 'A5') => {
    setFormat(f)
    onFormatChange?.({ format: f, showHeader, showSignature })
  }

  const handleHeaderToggle = () => {
    const next = !showHeader
    setShowHeader(next)
    onFormatChange?.({ format, showHeader: next, showSignature })
  }

  const handleSignatureToggle = () => {
    const next = !showSignature
    setShowSignature(next)
    onFormatChange?.({ format, showHeader, showSignature: next })
  }

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-2xs print:hidden space-y-3">
      <style>{`
        @page { size: ${format}; margin: 0; }
        .print-container { max-width: ${format === 'A4' ? '210mm' : '150mm'} !important; }
        ${!showHeader ? '.print-header { display: none !important; }' : ''}
        ${!showSignature ? '.print-signature { display: none !important; }' : ''}
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <Link href={backHref} className="text-xs font-medium text-muted-foreground hover:text-ink">
          ‹ Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          {waUrl && <WhatsAppShareButton href={waUrl} label={waLabel} />}
          <PrintButton label={`Print ${format} PDF`} />
        </div>
      </div>

      {/* Format & Customization Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink">Page Format:</span>
          <div className="inline-flex rounded-lg border border-border bg-canvas p-0.5">
            <button
              type="button"
              onClick={() => handleFormat('A5')}
              className={`rounded-md px-3 py-1 text-[11px] font-bold transition-colors ${
                format === 'A5' ? 'bg-primary text-white shadow-2xs' : 'text-muted-foreground hover:text-ink'
              }`}
            >
              A5 Compact Pad
            </button>
            <button
              type="button"
              onClick={() => handleFormat('A4')}
              className={`rounded-md px-3 py-1 text-[11px] font-bold transition-colors ${
                format === 'A4' ? 'bg-primary text-white shadow-2xs' : 'text-muted-foreground hover:text-ink'
              }`}
            >
              A4 Full Sheet
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showHeader}
              onChange={handleHeaderToggle}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-medium text-ink">Clinic Letterhead</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSignature}
              onChange={handleSignatureToggle}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-medium text-ink">Doctor Signature</span>
          </label>
        </div>
      </div>
    </div>
  )
}
