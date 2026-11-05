import type { MetadataRoute } from "next"
import { localeCodes } from "@/lib/i18n/config"
import { siteConfig } from "@/lib/site.config"
export const dynamic = "force-static"
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/vault-data/",
        ...localeCodes.flatMap((locale) => [`/${locale}/vault/`, `/${locale}/saved/`]),
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
