"use client"
import Link from "next/link"
import { Search } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
export default function NotFound() {
  const { locale, dictionary: m, setSearchOpen } = useSite()
  return (
    <main id="main-content" className="not-found">
      <span>404</span>
      <h1>{m.pageNotFound}</h1>
      <p>{m.notFoundHint}</p>
      <div>
        <Link className="button primary" href={`/${locale}/`}>
          {m.home}
        </Link>
        <button className="button secondary" onClick={() => setSearchOpen(true)}>
          <Search size={16} />
          {m.search}
        </button>
      </div>
    </main>
  )
}
