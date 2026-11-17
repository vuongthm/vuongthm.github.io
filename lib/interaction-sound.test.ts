import { afterEach, describe, expect, it, vi } from "vitest"
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
async function setup() {
  vi.resetModules()
  const values = new Map<string, string>(),
    oscillators: ReturnType<typeof node>[] = [],
    gains: ReturnType<typeof gain>[] = []
  let clock = 1000,
    created = 0
  const parameter = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    setTargetAtTime: vi.fn(),
  })
  function node() {
    return {
      connect: (target: unknown) => target,
      disconnect: vi.fn(),
      frequency: parameter(),
      start: vi.fn(),
      stop: vi.fn(),
      type: "sine",
      onended: null,
    }
  }
  function gain() {
    return { connect: (target: unknown) => target, disconnect: vi.fn(), gain: parameter() }
  }
  class FakeAudioContext {
    state = "running"
    currentTime = 1
    destination = {}
    sampleRate = 48000
    constructor() {
      created++
    }
    createGain() {
      const g = gain()
      gains.push(g)
      return g
    }
    createOscillator() {
      const n = node()
      oscillators.push(n)
      return n
    }
    resume() {
      return Promise.resolve()
    }
  }
  const window = new EventTarget()
  vi.stubGlobal("window", window)
  vi.stubGlobal("document", { hidden: false })
  vi.stubGlobal("navigator", { userActivation: { hasBeenActive: true } })
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  })
  vi.stubGlobal("performance", { now: () => clock })
  vi.stubGlobal("AudioContext", FakeAudioContext)
  const sound = await import("./interaction-sound")
  return {
    sound,
    values,
    oscillators,
    gains,
    window,
    created: () => created,
    advance: () => {
      clock += 100
    },
  }
}
describe("purposeful interaction sounds", () => {
  it("stays silent until unlocked, distinguishes on/off and keeps press feedback separate", async () => {
    const f = await setup()
    f.sound.playSound("tap")
    expect(f.created()).toBe(0)
    f.sound.unlockSound()
    expect(f.created()).toBe(1)
    f.sound.playSound("press")
    f.sound.playSound("toggle-on")
    expect(f.oscillators).toHaveLength(3)
    expect(f.oscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(560, 1)
    f.advance()
    f.sound.playSound("toggle-off")
    expect(f.oscillators[3].frequency.setValueAtTime).toHaveBeenCalledWith(470, 1)
  })
  it("mutes the shared output immediately and honors persistent or cross-tab preferences", async () => {
    const f = await setup()
    f.sound.unlockSound()
    f.sound.playSound("open")
    f.sound.setSoundEnabled(false)
    expect(f.values.get("vuong:interaction-sounds")).toBe("off")
    expect(f.gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 1, 0.008)
    const count = f.oscillators.length
    f.advance()
    f.sound.playSound("success")
    expect(f.oscillators).toHaveLength(count)
    f.sound.setSoundEnabled(true)
    expect(f.sound.soundEnabled()).toBe(true)
    const listener = vi.fn(),
      stop = f.sound.subscribeSound(listener)
    f.values.set("vuong:interaction-sounds", "off")
    const event = new Event("storage")
    Object.defineProperty(event, "key", { value: "vuong:interaction-sounds" })
    f.window.dispatchEvent(event)
    expect(f.sound.soundEnabled()).toBe(false)
    expect(listener).toHaveBeenCalledOnce()
    stop()
  })
})
