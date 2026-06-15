"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RootPage() {
  const router = useRouter()
  
  useEffect(() => {
    const storedLang = typeof window !== "undefined" ? localStorage.getItem("blog-lang") || "en" : "en"
    router.replace(`/${storedLang}`)
  }, [router])

  return null
}