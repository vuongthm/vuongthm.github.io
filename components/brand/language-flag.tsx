import type { Locale } from "@/lib/i18n/config"

/** Inline vector flags render consistently without relying on system emoji fonts. */
export function LanguageFlag({ locale }: { locale: Locale }) {
  return (
    <svg className="language-flag" viewBox="0 0 30 20" aria-hidden="true" focusable="false">
      {locale === "zh" ? (
        <>
          <path fill="#de2910" d="M0 0h30v20H0z" />
          <path
            fill="#ffde00"
            d="m6 3 1 2.2 2.4.2-1.8 1.6.6 2.3L6 8.1 3.8 9.3l.6-2.3-1.8-1.6L5 5.2z"
          />
          <path
            fill="#ffde00"
            d="m12 2 .4.8.9.1-.7.6.2.9-.8-.5-.8.5.3-.9-.7-.6.8-.1zm3 3 .4.8.9.1-.7.6.2.9-.8-.5-.8.5.3-.9-.7-.6.8-.1zm0 4 .4.8.9.1-.7.6.2.9-.8-.5-.8.5.3-.9-.7-.6.8-.1zm-3 3 .4.8.9.1-.7.6.2.9-.8-.5-.8.5.3-.9-.7-.6.8-.1z"
          />
        </>
      ) : locale === "ja" ? (
        <>
          <path fill="#fff" d="M0 0h30v20H0z" />
          <circle fill="#bc002d" cx="15" cy="10" r="6" />
        </>
      ) : locale === "vi" ? (
        <>
          <path fill="#da251d" d="M0 0h30v20H0z" />
          <path
            fill="#ffdf00"
            d="m15 4 1.8 4.3 4.6.4-3.5 3 1.1 4.5-4-2.4-4 2.4 1.1-4.5-3.5-3 4.6-.4z"
          />
        </>
      ) : (
        <>
          <path fill="#012169" d="M0 0h30v20H0z" />
          <path stroke="#fff" strokeWidth="5" d="m0 0 30 20M30 0 0 20" />
          <path stroke="#c8102e" strokeWidth="2" d="m0 0 15 10m15 10L15 10M30 0 15 10M0 20l15-10" />
          <path stroke="#fff" strokeWidth="7" d="M15 0v20M0 10h30" />
          <path stroke="#c8102e" strokeWidth="4" d="M15 0v20M0 10h30" />
        </>
      )}
    </svg>
  )
}
