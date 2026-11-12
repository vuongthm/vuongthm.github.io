import { describe, expect, it } from "vitest"
import { paletteFor, validPalette } from "./appearance"
describe("saved palette migration", () => {
  it("keeps existing readers on the replacement for their saved palette", () => {
    expect(paletteFor("cedar")).toBe("spring")
    expect(paletteFor("jade")).toBe("spring")
    expect(paletteFor("clay")).toBe("autumn")
    expect(paletteFor("tide")).toBe("winter")
    expect(paletteFor("sunny")).toBe("summer")
    expect(paletteFor("amber")).toBe("autumn")
  })
  it("falls back safely for missing or unknown stored values", () => {
    expect(paletteFor(null)).toBe("winter")
    expect(paletteFor("unknown")).toBe("winter")
    expect(paletteFor("__proto__")).toBe("winter")
    expect(validPalette("summer")).toBe(true)
    expect(validPalette("cedar")).toBe(false)
    expect(validPalette("jade")).toBe(false)
  })
})
