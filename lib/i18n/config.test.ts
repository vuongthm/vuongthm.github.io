import { describe, expect, it } from "vitest"
import { isLocale, languageName } from "./config"

describe("language picker labels", () => {
  it("uses names from the current interface language", () => {
    expect(languageName("vi", "ja")).toBe("Tiếng Nhật")
    expect(languageName("en", "ja")).toBe("Japanese")
    expect(languageName("ja", "en")).toBe("英語")
    expect(languageName("zh", "ja")).toBe("日语")
    expect(languageName("en", "zh")).toBe("Chinese")
  })
  it("recognizes Chinese and rejects inherited object names", () => {
    expect(isLocale("zh")).toBe(true)
    expect(isLocale("constructor")).toBe(false)
  })
})
