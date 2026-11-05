"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import type { Locale } from "@/lib/i18n/config"
import type { SearchEntry } from "@/lib/content/types"
import { messages } from "@/lib/i18n/messages"
import {
  initialProfiles,
  type AIProvider,
  type AIProfiles,
  type AIProfile,
} from "@/lib/ai/providers"
import aiConfig from "@/site/ai.json"

interface SiteState {
  locale: Locale
  dictionary: ReturnType<typeof messages>
  searchEntries: SearchEntry[]
  searchOpen: boolean
  setSearchOpen: (value: boolean) => void
  aiOpen: boolean
  setAiOpen: (value: boolean) => void
  aiContext: { title: string; body: string; href: string } | null
  openAssistant: (context?: { title: string; body: string; href: string }) => void
  aiProvider: AIProvider
  setAIProvider: (value: AIProvider) => void
  aiProfiles: AIProfiles
  setAIProfile: (provider: AIProvider, value: AIProfile) => void
  aiGateway: string
  setAIGateway: (value: string) => void
}
const SiteContext = createContext<SiteState | null>(null)
export function SiteProvider({
  locale,
  searchEntries,
  children,
}: {
  locale: Locale
  searchEntries: SearchEntry[]
  children: ReactNode
}) {
  const [searchOpen, setSearchOpen] = useState(false),
    [aiOpen, setAiOpen] = useState(false),
    [aiProvider, setAIProvider] = useState<AIProvider>("gemini"),
    [aiProfiles, setAIProfiles] = useState(initialProfiles),
    [aiGateway, setAIGateway] = useState(aiConfig.gateway)
  const [aiContext, setAiContext] = useState<SiteState["aiContext"]>(null)
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SiteContext.Provider
        value={{
          locale,
          dictionary: messages(locale),
          searchEntries,
          searchOpen,
          setSearchOpen,
          aiOpen,
          setAiOpen,
          aiProvider,
          setAIProvider,
          aiProfiles,
          setAIProfile: (provider, value) =>
            setAIProfiles((previous) => ({ ...previous, [provider]: value })),
          aiGateway,
          setAIGateway,
          aiContext,
          openAssistant: (context) => {
            setSearchOpen(false)
            setAiContext(context ?? null)
            setAiOpen(true)
          },
        }}
      >
        {children}
      </SiteContext.Provider>
    </ThemeProvider>
  )
}
export function useSite() {
  const context = useContext(SiteContext)
  if (!context) throw new Error("SiteProvider is required")
  return context
}
