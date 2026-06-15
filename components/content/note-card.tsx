import { Link } from "@/components/ui/link"
import { Clock, ArrowRight } from "lucide-react"
import type { Note, Lang } from "@/lib/data"
import { formatDate } from "@/lib/data"
import { cn } from "@/lib/utils"

interface NoteCardProps {
  note: Note
  lang?: Lang
  className?: string
  variant?: "default" | "compact"
}

export function NoteCard({
  note,
  lang = "en",
  className,
  variant = "default",
}: NoteCardProps) {
  if (variant === "compact") {
    return (
      <Link
        href={`/notes/${note.slug}`}
        className={cn(
          "group flex items-start justify-between gap-4 py-4 border-b border-border last:border-0",
          "hover:bg-muted/30 -mx-3 px-3 rounded-md transition-colors duration-150",
          className
        )}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground group-hover:text-accent-brand transition-colors duration-150 text-pretty leading-snug">
            {note.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {formatDate(note.date, lang)}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={11} />
              {note.readingTime} {lang === "en" ? "min" : "phút"}
            </span>
          </div>
        </div>
        <ArrowRight
          size={14}
          className="shrink-0 mt-0.5 text-muted-foreground group-hover:text-accent-brand transition-colors duration-150"
        />
      </Link>
    )
  }

  return (
    <Link
      href={`/notes/${note.slug}`}
      className={cn(
        "group block py-5 border-b border-border last:border-0",
        "hover:bg-muted/20 -mx-4 px-4 rounded-lg transition-colors duration-150",
        className
      )}
    >
      <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-accent-brand transition-colors duration-150 text-pretty leading-snug mb-1">
        {note.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
        {note.description}
      </p>

      {/* 
        Khung chân thẻ Note:
        - Mặc định ở màn hình hẹp: Dàn theo hàng dọc (flex-col) tránh đè chữ.
        - Màn hình rộng (sm): Tự động dàn hàng ngang (sm:flex-row) cân đối hai lề.
      */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        {/* Thời gian + số phút đọc (Bên trái) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {formatDate(note.date, lang)}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
            <Clock size={10} />
            {note.readingTime} {lang === "en" ? "min" : "phút"}
          </span>
        </div>

        {/* Danh sách nhãn Tags (Bên phải, tự động căn phải trên màn hình rộng) */}
        <div className="flex items-center gap-1.5 flex-wrap sm:justify-end min-w-0">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}