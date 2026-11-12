import { describe, expect, it } from "vitest"
import { lockDocumentScroll } from "./use-scroll-lock"
describe("overlapping navigation and dialogs", () => {
  it("keeps scrolling locked until both layers close, then restores the original style", () => {
    const doc = {
      body: { style: { overflow: "clip" } },
      documentElement: { style: { overflow: "auto" } },
    } as Document
    const menu = lockDocumentScroll(doc),
      dialog = lockDocumentScroll(doc)
    menu()
    expect(doc.body.style.overflow).toBe("hidden")
    menu()
    expect(doc.body.style.overflow).toBe("hidden")
    dialog()
    expect(doc.body.style.overflow).toBe("clip")
    expect(doc.documentElement.style.overflow).toBe("auto")
  })
})
