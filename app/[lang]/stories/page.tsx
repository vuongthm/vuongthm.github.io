"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SeriesCard } from "@/components/content/series-card"
import { BackToTop } from "@/components/features/back-to-top"
import { useLang } from "@/components/providers/lang-provider"
import { getVisibleSeries } from "@/lib/data"
import { cn } from "@/lib/utils"

const COPY = {
  en: { heading: "Stories", description: "Personal narrative series split into chapters — childhood, the reckless years, and a journey of growth.", all: "All", ongoing: "Ongoing", completed: "Completed", noResults: "No stories found." },
  vi: { heading: "Chuyện kể", description: "Những câu chuyện cá nhân được chia thành các chương — về tuổi thơ, những năm tháng bất kham, và hành trình trưởng thành.", all: "Tất cả", ongoing: "Đang viết", completed: "Hoàn thành", noResults: "Không tìm thấy chuyện nào." },
}

type Filter = "all" | "ongoing" | "completed"

export default function StoriesPage() {
  const { lang } = useLang()
  const c = COPY[lang]
  const [filter, setFilter] = useState<Filter>("all")

  const filtered = getVisibleSeries(lang).filter((s) => {
    if (filter === "all") return true
    return s.status === filter
  })

  return (
    <>
      <Header />
      <BackToTop />
      <main className="pt-14">
        {/* Đã đồng bộ lề ngang bằng việc đổi max-w-7xl sang max-w-6xl */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 pb-8 sm:pt-16 sm:pb-10">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3">{c.heading}</h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl">{c.description}</p>

          <div className="flex items-center gap-1 mt-6 p-1 rounded-lg bg-muted w-fit">
            {(["all", "ongoing", "completed"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150",
                  filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {c[f === "all" ? "all" : f === "ongoing" ? "ongoing" : "completed"]}
              </button>
            ))}
          </div>
        </div>

        {/* Đã đồng bộ lề ngang bằng việc đổi max-w-7xl sang max-w-6xl */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-16">{c.noResults}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filtered.map((series) => (
                <SeriesCard key={series.slug} series={series} lang={lang} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  )
}