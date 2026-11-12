/** English spellings for Vietnamese names in prose; keep literal code and links intact. */
const names = new Map([
  ["Trần Hoàng Minh Vương", "Tran Hoang Minh Vuong"],
  ["Đặng Quang Vinh", "Dang Quang Vinh"],
  ["Nguyễn Việt Tín", "Nguyen Viet Tin"],
  ["Diệp Mạnh Tuấn", "Diep Manh Tuan"],
  ["Thành phố Hồ Chí Minh", "Ho Chi Minh City"],
  ["Thừa Thiên Huế", "Thua Thien Hue"],
  ["Hồ Chí Minh", "Ho Chi Minh"],
  ["Đà Nẵng", "Da Nang"],
  ["Đại Lãnh", "Dai Lanh"],
  ["Khánh Hòa", "Khanh Hoa"],
  ["Khánh Hoà", "Khanh Hoa"],
  ["Hà Nội", "Hanoi"],
  ["Việt Nam", "Vietnam"],
  ["Huế", "Hue"],
  ["Thái", "Thai"],
  ["Trình", "Trinh"],
])
/** @param {string} text */
function prose(text) {
  for (const [name, english] of names) text = text.replaceAll(name, english)
  return text
}
/** @param {string} text */
export function englishNames(text) {
  const literal = /```[\s\S]*?```|`[^`]*`|https?:\/\/[^\s)]+|!?\[([^\]]*)\]\(([^)]+)\)/g
  let result = "",
    cursor = 0
  for (const match of text.matchAll(literal)) {
    result += prose(text.slice(cursor, match.index))
    result += match[1] === undefined ? match[0] : match[0].replace(match[1], prose(match[1]))
    cursor = match.index + match[0].length
  }
  return result + prose(text.slice(cursor))
}
/** A proper-name field (e.g. IP city, photograph place or a person's name).
 * @param {string} value
 * @param {string} locale
 */
export function localeName(value, locale) {
  return locale === "en"
    ? value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/Đ/g, "D")
        .replace(/đ/g, "d")
    : value
}
/** Normalize only explicitly English translated fields; leave URLs and other locales unchanged.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function englishFields(value) {
  if (Array.isArray(value)) return /** @type {T} */ (value.map(englishFields))
  if (!value || typeof value !== "object") return value
  const english = value.locale === "en"
  return /** @type {T} */ (
    Object.fromEntries(
      Object.entries(value).map(([key, text]) => [
        key,
        typeof text === "string" &&
        (key === "en" ||
          (english && ["title", "summary", "body", "description", "excerpt"].includes(key)))
          ? englishNames(text)
          : englishFields(text),
      ]),
    )
  )
}
