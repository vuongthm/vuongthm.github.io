import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import { toString } from "mdast-util-to-string"
import GithubSlugger from "github-slugger"
export interface Heading {
  id: string
  text: string
  level: number
}
export function headingsFor(body: string): Heading[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body),
    slugger = new GithubSlugger(),
    headings: Heading[] = []
  for (const node of tree.children)
    if (node.type === "heading") {
      const text = toString(node),
        id = slugger.slug(text)
      if (node.depth >= 2 && node.depth <= 4) headings.push({ id, text, level: node.depth })
    }
  return headings
}
