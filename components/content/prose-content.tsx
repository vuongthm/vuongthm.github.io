"use client"

import { useMemo, useState } from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProseContentProps {
  content: string
  className?: string
}

function CodeBlock({
  code,
  language,
}: {
  code: string
  language?: string
}) {
  const [copied, setCopied] = useState(false)
  
  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative group my-6 rounded-xl overflow-hidden border border-border bg-[#1e1e1e]">
      {/* Thanh header của khối mã nguồn */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs font-mono text-white/40">{language ?? "code"}</span>
        
        {/* 
          Nút Copy có opacity-0 (ẩn mặc định) và tự động fade-in qua group-hover:opacity-100 
          khi người dùng rê chuột vào bất kỳ vị trí nào trên khối mã (khối div có class 'group')
        */}
        <button
          onClick={copy}
          aria-label="Copy code"
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white/80 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 cursor-pointer"
        >
          {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm font-mono text-white/90 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n")
  const nodes: React.ReactNode[] = []
  let i = 0

  const inlineRender = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[0.875em]"
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      return part.split(/(\*[^*]+\*)/).map((s, j) => {
        if (s.startsWith("*") && s.endsWith("*")) {
          return <em key={j}>{s.slice(1, -1)}</em>
        }
        return s
      })
    })
  }

  const parseTableRow = (rowStr: string): string[] => {
    let trimmed = rowStr.trim()
    if (trimmed.startsWith("|")) trimmed = trimmed.slice(1)
    if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1)
    return trimmed.split("|").map((cell) => cell.trim())
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i])
        i++
      }
      nodes.push(
        <CodeBlock key={i} code={codeLines.join("\n")} language={lang || undefined} />
      )
      i++
      continue
    }

    if (line.startsWith("# ")) {
      const text = line.slice(2)
      const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
      nodes.push(
        <h1 key={i} id={id} className="font-serif text-3xl font-semibold text-foreground mt-10 mb-4 group flex items-center gap-2">
          {text}
          <a href={`#${id}`} className="opacity-0 group-hover:opacity-60 text-muted-foreground text-base font-normal">#</a>
        </h1>
      )
      i++; continue
    }

    if (line.startsWith("#### ")) {
      const text = line.slice(5)
      const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
      nodes.push(
        <h4 key={i} id={id} className="font-serif text-lg font-semibold text-foreground mt-8 mb-3 group flex items-center gap-2">
          {text}
          <a href={`#${id}`} className="opacity-0 group-hover:opacity-60 text-muted-foreground text-sm font-normal">#</a>
        </h4>
      )
      i++; continue
    }
    if (line.startsWith("### ")) {
      const text = line.slice(4)
      const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
      nodes.push(
        <h3 key={i} id={id} className="font-serif text-xl font-semibold text-foreground mt-10 mb-3 group flex items-center gap-2">
          {text}
          <a href={`#${id}`} className="opacity-0 group-hover:opacity-60 text-muted-foreground text-sm font-normal">#</a>
        </h3>
      )
      i++; continue
    }
    if (line.startsWith("## ")) {
      const text = line.slice(3)
      const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
      nodes.push(
        <h2 key={i} id={id} className="font-serif text-2xl font-semibold text-foreground mt-12 mb-4 group flex items-center gap-2">
          {text}
          <a href={`#${id}`} className="opacity-0 group-hover:opacity-60 text-muted-foreground text-base font-normal">#</a>
        </h2>
      )
      i++; continue
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      nodes.push(
        <blockquote key={i} className="border-l-2 border-accent-brand pl-4 my-6 text-muted-foreground italic">
          {quoteLines.map((ql, qi) => <p key={qi}>{inlineRender(ql)}</p>)}
        </blockquote>
      )
      continue
    }

    if (line.startsWith("- ")) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2))
        i++
      }
      nodes.push(
        <ul key={i} className="list-disc pl-5 my-4 flex flex-col gap-1.5 text-foreground">
          {items.map((it, ii) => <li key={ii}>{inlineRender(it)}</li>)}
        </ul>
      )
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""))
        i++
      }
      nodes.push(
        <ol key={i} className="list-decimal pl-5 my-4 flex flex-col gap-1.5 text-foreground">
          {items.map((it, ii) => <li key={ii}>{inlineRender(it)}</li>)}
        </ol>
      )
      continue
    }

    const nextLine = lines[i + 1]
    if (line.includes("|") && nextLine && nextLine.includes("|") && /^[|\s:-]+$/.test(nextLine.trim())) {
      const headers = parseTableRow(line)
      const rows: string[][] = []
      
      i += 2 
      
      while (i < lines.length && lines[i].includes("|") && !/^[|\s:-]+$/.test(lines[i].trim())) {
        rows.push(parseTableRow(lines[i]))
        i++
      }

      nodes.push(
        <div key={i} className="my-6 overflow-x-auto border border-border rounded-xl">
          <table className="w-full border-collapse text-sm text-left text-foreground">
            <thead className="bg-muted text-muted-foreground border-b border-border">
              <tr>
                {headers.map((cell, idx) => (
                  <th key={idx} className="px-4 py-3 font-semibold">
                    {inlineRender(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-3 whitespace-nowrap">
                      {inlineRender(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    if (line.trim() === "") {
      i++; continue
    }

    const paraLines: string[] = []
    let progressed = false
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("> ") &&
      !lines[i].startsWith("- ") &&
      !lines[i].startsWith("```") &&
      !/^\d+\.\s/.test(lines[i]) &&
      !(lines[i].includes("|") && lines[i + 1] && lines[i + 1].includes("|") && /^[|\s:-]+$/.test(lines[i + 1].trim()))
    ) {
      paraLines.push(lines[i])
      i++
      progressed = true
    }
    if (paraLines.length > 0) {
      nodes.push(
        <p key={i} className="text-foreground leading-[1.85] my-5">
          {inlineRender(paraLines.join(" "))}
        </p>
      )
    }
    
    if (!progressed && paraLines.length === 0) {
      i++
    }
  }

  return nodes
}

export function ProseContent({ content, className }: ProseContentProps) {
  const nodes = useMemo(() => renderMarkdown(content), [content])
  return (
    <div className={cn("text-base", className)}>
      {nodes}
    </div>
  )
}