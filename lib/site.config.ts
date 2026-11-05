import { localeCodes, localized, type Locale } from "@/lib/i18n/config"
export const siteConfig = {
  name: "Vuong",
  shortName: "vuongthm",
  url: "https://vuongthm.id.vn",
  author: "Vuong",
  locales: localeCodes,
  description: {
    vi: "Trang cá nhân của Vuong — ghi chép về công nghệ, dự án và những trải nghiệm trên hành trình.",
    en: "Vuong’s personal space for technology notes, projects, and experiences along the way.",
    ja: "Vuongが学んだ技術、取り組んだプロジェクト、日々の経験を記録する個人サイト。",
    zh: "Vuong 的个人空间，记录技术笔记、项目与一路上的经历。",
  },
  github: "https://github.com/vuongthm",
  email: "vuongthm.it@gmail.com",
  nav: [
    { key: "knowledge", path: "/notes" },
    { key: "topics", path: "/topics" },
    { key: "projects", path: "/projects" },
    { key: "stories", path: "/stories" },
    { key: "corner", path: "/corner" },
    { key: "about", path: "/about" },
  ] as const,
}
export function pageAlternates(path: string, locale: Locale, available: Locale[] = localeCodes) {
  return {
    canonical: siteConfig.url + localized(path, locale) + (path.endsWith("/") ? "" : "/"),
    languages: Object.fromEntries(
      available.map((lang) => [
        lang,
        siteConfig.url + localized(path, lang) + (path.endsWith("/") ? "" : "/"),
      ]),
    ),
  }
}
