"use client"

import { Link } from "@/components/ui/link"
import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useLang } from "@/components/providers/lang-provider"
import { getAllTags } from "@/lib/data"
import { cn } from "@/lib/utils"

type SortMode = "frequency" | "alpha"

const COPY = {
  en: {
    heading: "Tags",
    description: "All topics across stories and notes — sorted by frequency or alphabetically.",
    sortFreq: "By frequency",
    sortAlpha: "A–Z",
  },
  vi: {
    heading: "Thẻ",
    description: "Tất cả chủ đề trong chuyện kể và ghi chú — theo tần suất hoặc A–Z.",
    sortFreq: "Tần suất",
    sortAlpha: "A–Z",
  },
}

export default function TagsPage() {
  const { lang } = useLang()
  const c = COPY[lang]
  const [sort, setSort] = useState<SortMode>("frequency")

  const allTags = getAllTags(lang)
  const sorted =
    sort === "frequency"
      ? allTags
      : [...allTags].sort((a, b) => a.tag.localeCompare(b.tag))

  const maxCount = allTags[0]?.count ?? 1

  return (
    <>
      <Header />

      <main className="pt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16">
          <div className="mb-8 sm:mb-10 text-center sm:text-left">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3">
              {c.heading}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              {c.description}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-8 justify-center sm:justify-start">
            <button
              onClick={() => setSort("frequency")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150",
                sort === "frequency"
                  ? "bg-accent-brand text-accent-brand-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {c.sortFreq}
            </button>
            <button
              onClick={() => setSort("alpha")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150",
                sort === "alpha"
                  ? "bg-accent-brand text-accent-brand-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {c.sortAlpha}
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
            {sorted.map(({ tag, count }) => {
              const scale = 0.8 + (count / maxCount) * 0.3
              return (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background hover:border-accent-brand/40 hover:bg-accent-brand/5 transition-all duration-150"
                  style={{ fontSize: `${scale}rem` }}
                >
                  <span className="text-foreground group-hover:text-accent-brand transition-colors">
                    {tag}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {count}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </main>

      <Footer lang={lang} />
    </>
  )
}