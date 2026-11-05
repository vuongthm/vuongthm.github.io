import { cn } from "@/lib/utils"

/** Compact serif signature with the site's blue accent. */
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
      viewBox="0 0 100 40"
      width="88"
      height="35"
      role="img"
      aria-label="vuong."
      className={cn("brand-wordmark", `wordmark-${size}`, className)}
    >
      <text
        x="4"
        y="28"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="26"
        fontWeight="600"
        fill="currentColor"
      >
        vuong
        <tspan dx="1" fill="var(--accent, #2255bd)">
          .
        </tspan>
      </text>
    </svg>
  )
}
export function BrandLockup(props: { className?: string; size?: "sm" | "md" | "lg" }) {
  return <Wordmark {...props} />
}
