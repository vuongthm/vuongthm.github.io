const labels = {
  vi: {
    note: "Ghi chú",
    tip: "Gợi ý",
    important: "Điểm cần nhớ",
    warning: "Lưu ý",
    caution: "Cẩn trọng",
  },
  en: { note: "Note", tip: "Tip", important: "Important", warning: "Warning", caution: "Caution" },
  ja: { note: "メモ", tip: "ヒント", important: "重要", warning: "注意", caution: "警告" },
  zh: { note: "笔记", tip: "提示", important: "重要", warning: "注意", caution: "警告" },
}
/** Semantic callouts, inline highlights and opt-in wide code; raw HTML stays disabled. */
export function remarkReading({ locale = "en" } = {}) {
  return (tree) => {
    function visit(node) {
      if (node.type === "code") {
        if (/(?:^|\s)wide(?:\s|$)/.test(node.meta ?? "")) {
          node.data ??= {}
          node.data.hProperties ??= {}
          node.data.hProperties["data-wide"] = "true"
        }
        return
      }
      if (node.type === "blockquote") {
        const paragraph = node.children?.[0],
          first = paragraph?.children?.[0]
        if (paragraph?.type === "paragraph" && first?.type === "text") {
          const match = first.value.match(
            /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:[ \t]+([^\n]*))?(?:\n|$)/,
          )
          if (match) {
            const kind = match[1].toLowerCase(),
              title = match[2]?.trim() || (labels[locale] ?? labels.en)[kind]
            first.value = first.value.slice(match[0].length)
            if (!first.value) paragraph.children.shift()
            if (!paragraph.children.length) node.children.shift()
            node.data = {
              ...node.data,
              hName: "aside",
              hProperties: { className: ["markdown-callout", `callout-${kind}`], role: "note" },
            }
            node.children.unshift({
              type: "paragraph",
              data: { hName: "div", hProperties: { className: ["callout-title"] } },
              children: [{ type: "text", value: title }],
            })
          }
        }
      }
      if (
        !node.children ||
        ["link", "linkReference", "inlineCode", "html", "heading"].includes(node.type)
      )
        return
      const consumed = new Set()
      node.children = node.children.flatMap((child, index, siblings) => {
        if (consumed.has(index)) return []
        const next = siblings[index + 1]
        const first = next?.children?.[0]?.children?.[0]
        const caption =
          next?.type === "blockquote" && first?.type === "text"
            ? first.value.match(/^\[!FIGURE\](?:[ \t]+([^\n]*))?(?:\n|$)/)
            : null
        if (
          child.type === "paragraph" &&
          child.children?.length === 1 &&
          child.children[0].type === "image" &&
          caption
        ) {
          const title =
            caption[1]?.trim() ||
            { vi: "Đọc hình", en: "Reading the figure", ja: "図の読み方", zh: "读图说明" }[
              locale
            ] ||
            "Reading the figure"
          first.value = first.value.slice(caption[0].length)
          if (!first.value) next.children[0].children.shift()
          if (!next.children[0].children.length) next.children.shift()
          next.data = { hName: "figcaption", hProperties: { className: ["figure-note"] } }
          next.children.unshift({
            type: "paragraph",
            data: { hName: "div", hProperties: { className: ["figure-note-title"] } },
            children: [{ type: "text", value: title }],
          })
          if (child.children[0].title === "wide") child.children[0].title = null
          visit(child)
          visit(next)
          consumed.add(index + 1)
          return [
            {
              type: "blockquote",
              data: {
                hName: "figure",
                hProperties: { className: ["reading-figure", "reading-wide"] },
              },
              children: [child, next],
            },
          ]
        }
        if (
          child.type === "html" &&
          /^<!--\s*wide\s*-->$/.test(child.value.trim()) &&
          ["table", "code"].includes(next?.type)
        ) {
          next.data ??= {}
          next.data.hProperties ??= {}
          next.data.hProperties["data-wide"] = "true"
          return []
        }
        if (child.type !== "text") {
          visit(child)
          return [child]
        }
        const matches = [...child.value.matchAll(/==([^=\n]+)==/g)]
        if (!matches.length) return [child]
        const pieces = []
        let cursor = 0
        for (const match of matches) {
          if (match.index > cursor)
            pieces.push({ type: "text", value: child.value.slice(cursor, match.index) })
          pieces.push({
            type: "emphasis",
            data: { hName: "mark" },
            children: [{ type: "text", value: match[1] }],
          })
          cursor = match.index + match[0].length
        }
        if (cursor < child.value.length)
          pieces.push({ type: "text", value: child.value.slice(cursor) })
        return pieces
      })
    }
    visit(tree)
  }
}
