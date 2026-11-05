import ReactMarkdown, { defaultUrlTransform } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"
import rehypeHighlight from "rehype-highlight"
import Image from "next/image"
import { CodeBlock } from "./code-block"
import { Children, isValidElement, type ReactNode } from "react"
import assetDimensions from "@/generated/assets.json"
import { GlossaryTerm } from "./glossary-term"
import { glossary, remarkGlossary } from "@/lib/learning/glossary"
import { KnowledgeQuiz, type QuizData } from "@/components/learning/knowledge-quiz"
import { learningMarkdown } from "@/lib/learning/markdown.mjs"
const dimensions = assetDimensions as Record<string, { width: number; height: number }>
function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? textOf(child.props.children)
          : "",
    )
    .join("")
}
export function Markdown({
  body,
  assetUrls,
}: {
  body: string
  assetUrls?: Record<string, string>
}) {
  const { markdown, quizzes } = learningMarkdown(body)
  return (
    <div className="prose">
      <ReactMarkdown
        urlTransform={(url) =>
          /^glossary:[a-z0-9-]+$/.test(url) ? url : (assetUrls?.[url] ?? defaultUrlTransform(url))
        }
        remarkPlugins={[remarkGfm, remarkGlossary]}
        rehypePlugins={[rehypeSlug, [rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={{
          h1: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const text = textOf(children),
              language = className?.match(/language-([\w-]+)/)?.[1] ?? ""
            return language || text.includes("\n") ? (
              <CodeBlock language={language} text={text.replace(/\n$/, "")}>
                {children}
              </CodeBlock>
            ) : (
              <code>{children}</code>
            )
          },
          table: ({ children }) => (
            <div className="table-scroll" tabIndex={0}>
              <table>{children}</table>
            </div>
          ),
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              <span className="article-image">
                <Image
                  src={src}
                  alt={alt ?? ""}
                  width={dimensions[src]?.width ?? 1400}
                  height={dimensions[src]?.height ?? 900}
                  style={{ width: "auto", maxWidth: "100%", height: "auto" }}
                  unoptimized
                  loading="lazy"
                />
                {alt && <span className="image-caption">{alt}</span>}
              </span>
            ) : null,
          a: ({ href, title, children }) => {
            if (href?.startsWith("glossary:")) {
              const item = glossary.find((term) => term.id === href.slice(9))
              if (item || title)
                return (
                  <GlossaryTerm
                    term={item?.term ?? textOf(children)}
                    definition={title || item!.definition}
                  >
                    {children}
                  </GlossaryTerm>
                )
              return <>{children}</>
            }
            return (
              <a
                href={href}
                title={title}
                download={href?.startsWith("blob:") || undefined}
                target={href?.startsWith("http") ? "_blank" : undefined}
                rel={href?.startsWith("http") ? "noreferrer" : undefined}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
      {quizzes.map((quiz, index) => (
        <KnowledgeQuiz quiz={quiz as QuizData} key={index} />
      ))}
    </div>
  )
}
