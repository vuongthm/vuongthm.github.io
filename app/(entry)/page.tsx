import { generateMetadata as homeMetadata } from "@/app/[lang]/page"
import { defaultLocale } from "@/lib/i18n/config"

export async function generateMetadata() {
  return {
    ...(await homeMetadata({ params: Promise.resolve({ lang: defaultLocale }) })),
    robots: { index: false, follow: true },
  }
}
export default function Entry() {
  const home = `/${defaultLocale}/`
  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${home}`} />
      <script
        dangerouslySetInnerHTML={{ __html: `window.location.replace(${JSON.stringify(home)});` }}
      />
    </>
  )
}
