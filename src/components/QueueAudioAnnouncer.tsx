'use client'

import { useState, useEffect } from 'react'

export function QueueAudioAnnouncer({
  tokenNumber,
  patientName,
  doctorName,
}: {
  tokenNumber?: string | null
  patientName?: string | null
  doctorName?: string | null
}) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!enabled || !tokenNumber || typeof window === 'undefined') return

    const speak = () => {
      const text = `Token ${tokenNumber}, ${patientName || 'Patient'}, please proceed to ${doctorName || 'Doctor room'}.`
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    }

    speak()
  }, [enabled, tokenNumber, patientName, doctorName])

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setEnabled((e) => !e)}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
          enabled
            ? 'bg-emerald-500 text-white shadow-sm'
            : 'bg-white/10 text-white/70 hover:bg-white/20'
        }`}
      >
        {enabled ? '🔊 Voice Callouts Active' : '🔇 Enable Voice Callouts'}
      </button>
    </div>
  )
}
