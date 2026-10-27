'use client'

import { useState, useEffect } from 'react'

const LANGUAGES = [
  { code: 'en-IN', label: 'English (IN)' },
  { code: 'ml-IN', label: 'മലയാളം' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'ta-IN', label: 'தமிழ்' },
]

export function VoiceDictationBar({
  onTranscript,
  label = 'Dictate',
}: {
  onTranscript: (text: string) => void
  label?: string
}) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const [lang, setLang] = useState('en-IN')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) setSupported(true)
    }
  }, [])

  const toggleListening = () => {
    if (!supported) return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = lang

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      if (transcript) {
        onTranscript(transcript)
      }
    }

    if (listening) {
      recognition.stop()
      setListening(false)
    } else {
      recognition.start()
    }
  }

  if (!supported) return null

  return (
    <div className="inline-flex items-center gap-1">
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-ink"
        title="Select dictation language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={toggleListening}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
          listening
            ? 'bg-red-500 text-white ring-4 ring-red-200 animate-pulse'
            : 'bg-secondary text-primary hover:bg-primary hover:text-white'
        }`}
        title="Dictate notes with voice speech recognition"
      >
        <span>🎤</span>
        <span>{listening ? 'Listening...' : label}</span>
      </button>
    </div>
  )
}
