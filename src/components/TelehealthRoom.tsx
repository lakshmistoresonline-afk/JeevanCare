'use client'

import { useState } from 'react'
import { Card, btnPrimary } from './primitives'
import { IconStethoscope } from './icons'
import { toast } from 'sonner'

export function TelehealthRoom({
  appointmentId,
  patientName,
  doctorName,
}: {
  appointmentId: string
  patientName: string
  doctorName: string
}) {
  const [inCall, setInCall] = useState(false)
  const [micMuted, setMicMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)

  const startCall = () => {
    setInCall(true)
    toast.success('Secure telehealth video session connected.')
  }

  const endCall = () => {
    setInCall(false)
    toast.info('Telehealth session ended.')
  }

  return (
    <Card className="p-6 border-border/80 bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <IconStethoscope size={16} />
          </span>
          <div>
            <h3 className="font-display text-sm font-bold text-ink">Virtual Telehealth Consultation</h3>
            <p className="text-xs text-muted-foreground">End-to-end encrypted video link for appointment #{appointmentId.slice(-6)}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${inCall ? 'bg-primary text-white animate-pulse' : 'bg-secondary text-primary'}`}>
          {inCall ? '● Live Session' : 'Ready'}
        </span>
      </div>

      {!inCall ? (
        <div className="rounded-2xl border border-border bg-canvas p-8 text-center space-y-4">
          <div className="size-16 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto text-2xl font-bold">
            📹
          </div>
          <div>
            <h4 className="font-display text-base font-bold text-ink">Ready to meet {patientName}?</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Secure WebRTC video room connecting Dr. {doctorName} with patient {patientName}.
            </p>
          </div>
          <button type="button" onClick={startCall} className={btnPrimary}>
            Start Video Consultation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-video w-full rounded-2xl bg-sidebar overflow-hidden flex items-center justify-center border border-border shadow-lg">
            {/* Simulated Remote Video Stream */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 bg-gradient-to-b from-black/40 via-transparent to-black/60">
              <span className="text-4xl mb-2">👤</span>
              <span className="font-display text-lg font-bold text-white">{patientName}</span>
              <span className="text-xs text-white/70 mt-0.5">Secure Peer-to-Peer Stream (Encrypted)</span>
            </div>

            {/* Picture-in-Picture Local Video */}
            <div className="absolute bottom-4 end-4 w-32 aspect-video rounded-xl bg-card border border-border/80 shadow-md flex items-center justify-center text-xs font-bold text-ink">
              {camOff ? 'Camera Off' : `Dr. ${doctorName}`}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setMicMuted((m) => !m)}
              className={`rounded-xl px-4 py-2 text-xs font-bold border transition-colors ${
                micMuted ? 'border-red/40 bg-red-soft text-red' : 'border-border bg-card text-ink hover:border-primary'
              }`}
            >
              {micMuted ? 'Unmute Mic 🎤' : 'Mute Mic 🎤'}
            </button>
            <button
              type="button"
              onClick={() => setCamOff((c) => !c)}
              className={`rounded-xl px-4 py-2 text-xs font-bold border transition-colors ${
                camOff ? 'border-red/40 bg-red-soft text-red' : 'border-border bg-card text-ink hover:border-primary'
              }`}
            >
              {camOff ? 'Start Camera 📹' : 'Stop Camera 📹'}
            </button>
            <button
              type="button"
              onClick={endCall}
              className="rounded-xl bg-red px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-red/90 transition-colors"
            >
              End Call
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
