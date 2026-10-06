'use client'

import { useState, useEffect } from 'react'

export function VoiceDictationBar({
  onTranscript,
  label = 'Dictate',
}: {
  onTranscript: (text: string) => void
  label?: string
}) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)

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
    recognition.lang = 'en-IN'

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
  )
}
