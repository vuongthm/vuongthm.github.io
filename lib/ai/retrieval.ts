import type { SearchEntry } from "@/lib/content/types"
type Document = Pick<SearchEntry, "title" | "summary" | "topics" | "tags" | "excerpt">
const stopWords = new Set(
  "a an the is are does do how what where should can could would i you me my about explain please start work works toi minh ban cac mot nhung la nhu the nao gi de va voi cua cho tu dau nen hoc muon biet hay giai thich giup hoat dong bat dau ve co khi"
    .split(" ")
    .concat([
      "これ",
      "それ",
      "です",
      "ます",
      "どう",
      "何",
      "こと",
      "から",
      "について",
      "ください",
      "教えて",
    ]),
)
function normalized(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .normalize("NFC")
}
function words(text: string) {
  return new Set(
    [...new Intl.Segmenter("ja", { granularity: "word" }).segment(normalized(text))]
      .filter((item) => item.isWordLike)
      .map((item) => item.segment),
  )
}
export function retrieveSources<T extends Document>(documents: T[], query: string, limit = 4): T[] {
  let text = normalized(query)
  if (text.includes("mang may tinh")) text += " networking"
  if (text.includes("an toan thong tin") || text.includes("bao mat")) text += " security"
  if (text.includes("dam may") || text.includes("クラウド") || text.includes("云")) text += " cloud"
  if (text.includes("ネットワーク") || text.includes("网络")) text += " networking"
  if (text.includes("セキュリティ") || text.includes("安全")) text += " security"
  const tokens = [...words(text)].filter((token) => token.length >= 2 && !stopWords.has(token))
  if (!tokens.length) return []
  return documents
    .map((document) => {
      const title = words(document.title),
        metadata = words([...document.topics, ...document.tags].join(" ")),
        summary = words(document.summary),
        excerpt = words(document.excerpt)
      const score = tokens.reduce(
        (sum, token) =>
          sum +
          (title.has(token) ? 8 : 0) +
          (metadata.has(token) ? 10 : 0) +
          (summary.has(token) ? 4 : 0) +
          (excerpt.has(token) ? 1 : 0),
        0,
      )
      return { document, score }
    })
    .filter((result) => result.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => result.document)
}
