import { unified } from "unified"
import remarkParse from "remark-parse"
import { parseQuiz } from "./quiz.mjs"
/** Quiz JSON stays in the source/body (and encrypted bodies), but outside article text/search. */
export function learningMarkdown(body) {
  const tree = unified().use(remarkParse).parse(body),
    quizzes = [],
    ranges = []
  function visit(node) {
    if (node.type === "code" && node.lang === "quiz") {
      quizzes.push(parseQuiz(node.value))
      ranges.push([node.position.start.offset, node.position.end.offset])
    }
    for (const child of node.children ?? []) visit(child)
  }
  visit(tree)
  let markdown = body
  for (const [start, end] of ranges.sort((a, b) => b[0] - a[0]))
    markdown = markdown.slice(0, start) + markdown.slice(end)
  return { markdown, quizzes }
}
