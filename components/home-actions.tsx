"use client"
import { Search, Sparkles } from "lucide-react"
import { useSite } from "./providers/site-provider"
export function HomeActions() {
  const { dictionary: m, setSearchOpen, openAssistant } = useSite()
  return (
    <div className="home-tools">
      <button onClick={() => setSearchOpen(true)}>
        <Search size={16} />
        {m.search}
      </button>
      <button onClick={() => openAssistant()}>
        <Sparkles size={16} />
        {m.ask}
      </button>
    </div>
  )
}
