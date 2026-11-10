/* eslint-disable @next/next/no-head-element -- This component renders the App Router root document. */
import type { ReactNode } from "react"
import type { Locale } from "@/lib/i18n/config"
import fontPreloads from "@/site/font-preloads.json"
import "@/styles/site-styles"
const policy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com" +
    (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com https://tiles.openfreemap.org",
  "worker-src 'self' blob:",
  "font-src 'self' data:",
  // BYOK gateways are user-configurable HTTPS origins; local development uses a loopback relay.
  "connect-src 'self' https: http://127.0.0.1:* http://localhost:*",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")
export function Document({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={policy} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        {fontPreloads.map((href) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
      </head>
      <body>{children}</body>
    </html>
  )
}
