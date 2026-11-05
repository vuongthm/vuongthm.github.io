"use client"
import { useRef, useState, type ReactNode } from "react"
import { Pagination } from "./pagination"

export function PaginatedList({
  children,
  className,
  pageSize = 6,
}: {
  children: ReactNode[]
  className: string
  pageSize?: number
}) {
  const [selected, setSelected] = useState(1),
    ref = useRef<HTMLDivElement>(null),
    pages = Math.max(1, Math.ceil(children.length / pageSize)),
    page = Math.min(selected, pages)
  return (
    <div className="paginated-collection">
      <div className={className} ref={ref} tabIndex={-1}>
        {children.slice((page - 1) * pageSize, page * pageSize)}
      </div>
      <Pagination
        page={page}
        pages={pages}
        onChange={(next) => {
          setSelected(next)
          ref.current?.focus({ preventScroll: true })
          ref.current?.scrollIntoView({
            block: "start",
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          })
        }}
      />
    </div>
  )
}
