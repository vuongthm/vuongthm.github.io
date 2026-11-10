import { describe, expect, it } from "vitest"
import { englishFields, englishNames, localeName } from "./english-names.mjs"
describe("English Vietnamese place names", () => {
  it("uses English spellings while preserving literal links and code", () => {
    expect(englishNames("Trần Hoàng Minh Vương")).toBe("Tran Hoang Minh Vuong")
    expect(englishNames("Built with Đặng Quang Vinh and Nguyễn Việt Tín.")).toBe(
      "Built with Dang Quang Vinh and Nguyen Viet Tin.",
    )
    expect(englishNames("From Đại Lãnh, Khánh Hòa to Đà Nẵng.")).toBe(
      "From Dai Lanh, Khanh Hoa to Da Nang.",
    )
    expect(englishNames("[Đà Nẵng](/Đà-Nẵng/) and `Đà Nẵng` https://example.com/ĐàNẵng")).toBe(
      "[Da Nang](/Đà-Nẵng/) and `Đà Nẵng` https://example.com/ĐàNẵng",
    )
  })
  it("normalizes only English prose fields, preserving Vietnamese, URL fields and input objects", () => {
    const input = {
      title: { vi: "Đà Nẵng", en: "Arriving in Đà Nẵng" },
      locale: "en",
      body: "A day in Đại Lãnh.",
      href: "/Đà-Nẵng/",
    }
    expect(englishFields(input)).toEqual({
      title: { vi: "Đà Nẵng", en: "Arriving in Da Nang" },
      locale: "en",
      body: "A day in Dai Lanh.",
      href: "/Đà-Nẵng/",
    })
    expect(input.title.en).toBe("Arriving in Đà Nẵng")
    expect(localeName("Thành phố Huế", "en")).toBe("Thanh pho Hue")
    expect(localeName("Đà Nẵng", "vi")).toBe("Đà Nẵng")
  })
})
