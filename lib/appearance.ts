export const paletteIds = ["spring", "summer", "autumn", "winter"] as const
export type Palette = (typeof paletteIds)[number]
export const paletteStorageKey = "vuong:palette"
const previousPalettes: Record<string, Palette> = {
  tide: "winter",
  sunny: "summer",
  amber: "autumn",
  cedar: "spring",
  jade: "spring",
  clay: "autumn",
}
export const validPalette = (value: unknown): value is Palette =>
  paletteIds.includes(value as Palette)
export function paletteFor(value: unknown): Palette {
  if (validPalette(value)) return value
  const previous = typeof value === "string" ? previousPalettes[value] : undefined
  return validPalette(previous) ? previous : "winter"
}
export function currentPalette(): Palette {
  return typeof document === "undefined"
    ? "winter"
    : paletteFor(document.documentElement.dataset.palette)
}
export function subscribePalette(callback: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key !== paletteStorageKey && event.key !== null) return
    document.documentElement.dataset.palette = paletteFor(event.newValue)
    callback()
  }
  window.addEventListener("vuong:palette", callback)
  window.addEventListener("storage", storage)
  return () => {
    window.removeEventListener("vuong:palette", callback)
    window.removeEventListener("storage", storage)
  }
}
export function setPalette(value: Palette) {
  document.documentElement.dataset.palette = value
  try {
    localStorage.setItem(paletteStorageKey, value)
  } catch {
    /* Session-only without browser storage. */
  }
  window.dispatchEvent(new Event("vuong:palette"))
}
export const paletteBootstrap = `try{var p=localStorage.getItem(${JSON.stringify(paletteStorageKey)});p=(${JSON.stringify(previousPalettes)})[p]||p;document.documentElement.dataset.palette=${JSON.stringify(paletteIds)}.includes(p)?p:"winter"}catch{document.documentElement.dataset.palette="winter"}`
