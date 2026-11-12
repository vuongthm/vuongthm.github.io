import { BookOpen, Code2, Terminal, Cpu } from "lucide-react"
import { getTopic } from "@/lib/content/topics"

const drawings: Record<string, React.ReactNode> = {
  network: (
    <>
      <rect x="8.5" y="2" width="7" height="5" rx="1.3" />
      <path d="M12 7v5M5 16v-4h14v4M12 12v4" />
      <rect x="2" y="16" width="6" height="5" rx="1.3" />
      <rect x="9" y="16" width="6" height="5" rx="1.3" />
      <rect x="16" y="16" width="6" height="5" rx="1.3" />
    </>
  ),
  cloud: (
    <>
      <path d="M5 13a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 15 4a4.5 4.5 0 1 1 4 9" />
      <rect x="6" y="12" width="12" height="4" rx="1.2" />
      <rect x="6" y="18" width="12" height="4" rx="1.2" />
      <path d="M9 14h.1M9 20h.1M15 14h1M15 20h1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2 3.5 5v6c0 5 3.7 8.5 8.5 11 4.8-2.5 8.5-6 8.5-11V5Z" />
      <path d="m8 11 3 3 5-6" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M16.7 7.3A6.6 6.6 0 1 0 18.5 13M12 12l7-7" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M4 4 2 2M20 20l2 2" />
    </>
  ),
}
export function TopicIcon({ id, size = 22 }: { id: string; size?: number }) {
  const symbol = getTopic(id)?.symbol ?? "book"
  if (drawings[symbol])
    return (
      <svg
        className="topic-glyph"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {drawings[symbol]}
      </svg>
    )
  const Icon =
    { code: Code2, terminal: Terminal, sparkles: Cpu, book: BookOpen }[symbol as "book"] ?? BookOpen
  return <Icon size={size} strokeWidth={1.55} aria-hidden="true" />
}
