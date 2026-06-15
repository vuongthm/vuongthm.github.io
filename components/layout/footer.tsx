import { Link } from "@/components/ui/link"
import type { Lang } from "@/lib/data"

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

interface FooterProps {
  lang?: Lang
}

const CONTENT_LINKS: Record<Lang, { label: string; href: string }[]> = {
  en: [
    { label: "Stories", href: "/stories" },
    { label: "Notes", href: "/notes" },
    { label: "Tags", href: "/tags" },
  ],
  vi: [
    { label: "Chuyện kể", href: "/stories" },
    { label: "Ghi chú", href: "/notes" },
    { label: "Thẻ", href: "/tags" },
  ],
}

const ABOUT_LINKS: Record<Lang, { label: string; href: string }[]> = {
  en: [
    { label: "About me", href: "/about" },
    { label: "Hometown", href: "/about#hometown" },
    { label: "Timeline", href: "/about#timeline" },
    { label: "People in my life", href: "/about/people" },
  ],
  vi: [
    { label: "Về tôi", href: "/about" },
    { label: "Quê hương", href: "/about#hometown" },
    { label: "Các mốc", href: "/about#timeline" },
    { label: "Người trong cuộc đời tôi", href: "/about/people" },
  ],
}

const COPY: Record<Lang, {
  tagline: string
  contentHeading: string
  aboutHeading: string
  quoteText: string
  copyright: string
}> = {
  en: {
    tagline: "Telling life stories. Sharing what I've learned.",
    contentHeading: "Content",
    aboutHeading: "About",
    quoteText: "Writing is the only way I know to think clearly.",
    copyright: "© 2024 Vuong (vuongthm).",
  },
  vi: {
    tagline: "Kể chuyện cuộc đời. Chia sẻ những gì học được.",
    contentHeading: "Nội dung",
    aboutHeading: "Về tôi",
    quoteText: "Viết là cách duy nhất tôi biết để suy nghĩ rõ ràng.",
    copyright: "© 2024 Vuong (vuongthm).",
  },
}

export function Footer({ lang = "en" }: FooterProps) {
  const c = COPY[lang]

  return (
    <footer className="mt-20 sm:mt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="border-t border-border" />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="font-serif text-xl font-semibold text-foreground hover:text-accent-brand transition-colors"
            >
              vuong<span className="text-accent-brand">.</span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
              {c.tagline}
            </p>
            <div className="flex items-center gap-2 mt-4">
              <a
                href="https://twitter.com/vuongthm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="size-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-accent-brand transition-colors"
              >
                <XIcon size={15} />
              </a>
              <a
                href="https://github.com/vuongthm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="size-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-accent-brand transition-colors"
              >
                <GithubIcon size={15} />
              </a>
            </div>
          </div>

          <div className="hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              {c.contentHeading}
            </p>
            <nav className="flex flex-col gap-2.5" aria-label="Footer content links">
              {CONTENT_LINKS[lang].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              {c.aboutHeading}
            </p>
            <nav className="flex flex-col gap-2.5" aria-label="Footer about links">
              {ABOUT_LINKS[lang].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <blockquote className="border-l-2 border-accent-brand/40 pl-4">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                &ldquo;{c.quoteText}&rdquo;
              </p>
              <cite className="block mt-2 text-xs text-muted-foreground not-italic">
                — Vuong
              </cite>
            </blockquote>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            {c.copyright}
          </p>
          <p className="text-xs text-muted-foreground text-center sm:text-right">
            Built with Next.js
          </p>
        </div>
      </div>
    </footer>
  )
}