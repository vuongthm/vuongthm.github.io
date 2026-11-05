import japanese from "./ja-copy.json"
import source from "./zh-copy.json"
const chinese: Record<keyof typeof japanese, string> = source

/** Localized editorial copy; navigation and shared controls use messages(). */
export function copy(locale: string, vi: string, en: keyof typeof japanese): string {
  if (locale === "vi") return vi
  if (locale === "ja") return japanese[en]
  if (locale === "zh") return chinese[en]
  return en
}
