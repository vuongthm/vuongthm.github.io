import { describe, expect, it } from "vitest"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import { remarkReading } from "./reading-markdown.mjs"
const render = (body, locale = "en") => {
  const p = unified().use(remarkParse).use(remarkGfm).use(remarkReading, { locale })
  return p.runSync(p.parse(body))
}
const descendants = (node) => [node, ...(node.children ?? []).flatMap(descendants)]
describe("expressive reading Markdown", () => {
  it("pairs an image and its explanation into one wide semantic figure", () => {
    const tree = render(
      '![Workflow](../media/workflow.svg "wide")\n\n> [!FIGURE] Follow the evidence\n> Read ==the raw record== first.\n>\n> - Check the time.\n> - Confirm the account.\n\n## Next section',
    )
    const figure = tree.children[0]
    expect(figure.data.hName).toBe("figure")
    expect(figure.data.hProperties.className).toContain("reading-wide")
    expect(figure.children[0].children[0]).toMatchObject({ type: "image", title: null })
    expect(figure.children[1].data.hName).toBe("figcaption")
    expect(figure.children[1].children[0].children[0].value).toBe("Follow the evidence")
    expect(descendants(figure).filter((n) => n.type === "listItem")).toHaveLength(2)
    expect(descendants(figure).some((n) => n.data?.hName === "mark")).toBe(true)
    expect(descendants(tree).filter((n) => n.type === "heading")).toHaveLength(1)
    expect(tree.children).toHaveLength(2)
  })
  it("localizes untitled figure notes and leaves unpaired notes intact", () => {
    const figure = render("![Image](../media/diagram.svg)\n\n> [!FIGURE]\n> Giải thích.", "vi")
      .children[0]
    expect(figure.children[1].children[0].children[0].value).toBe("Đọc hình")
    expect(render("> [!FIGURE]\n> An ordinary unpaired note.").children[0].data).toBeUndefined()
  })
  it("uses semantic, localized callouts without manufacturing new headings", () => {
    for (const [kind, label] of [
      ["NOTE", "Note"],
      ["TIP", "Tip"],
      ["IMPORTANT", "Important"],
      ["WARNING", "Warning"],
      ["CAUTION", "Caution"],
    ]) {
      const node = render(
        `> [!${kind}]\n> A short explanation.\n>\n> - One detail\n> - Another detail`,
      ).children[0]
      expect(node.data.hName).toBe("aside")
      expect(node.data.hProperties.className).toContain(`callout-${kind.toLowerCase()}`)
      expect(node.children[0].children[0].value).toBe(label)
      expect(descendants(node).filter((n) => n.type === "listItem")).toHaveLength(2)
      expect(descendants(node).some((n) => n.type === "heading")).toBe(false)
    }
    expect(render("> [!TIP]\n> Nội dung.", "vi").children[0].children[0].children[0].value).toBe(
      "Gợi ý",
    )
  })
  it("preserves a custom title and leaves ordinary or unknown blockquotes alone", () => {
    const tree = render(
      "> [!NOTE] Check the source\n> Read the evidence.\n\n> A quotation.\n\n> [!UNKNOWN]\n> Text.",
    )
    expect(tree.children[0].children[0].children[0].value).toBe("Check the source")
    expect(JSON.stringify(tree.children[0])).toContain("Read the evidence.")
    expect(tree.children[1].data).toBeUndefined()
    expect(tree.children[2].data).toBeUndefined()
  })
  it("highlights inline phrases while leaving links, headings and code unchanged", () => {
    const tree = render(
      '## ==A heading==\n\nMark ==this phrase== and ==that one==.\n\n`==code==` [==link==](https://example.org)\n\n```js wide\nconst value = "==literal==";\n```',
    )
    expect(descendants(tree).filter((n) => n.data?.hName === "mark")).toHaveLength(2)
    expect(tree.children[0].children[0].value).toBe("==A heading==")
    const code = tree.children.at(-1)
    expect(code.data.hProperties["data-wide"]).toBe("true")
    expect(code.value).toBe('const value = "==literal==";')
  })
  it("keeps raw HTML as source text and preserves GFM tables", () => {
    const tree = render(
      '<script>alert("x")</script>\n\n| A | B |\n| - | - |\n| ==read me== | **bold** |',
    )
    expect(tree.children[0].type).toBe("html")
    expect(tree.children[0].data).toBeUndefined()
    expect(descendants(tree).some((n) => n.type === "table")).toBe(true)
    expect(descendants(tree).some((n) => n.data?.hName === "mark")).toBe(true)
    const wide = render("<!-- wide -->\n\n| A | B |\n| - | - |\n| A fact | An idea |")
    expect(wide.children).toHaveLength(1)
    expect(wide.children[0].type).toBe("table")
    expect(wide.children[0].data.hProperties["data-wide"]).toBe("true")
  })
})
