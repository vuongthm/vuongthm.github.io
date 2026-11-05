import Image from "next/image"
import { BookOpen, Clapperboard, Headphones } from "lucide-react"
import type { CornerItem } from "@/lib/content/types"
export function CornerCover({
  item,
  title,
}: {
  item: Pick<CornerItem, "category" | "cover">
  title: string
}) {
  const Icon = { books: BookOpen, films: Clapperboard, podcasts: Headphones }[item.category]
  return (
    <div className={`corner-cover is-${item.category}`} aria-hidden="true">
      {item.cover ? (
        <Image src={item.cover} alt="" fill sizes="(max-width:760px) 90vw, 33vw" unoptimized />
      ) : (
        <>
          <span className="corner-cover-orbit" />
          <div className="corner-cover-object">
            <Icon size={29} strokeWidth={1.1} />
            <span>{title}</span>
          </div>
        </>
      )}
    </div>
  )
}
