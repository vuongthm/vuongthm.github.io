import { parse } from "yaml"
export function frontmatter(raw, file = "content") {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*/)
  if (!match) throw new Error(`${file}: frontmatter is required`)
  const data = parse(match[1])
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error(`${file}: invalid metadata`)
  if (typeof data.title !== "string" || !data.title.trim())
    throw new Error(`${file}: title is required`)
  return {
    data,
    body: raw
      .slice(match[0].length)
      .replace(/^# .+\r?\n+/, "")
      .trim(),
  }
}
export function normalizeDate(value, file) {
  const text = String(value ?? "").trim()
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!match) throw new Error(`${file}: a YYYY-MM-DD date is required`)
  const date = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
  if (Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)
    throw new Error(`${file}: invalid date`)
  return date
}
export function assertUnique(entries) {
  const identities = new Set(),
    routes = new Set()
  for (const entry of entries) {
    const key = `${entry.locale}:${entry.id}`
    if (identities.has(key) || routes.has(entry.href))
      throw new Error(`Duplicate content identity or URL: ${key} (${entry.href})`)
    identities.add(key)
    routes.add(entry.href)
    if (entry.encrypted && !entry.body.startsWith("v2:"))
      throw new Error(`Unencrypted private payload: ${entry.id}`)
  }
}
export function hasLock(data) {
  return (
    data.lock === true ||
    data.lock === "true" ||
    data.locked === true ||
    data.locked === "true" ||
    data.visibility === "encrypted"
  )
}
export function publishPolicy(data, policy, password, file) {
  if (data.lock !== undefined && ![true, false, "true", "false"].includes(data.lock))
    throw new Error(`${file}: lock must be true or false`)

  if (data.status === "draft" || data.visibility === "private") return "exclude"
  if (hasLock(data)) {
    if (data.lock !== true && data.lock !== "true" && policy === "exclude") return "exclude"
    if (!password)
      throw new Error(
        `${file}: locked content requires a password. Configure a per-document key in CONTENT_PASSWORDS in the website build environment.`,
      )
    return "encrypt"
  }
  return "public"
}
