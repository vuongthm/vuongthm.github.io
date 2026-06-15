import { Link } from "@/components/ui/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"
import type { Series, Lang } from "@/lib/data"
import { cn } from "@/lib/utils"

interface SeriesCardProps {
  series: Series
  lang?: Lang
  className?: string
}

const STATUS_LABELS: Record<string, Record<Lang, string>> = {
  ongoing: { en: "Ongoing", vi: "Đang viết" },
  completed: { en: "Completed", vi: "Hoàn thành" },
}

const CHAPTERS_LABEL: Record<Lang, string> = {
  en: "chapters",
  vi: "chương",
}

export function SeriesCard({ series, lang = "en", className }: SeriesCardProps) {
  return (
    <Link
      href={`/stories/${series.slug}`}
      className={cn(
        "group block rounded-xl overflow-hidden border border-border bg-card",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-border/80",
        className
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <Image
          src={series.coverImage}
          alt={series.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 right-3">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium",
              series.status === "ongoing"
                ? "bg-accent-brand/90 text-accent-brand-foreground border-0"
                : "bg-black/60 text-white border-0"
            )}
          >
            {STATUS_LABELS[series.status][lang]}
          </Badge>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="font-serif text-lg sm:text-xl font-semibold text-card-foreground text-pretty leading-snug mb-2 group-hover:text-accent-brand transition-colors duration-150">
          {series.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
          {series.description}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen size={13} />
            <span>
              {series.chapterCount} {CHAPTERS_LABEL[lang]}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-wrap justify-end">
            {series.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}