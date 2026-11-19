'use client'

import { useState, useEffect } from 'react'
import { playHospitalChime } from '@/lib/audioChime'

export function QueueAudioAnnouncer({
  tokenNumber,
  patientName,
  doctorName,
  priority,
}: {
  tokenNumber?: string | null
  patientName?: string | null
  doctorName?: string | null
  priority?: 'normal' | 'urgent' | 'emergency' | null
}) {
  const [enabled, setEnabled] = useState(false)
  const [lang, setLang] = useState<'en' | 'hi' | 'ml'>('en')

  useEffect(() => {
    if (!enabled || !tokenNumber || typeof window === 'undefined' || !('speechSynthesis' in window)) return

    const speak = async () => {
      // 1. Play offline 2-tone hospital reception bell chime first
      await playHospitalChime().catch(() => {})

      let text = ''
      let langCode = 'en-IN'

      const isEmergency = priority === 'emergency'
      const isUrgent = priority === 'urgent'

      if (lang === 'hi') {
        langCode = 'hi-IN'
        const prefix = isEmergency ? 'ध्यान दें! आपातकालीन ध्यान दें! ' : isUrgent ? 'प्राथमिकता टोकन! ' : ''
        text = `${prefix}टोकन नंबर ${tokenNumber}, ${patientName || 'मरीज़'}, कृपया ${doctorName || 'डॉक्टर कक्ष'} में जाएं।`
      } else if (lang === 'ml') {
        langCode = 'ml-IN'
        const prefix = isEmergency ? 'അടിയന്തര ശ്രദ്ധ! ' : isUrgent ? 'മുൻഗണന ടോക്കൺ! ' : ''
        text = `${prefix}ടോക്കൺ നമ്പർ ${tokenNumber}, ${patientName || 'രോഗി'}, ${doctorName || 'ഡോക്ടറുടെ മുറിയിലേക്ക്'} പോകുക.`
      } else {
        langCode = 'en-IN'
        const prefix = isEmergency ? 'Emergency Priority! ' : isUrgent ? 'Urgent Priority! ' : ''
        text = `${prefix}Token ${tokenNumber}, ${patientName || 'Patient'}, please proceed to ${doctorName || 'Doctor room'}.`
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = langCode
      utterance.rate = isEmergency ? 1.0 : 0.9
      utterance.pitch = isEmergency ? 1.2 : 1

      // Select matching accent voice if available
      const voices = window.speechSynthesis.getVoices()
      const matchedVoice = voices.find((v) => v.lang.startsWith(langCode) || v.lang.includes(langCode))
      if (matchedVoice) utterance.voice = matchedVoice

      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    }

    speak()
  }, [enabled, lang, tokenNumber, patientName, doctorName, priority])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setEnabled((e) => !e)}
        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
          enabled
            ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-400/40'
            : 'bg-white/10 text-white/70 hover:bg-white/20'
        }`}
      >
        {enabled ? '🔊 Voice Callouts Active' : '🔇 Enable OPD Voice Callouts'}
      </button>

      {enabled && (
        <div className="inline-flex rounded-full bg-white/10 p-0.5 border border-white/10">
          {(
            [
              { key: 'en', label: 'English 🇬🇧' },
              { key: 'hi', label: 'Hindi 🇮🇳' },
              { key: 'ml', label: 'Malayalam 🇮🇳' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setLang(item.key)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                lang === item.key
                  ? 'bg-white text-ink shadow-2xs'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
