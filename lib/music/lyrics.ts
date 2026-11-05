export interface LyricLine {
  at: number | null
  text: string
  words?: { at: number; text: string }[]
}
export function parseLyrics(source: string): LyricLine[] {
  const lines: LyricLine[] = []
  source = source.replace(/^\uFEFF/, "")
  const offset = Number(source.match(/^\[offset:([+-]?\d+)\]/im)?.[1] ?? 0) / 1000
  const seconds = (match: RegExpMatchArray) =>
    Math.max(0, Number(match[1]) * 60 + Number(match[2]) + Number(`0.${match[3] ?? 0}`) - offset)
  for (const raw of source.split(/\r?\n/)) {
    if (/^\[(?:ar|al|ti|by|offset|length):/i.test(raw)) continue
    const matches = [...raw.matchAll(/\[(\d{1,3}):([0-5]\d)(?:[.:](\d{1,3}))?\]/g)],
      text = raw
        .replace(/\[[^\]]+\]/g, "")
        .replace(/<\d{1,3}:[0-5]\d(?:[.:]\d{1,3})?>/g, "")
        .trim(),
      words = [...raw.matchAll(/<(\d{1,3}):([0-5]\d)(?:[.:](\d{1,3}))?>([^<]*)/g)].map((match) => ({
        at: seconds(match),
        text: match[4],
      }))
    if (!text && !matches.length) continue
    if (matches.length)
      for (const match of matches)
        lines.push({
          at: seconds(match),
          text,
          ...(words.length
            ? {
                words: words.map((word) => ({
                  ...word,
                  at: Math.max(0, word.at + seconds(match) - seconds(matches[0])),
                })),
              }
            : {}),
        })
    else lines.push({ at: null, text: raw.trim() })
  }
  return lines.some((line) => line.at !== null)
    ? lines.filter((line) => line.at !== null).sort((a, b) => a.at! - b.at!)
    : lines
}
export function activeLyric(lines: LyricLine[], time: number) {
  let low = 0,
    high = lines.length - 1,
    active = -1
  while (low <= high) {
    const middle = (low + high) >>> 1,
      at = lines[middle].at
    if (at === null) return -1
    if (at <= time) {
      active = middle
      low = middle + 1
    } else high = middle - 1
  }
  return active
}
export function clockTime(value: number) {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}
