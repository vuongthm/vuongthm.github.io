"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { useParams, useRouter, usePathname } from "next/navigation"
import type { Lang } from "@/lib/data"

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const [lang, setLangState] = useState<Lang>("en")

  useEffect(() => {
    if (params?.lang === "vi" || params?.lang === "en") {
      setLangState(params.lang as Lang)
    }
  }, [params?.lang])

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem("blog-lang", newLang)
    
    if (pathname) {
      const segments = pathname.split("/")
      if (segments[1] === "en" || segments[1] === "vi") {
        segments[1] = newLang
        router.push(segments.join("/"))
      } else {
        router.push(`/${newLang}`)
      }
    }
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}