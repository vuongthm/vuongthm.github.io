import Fuse from "fuse.js"
import type { EntryMeta } from "./types"
import type { Locale } from "@/lib/i18n/config"
import { searchText } from "@/lib/collections/search"

export function noteSearch(entries: EntryMeta[], locale: Locale) {
  const index = new Fuse(
    entries.map((entry) => ({
      entry,
      title: searchText(entry.title),
      summary: searchText(entry.summary ?? ""),
      tags: (entry.tags ?? []).map(searchText),
      topics: entry.topics.map(searchText),
      moduleTitle: searchText(entry.contentModule?.title[locale] ?? ""),
    })),
    {
      keys: [{ name: "title", weight: 3 }, "summary", "tags", "topics", "moduleTitle"],
      threshold: 0.35,
      ignoreLocation: true,
      ignoreDiacritics: true,
    },
  )
  return {
    search: (query: string) =>
      index.search(searchText(query)).map(({ item }) => ({ item: item.entry })),
  }
}
