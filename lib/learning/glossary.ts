import dictionary from "@/site/glossary.json"
import type { Locale } from "@/lib/i18n/config"
export interface GlossaryItem {
  id: string
  term: string
  aliases: string[]
  definition: Record<Locale, string>
}
export const glossary = dictionary as GlossaryItem[]
interface MarkdownNode {
  type: string
  value?: string
  url?: string
  children?: MarkdownNode[]
}
/** Annotate first mentions only; links, headings, code and image labels stay untouched. */
export function remarkGlossary() {
  return (tree: MarkdownNode) => {
    const seen = new Set<string>()
    const aliases = glossary
      .flatMap((item) => item.aliases.map((alias) => ({ alias, item })))
      .sort((a, b) => b.alias.length - a.alias.length)
    if (!aliases.length) return
    const special = "\\^$.*+?()[]{}|"
    const alternatives = aliases
      .map(({ alias }) =>
        Array.from(alias)
          .map((char) => (special.includes(char) ? "\\" + char : char))
          .join(""),
      )
      .join("|")
    const pattern = new RegExp(
      String.raw`(?<![\p{L}\p{N}_])(${alternatives})(?![\p{L}\p{N}_])`,
      "gu",
    )

    function visit(node: MarkdownNode) {
      if (
        [
          "link",
          "linkReference",
          "code",
          "inlineCode",
          "heading",
          "image",
          "imageReference",
          "html",
          "definition",
        ].includes(node.type) ||
        !node.children
      )
        return
      node.children = node.children.flatMap((child) => {
        if (child.type !== "text" || !child.value) {
          visit(child)
          return [child]
        }
        const pieces: MarkdownNode[] = [],
          text = child.value
        let cursor = 0
        for (const match of text.matchAll(pattern)) {
          const item = aliases.find((entry) => entry.alias === match[0])!.item
          if (seen.has(item.id)) continue
          seen.add(item.id)
          if (match.index! > cursor)
            pieces.push({ type: "text", value: text.slice(cursor, match.index) })
          pieces.push({
            type: "link",
            url: `glossary:${item.id}`,
            children: [{ type: "text", value: match[0] }],
          })
          cursor = match.index! + match[0].length
        }
        if (!pieces.length) return [child]
        if (cursor < text.length) pieces.push({ type: "text", value: text.slice(cursor) })
        return pieces
      })
    }
    visit(tree)
  }
}
