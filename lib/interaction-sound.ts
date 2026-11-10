export type Sound =
  "tap" | "open" | "tick" | "key" | "switch" | "select" | "success" | "dismiss" | "page" | "lock"
const preference = "vuong:interaction-sounds"
const change = "vuong:sound-change"
let context: AudioContext | undefined
let lastTap = 0
let lastKey = 0
let memoryPreference: boolean | undefined

export function soundEnabled() {
  if (memoryPreference !== undefined) return memoryPreference
  try {
    return localStorage.getItem(preference) !== "off"
  } catch {
    return true
  }
}
export function subscribeSound(listener: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key !== preference && event.key !== null) return
    memoryPreference = undefined
    listener()
  }
  window.addEventListener(change, listener)
  window.addEventListener("storage", storage)
  return () => {
    window.removeEventListener(change, listener)
    window.removeEventListener("storage", storage)
  }
}
export function setSoundEnabled(enabled: boolean) {
  memoryPreference = enabled
  try {
    localStorage.setItem(preference, enabled ? "on" : "off")
  } catch {
    /* Private browsing. */
  }
  window.dispatchEvent(new Event(change))
}
export function unlockSound() {
  if (!soundEnabled()) return
  try {
    context ??= new AudioContext()
    if (context.state === "suspended") void context.resume().catch(() => {})
  } catch {
    /* Sound is an enhancement; unsupported browsers stay quiet. */
  }
}

/** Short, softly enveloped notes generated locally; no audio downloads or tracking. */
export function playSound(kind: Sound, step = 0) {
  if (!soundEnabled() || !context || document.hidden) return
  if (context.state !== "running") {
    // The first click can arrive before the audio device finishes waking up.
    const audio = context
    if (audio.state === "suspended" && navigator.userActivation?.hasBeenActive)
      void audio
        .resume()
        .then(() => {
          if (audio.state === "running") playSound(kind, step)
        })
        .catch(() => {})
    return
  }
  const now = performance.now()
  if (kind === "key") {
    if (now - lastKey < 45) return
    lastKey = now
    // A cushioned switch: low case resonance, a filtered contact and a quiet release.
    const start = context.currentTime,
      duration = 0.105
    const buffer = context.createBuffer(
      1,
      Math.ceil(context.sampleRate * duration),
      context.sampleRate,
    )
    const samples = buffer.getChannelData(0)
    const variation = 0.94 + Math.random() * 0.12
    for (let index = 0; index < samples.length; index++) {
      const time = index / context.sampleRate
      const attack = Math.min(1, time / 0.0015)
      const contact = Math.exp(-time / 0.009)
      const release = time > 0.047 ? Math.exp(-(time - 0.047) / 0.008) * 0.18 : 0
      samples[index] = (Math.random() * 2 - 1) * attack * (contact + release)
    }
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain()
    source.buffer = buffer
    filter.type = "lowpass"
    filter.frequency.value = 1550 * variation
    filter.Q.value = 0.65
    gain.gain.value = 0.19
    source.connect(filter).connect(gain).connect(context.destination)
    source.start(start)
    source.onended = () => {
      source.disconnect()
      filter.disconnect()
      gain.disconnect()
    }
    for (const [frequency, volume, decay] of [
      [215, 0.105, 0.046],
      [520, 0.025, 0.021],
    ]) {
      const body = context.createOscillator(),
        envelope = context.createGain()
      body.type = "sine"
      body.frequency.setValueAtTime(frequency * variation, start)
      body.frequency.exponentialRampToValueAtTime(frequency * 0.68 * variation, start + decay)
      envelope.gain.setValueAtTime(0, start)
      envelope.gain.linearRampToValueAtTime(volume, start + 0.002)
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + decay)
      body.connect(envelope).connect(context.destination)
      body.start(start)
      body.stop(start + decay + 0.005)
      body.onended = () => {
        body.disconnect()
        envelope.disconnect()
      }
    }
    return
  }
  if (kind === "tick") {
    const oscillator = context.createOscillator(),
      gain = context.createGain()
    oscillator.type = "triangle"
    oscillator.frequency.value = 1180 + step * 150
    gain.gain.setValueAtTime(0.06, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.026)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.03)
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
    }
    return
  }
  if (now - lastTap < 65) return
  lastTap = now
  const tones = {
    tap: [
      [420, 0, 0.075, 0.14],
      [840, 0.005, 0.045, 0.035],
    ],
    open: [
      [523.25, 0, 0.085, 0.12],
      [783.99, 0.025, 0.095, 0.065],
      [1046.5, 0.042, 0.07, 0.025],
    ],
    switch: [
      [660, 0, 0.07, 0.08],
      [990, 0.028, 0.095, 0.045],
    ],
    select: [
      [740, 0, 0.055, 0.075],
      [1110, 0.012, 0.04, 0.025],
    ],
    success: [
      [523.25, 0, 0.1, 0.075],
      [659.25, 0.065, 0.12, 0.065],
      [1046.5, 0.13, 0.18, 0.055],
    ],
    dismiss: [
      [530, 0, 0.05, 0.055],
      [350, 0.024, 0.07, 0.04],
    ],
    page: [
      [620, 0, 0.06, 0.075],
      [930, 0.023, 0.085, 0.035],
    ],
    lock: [
      [300, 0, 0.06, 0.08],
      [180, 0.02, 0.08, 0.045],
    ],
  }[kind]
  for (const [frequency, delay, duration, volume] of tones) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const start = context.currentTime + delay
    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(frequency, start)
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.88, start + duration)
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(volume, start + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.01)
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
    }
  }
}
