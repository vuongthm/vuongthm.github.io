"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function LegacyCollections({ href, label }: { href: string; label: string }) {
  const router = useRouter()
  useEffect(() => {
    router.replace(href)
  }, [href, router])
  return (
    <p className="legacy-collections-link">
      <Link href={href}>{label} →</Link>
    </p>
  )
}
