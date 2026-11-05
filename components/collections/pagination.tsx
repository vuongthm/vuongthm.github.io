"use client"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number
  pages: number
  onChange: (page: number) => void
}) {
  const { dictionary, locale } = useSite()
  if (pages <= 1) return null
  return (
    <nav
      className="collection-pagination"
      aria-label={{ vi: "Phân trang", en: "Pagination", ja: "ページ切り替え", zh: "分页" }[locale]}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label={dictionary.previous}
      >
        <ChevronLeft size={17} aria-hidden="true" />
      </button>
      <output aria-live="polite" aria-atomic="true">
        {page}
        <span>/</span>
        {pages}
      </output>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        aria-label={dictionary.next}
      >
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </nav>
  )
}
