"use client"
import { useState, type ReactNode } from "react"
import { Check, Copy } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
export function CodeBlock({
  children,
  language,
  text,
}: {
  children: ReactNode
  language: string
  text: string
}) {
  const { dictionary: m } = useSite(),
    [copied, setCopied] = useState(false),
    [error, setError] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setError(true)
    }
  }
  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>{language || "text"}</span>
        <button onClick={copy} aria-label={m.copy}>
          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? m.copied : m.copy}
        </button>
      </div>
      <pre>
        <code className={language ? `language-${language}` : undefined}>{children}</code>
      </pre>
      {error && <span role="status">{m.copy}: Ctrl/Cmd+C</span>}
    </div>
  )
}
