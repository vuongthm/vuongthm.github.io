import { describe, expect, it } from "vitest"
import { filterFriends, type Friend } from "./directory"
import { searchText } from "@/lib/collections/search"
const friends: Friend[] = [
  {
    id: "one",
    name: "Đặng Văn An",
    alias: "first",
    website: "https://one.example",
    initials: "DA",
    topics: ["Security"],
    description: { vi: "", en: "", ja: "", zh: "" },
  },
  {
    id: "two",
    name: "Nguyễn Việt Tín",
    alias: "second",
    website: "https://two.example",
    initials: "NT",
    topics: ["Cloud"],
    description: { vi: "", en: "", ja: "", zh: "" },
  },
]
describe("friends directory", () => {
  it("finds Vietnamese names without accents and accepts aliases and domains", () => {
    expect(searchText(" ĐẶNG ")).toBe("dang")
    expect(
      filterFriends(friends, "dang van", "", "original", "vi").map((friend) => friend.id),
    ).toEqual(["one"])
    expect(
      filterFriends(friends, "VIET TIN", "", "original", "vi").map((friend) => friend.id),
    ).toEqual(["two"])
    expect(filterFriends(friends, "second", "", "original", "vi")).toHaveLength(1)
    expect(filterFriends(friends, "one.example", "", "original", "vi")).toHaveLength(1)
  })
  it("combines search and topic filtering without changing source order", () => {
    expect(filterFriends(friends, "dang", "Cloud", "az", "vi")).toHaveLength(0)
    expect(filterFriends(friends, "", "Cloud", "za", "vi").map((friend) => friend.id)).toEqual([
      "two",
    ])
    expect(filterFriends(friends, "", "", "za", "vi").map((friend) => friend.id)).toEqual([
      "two",
      "one",
    ])
    expect(friends.map((friend) => friend.id)).toEqual(["one", "two"])
  })
})
