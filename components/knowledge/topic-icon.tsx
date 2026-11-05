import {
  BookOpen,
  Cloud,
  Code2,
  Network,
  Radar,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react"
import { getTopic } from "@/lib/content/topics"
const icons: Record<string, typeof Network> = {
  network: Network,
  shield: ShieldCheck,
  radar: Radar,
  cloud: Cloud,
  sparkles: Sparkles,
  terminal: Terminal,
  book: BookOpen,
  code: Code2,
}
export function TopicIcon({ id, size = 22 }: { id: string; size?: number }) {
  const Icon = icons[getTopic(id)?.symbol ?? "book"] ?? BookOpen
  return <Icon size={size} strokeWidth={1.6} />
}
