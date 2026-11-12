import { describe, expect, it } from "vitest"
import { learningProgress } from "./progress"
import type { EntryMeta, LearningPath } from "@/lib/content/types"

const entry = {
  id: "note",
  translationKey: "shared",
  href: "/vi/notes/shared/",
  slug: "shared",
  moduleId: "notes",
} as EntryMeta
const path = {
  sections: [
    {
      id: "one",
      steps: [
        { id: "planned", translationKey: "draft" },
        { id: "first", translationKey: "shared" },
        { id: "review", translationKey: "shared" },
      ],
    },
  ],
} as LearningPath
describe("learning progress", () => {
  it("keeps progress per step while reusing an article and skips unpublished lessons when resuming", () => {
    const result = learningProgress(
      path,
      [entry],
      JSON.stringify(["first", "first", "planned", "obsolete"]),
    )
    expect(result.total).toBe(3)
    expect(result.done).toBe(1)
    expect(result.next?.step.id).toBe("review")
    expect(result.next?.entry.href).toBe(entry.href)
  })
  it("recovers from corrupt storage and never offers a link to a draft", () => {
    for (const value of ["broken", "null", "{}", "[12,true]"])
      expect(learningProgress(path, [], value)).toMatchObject({
        total: 3,
        done: 0,
        next: undefined,
      })
    expect(learningProgress(path, [entry], "[]").next?.step.id).toBe("first")
  })
})
