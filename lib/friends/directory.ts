import type { Locale } from "@/lib/i18n/config"
import { searchText } from "@/lib/collections/search"
export interface Friend {
  id: string
  name: string
  alias: string
  website: string
  websitePlaceholder?: boolean
  avatar?: string
  avatarSource?: string
  initials: string
  topics: string[]
  description: Record<Locale, string>
}
export function filterFriends<T extends Friend>(
  friends: T[],
  query: string,
  topic: string,
  sort: string,
  locale: Locale,
) {
  const needle = searchText(query)
  const result = friends.filter(
    (friend) =>
      (!topic || friend.topics.includes(topic)) &&
      searchText(
        `${friend.name} ${friend.alias} ${friend.website} ${friend.topics.join(" ")}`,
      ).includes(needle),
  )
  if (sort !== "original")
    result.sort((a, b) => a.name.localeCompare(b.name, locale) * (sort === "za" ? -1 : 1))
  return result
}
