import { describe, expect, it } from "vitest"
import { activeLyric, clockTime, parseLyrics } from "./lyrics"
describe("music lyrics", () => {
  it("parses repeated timestamps, decimal precision and chronological order", () => {
    const lines = parseLyrics("[ar:Sample]\n[00:20.250][01:05.5]Second verse\n[00:02.03]First line")
    expect(lines).toEqual([
      { at: 2.03, text: "First line" },
      { at: 20.25, text: "Second verse" },
      { at: 65.5, text: "Second verse" },
    ])
    expect(activeLyric(lines, 0)).toBe(-1)
    expect(activeLyric(lines, 20.3)).toBe(1)
    expect(activeLyric(lines, 999)).toBe(2)
  })
  it("preserves untimed lyrics without inventing synchronization", () => {
    const lines = parseLyrics("\uFEFF[ti:Sample]\r\nA first line\r\n\r\nA second line")
    expect(lines).toEqual([
      { at: null, text: "A first line" },
      { at: null, text: "A second line" },
    ])
    expect(activeLyric(lines, 10)).toBe(-1)
  })
  it("ignores metadata and handles empty lyrics and media times", () => {
    expect(parseLyrics("[ar:Someone]\n[al:Album]\n")).toEqual([])
    expect(clockTime(NaN)).toBe("0:00")
    expect(clockTime(-2)).toBe("0:00")
    expect(clockTime(307.9)).toBe("5:07")
  })
  it("applies signed millisecond offsets to line and word timestamps", () => {
    const lines = parseLyrics("\uFEFF[offset:+500]\n[00:02.00]<00:02.00>Sample <00:03.25>words")
    expect(lines).toEqual([
      {
        at: 1.5,
        text: "Sample words",
        words: [
          { at: 1.5, text: "Sample " },
          { at: 2.75, text: "words" },
        ],
      },
    ])
    expect(parseLyrics("[offset:-1000]\n[00:01]Later")[0].at).toBe(2)
    expect(parseLyrics("[offset:2000]\n[00:01]Earlier")[0].at).toBe(0)
  })
  it("keeps timed instrumental breaks so the previous lyric stops being active", () => {
    const lines = parseLyrics("[00:00]A synthetic line\n[00:03]\n[00:08]Another synthetic line")
    expect(lines[activeLyric(lines, 5)].text).toBe("")
    expect(lines[activeLyric(lines, 9)].text).toBe("Another synthetic line")
  })
  it("shifts enhanced word timestamps when a timed line is repeated", () => {
    const lines = parseLyrics("[00:01][00:11]<00:01>First <00:02>second")
    expect(lines[1].words?.map((word) => word.at)).toEqual([11, 12])
  })
})

it("ignores standard author-editable LRC headers without rendering them as lyric lines", () => {
  const lines = parseLyrics(
    "[ti:An example song]\n[ar:Example artist]\n[al:Personal collection]\n[by:vuong.]\n[offset:0]\n\n[00:03.50]A supplied line\n[00:08.00]Another supplied line",
  )
  expect(lines).toEqual([
    { at: 3.5, text: "A supplied line" },
    { at: 8, text: "Another supplied line" },
  ])
})
