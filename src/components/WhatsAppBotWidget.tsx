'use client'

import { useState } from 'react'
import { Card, btnPrimary, inputClass } from './primitives'
import { IconWhatsApp } from './icons'
import { processWhatsAppBotMessage, type BotResponse } from '@/lib/whatsappBot'
import { toast } from 'sonner'

export function WhatsAppBotWidget({
  patientName = 'Aswathy Menon',
  tokenNumber = 'T-04',
  doctorName = 'Dr. Sabitha Krishnamoorthy',
  clinicName = 'Swaraj Medical Centre',
}: {
  patientName?: string
  tokenNumber?: string
  doctorName?: string
  clinicName?: string
}) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string; actionUrl?: string }[]>([
    {
      sender: 'bot',
      text: `👋 Welcome to ${clinicName} WhatsApp Bot! Type TOKEN, RX, or BOOK to test automated responses.`,
    },
  ])

  const send = (overrideText?: string) => {
    const msgText = overrideText || input
    if (!msgText.trim()) return

    const userMsg = { sender: 'user' as const, text: msgText }
    const botRes: BotResponse = processWhatsAppBotMessage(msgText, {
      patientName,
      tokenNumber,
      doctorName,
      waitTimeMins: 10,
      clinicName,
    })

    setMessages((prev) => [...prev, userMsg, { sender: 'bot', text: botRes.reply, actionUrl: botRes.actionUrl }])
    if (!overrideText) setInput('')
  }

  return (
    <div className="fixed bottom-20 end-5 z-40">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl hover:bg-emerald-700 transition-all ring-4 ring-emerald-500/20"
        >
          <IconWhatsApp size={18} />
          <span>WhatsApp Bot Assistant</span>
        </button>
      ) : (
        <Card className="w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col h-96">
          <div className="flex items-center justify-between border-b border-border bg-emerald-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <IconWhatsApp size={18} />
              <div>
                <h4 className="font-display text-xs font-bold">{clinicName} Bot</h4>
                <p className="text-[10px] text-emerald-100">Live Automated WhatsApp Assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-emerald-100 hover:bg-emerald-800 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-canvas/60 text-xs">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-card border border-border text-ink rounded-bl-none shadow-2xs'
                  }`}
                >
                  {m.text}
                  {m.actionUrl && (
                    <a
                      href={m.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors"
                    >
                      Open PDF / URL 🔗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-border/80 bg-card space-y-2">
            <div className="flex items-center gap-1 overflow-x-auto text-[10px] pb-1">
              <button
                type="button"
                onClick={() => send('TOKEN')}
                className="rounded-full bg-secondary px-2.5 py-0.5 font-bold text-primary hover:bg-primary hover:text-white shrink-0"
              >
                # TOKEN
              </button>
              <button
                type="button"
                onClick={() => send('RX')}
                className="rounded-full bg-secondary px-2.5 py-0.5 font-bold text-primary hover:bg-primary hover:text-white shrink-0"
              >
                📄 RX PDF
              </button>
              <button
                type="button"
                onClick={() => send('BOOK')}
                className="rounded-full bg-secondary px-2.5 py-0.5 font-bold text-primary hover:bg-primary hover:text-white shrink-0"
              >
                📅 BOOK
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Type TOKEN, RX, or BOOK..."
                className={`${inputClass} text-xs py-1.5`}
              />
              <button
                type="button"
                onClick={() => send()}
                className={`${btnPrimary} py-1.5 px-3 text-xs`}
              >
                Send
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
