import { copy } from "@/lib/i18n/copy"
import { notFound } from "next/navigation"
import { isLocale } from "@/lib/i18n/config"
import { metadataFor } from "@/lib/seo"
import { PageHeading } from "@/components/layout/page-heading"
import { SavedList } from "@/components/reading/saved-list"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? {
        ...metadataFor(
          copy(lang, "Bài đã lưu", "Saved articles"),
          copy(
            lang,
            "Tủ sách nhỏ trong trình duyệt của bạn.",
            "A little reading shelf in your browser.",
          ),
          "/saved",
          lang,
        ),
        robots: { index: false, follow: true },
      }
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <main id="main-content">
      <PageHeading
        eyebrow={
          lang === "zh" ? "稍后阅读" : lang === "ja" ? "あとで読む" : "YOUR SHELF / READ IT LATER"
        }
        title={copy(lang, "Một góc dành cho lần sau.", "A little shelf for later.")}
        description={copy(
          lang,
          "Những bài viết bạn muốn quay lại. Được lưu trên trình duyệt này, không cần tài khoản.",
          "Articles you want to return to. Saved in this browser, without an account.",
        )}
      />
      <div className="wrap">
        <SavedList />
      </div>
    </main>
  )
}
