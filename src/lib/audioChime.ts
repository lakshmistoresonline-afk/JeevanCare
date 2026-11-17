// Web Audio API Synthesized Hospital Reception Chime (100% Offline, 0ms Latency)

export function playHospitalChime(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve()

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return resolve()

      const ctx = new AudioCtx()

      // Tone 1: C5 (523.25 Hz)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime)
      gain1.gain.setValueAtTime(0.3, ctx.currentTime)
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)

      // Tone 2: E5 (659.25 Hz) after 0.25 seconds delay
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.25)
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.25)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.95)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)

      osc1.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 0.6)

      osc2.start(ctx.currentTime + 0.25)
      osc2.stop(ctx.currentTime + 0.95)

      setTimeout(() => {
        ctx.close().catch(() => {})
        resolve()
      }, 1000)
    } catch {
      resolve()
    }
  })
}
