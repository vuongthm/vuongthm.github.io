import Link from "next/link"
import { siteConfig } from "@/lib/site.config"
export const metadata = {
  title: "Vuong — Field notes & beyond",
  alternates: { canonical: `${siteConfig.url}/vi/` },
  robots: { index: false, follow: true },
}
export default function Entry() {
  return (
    <>
      <meta httpEquiv="refresh" content="0;url=/vi/" />
      <main className="entry-fallback">
        <span className="eyebrow">VUONGTHM / FIELD NOTES</span>
        <h1>Ghi lại điều đã hiểu.</h1>
        <p>Write to understand. Share what matters.</p>
        <Link className="button primary" href="/vi/">
          Tiếng Việt →
        </Link>
        <Link className="button secondary" href="/en/">
          English →
        </Link>
        <Link className="button secondary" href="/ja/">
          日本語 →
        </Link>
        <Link className="button secondary" href="/zh/">
          简体中文 →
        </Link>
      </main>
    </>
  )
}
