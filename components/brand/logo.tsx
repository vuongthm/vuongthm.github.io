import { brandViewBox, brandPaths, brandAccentPath, brandGold } from "@/lib/brand.mjs"
import { cn } from "@/lib/utils"

/** The author's geometric THM mark; preserve the supplied viewBox and paths. */
export function Wordmark({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={brandViewBox}
      width="1335"
      height="355"
      role="img"
      aria-label="THM"
      className={cn("brand-wordmark", `wordmark-${size}`, className)}
    >
      <g fill="var(--brand-ink, #011A39)">
        {brandPaths.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path d={brandAccentPath} fill={brandGold} />
    </svg>
  )
}
export function BrandLockup(props: { className?: string; size?: "sm" | "md" | "lg" }) {
  return <Wordmark {...props} />
}
