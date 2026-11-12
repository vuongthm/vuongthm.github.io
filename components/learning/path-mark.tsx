import { Fingerprint, Network, ShieldCheck } from "lucide-react"

export function PathMark({ slug, small = false }: { slug: string; small?: boolean }) {
  const isSoc = slug.includes("soc"),
    isPre = slug.startsWith("pre")
  const Icon = isSoc ? ShieldCheck : isPre ? Network : Fingerprint
  return (
    <div className={`path-mark${small ? " is-small" : ""}`} aria-hidden="true">
      <svg className="path-mark-orbit" viewBox="0 0 240 200" fill="none">
        <ellipse cx="120" cy="100" rx="105" ry="69" transform="rotate(-22 120 100)" />
        <circle cx="120" cy="100" r="69" />
        <path d="M20 100h24m152 0h24M120 12v19m0 138v19" />
        <circle cx="32" cy="135" r="4" />
        <circle cx="200" cy="53" r="3" />
      </svg>
      <span className="path-mark-core">
        <Icon size={45} strokeWidth={1.25} />
      </span>
      <span className="path-mark-label">
        {isSoc
          ? `SOC / L${slug.match(/level-(\d+)/)?.[1] ?? "1"}`
          : isPre
            ? "FOUNDATION / 01"
            : slug === "cyber-security-101"
              ? "CYBER / 101"
              : slug.split("-").slice(0, 2).join(" / ").toUpperCase()}
      </span>
    </div>
  )
}
