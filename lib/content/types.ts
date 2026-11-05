import type { Locale } from "@/lib/i18n/config"
export type ContentKind = "note" | "guide" | "lab" | "writeup" | "reference"
export type Level = "beginner" | "intermediate" | "advanced"
export interface EntryMeta {
  moduleId?: string
  id: string
  translationKey: string
  slug: string
  locale: Locale
  title: string
  summary: string
  topics: string[]
  tags: string[]
  kind: ContentKind
  level: Level
  publishedAt: string
  updatedAt: string
  readingTime: number
  weight: number
  href: string
  featured: boolean
  encrypted?: boolean
  seriesSlug?: string
  part?: number
  cover?: string
  learning?: { path: string; section: string; step: string }
}
export interface Entry extends EntryMeta {
  body: string
}
export interface SearchEntry extends EntryMeta {
  excerpt: string
}
export interface Story {
  photos?: GalleryPhoto[]
  body?: string
  moduleId?: string
  id: string
  slug: string
  locale: Locale
  title: string
  summary: string
  cover: string
  date: string
  status: string
  tags: string[]
  chapters: string[]
  encrypted?: boolean
}
export interface Project {
  cover?: string
  photos?: GalleryPhoto[]
  encrypted?: boolean
  moduleId: string
  body: string
  bodyLocale: Locale
  repository?: string
  slug: string
  title: string
  description: Record<Locale, string>
  category: string
  stack: string[]
  href: string
  status: "active" | "learning"
  year: string
}
export interface LearningPath {
  moduleId?: string
  source?: { title: string; url: string }
  outcomes?: Record<Locale, string>[]
  sections?: {
    id: string
    title: Record<Locale, string>
    steps: { id: string; title: Record<Locale, string>; entry?: string; translationKey?: string }[]
  }[]
  slug: string
  title: Record<Locale, string>
  description: Record<Locale, string>
  entries: string[]
  topic: string
}
export interface ContentDatabase {
  entries: Entry[]
  stories: Story[]
  projects: ProjectDocument[]
  paths: LearningPath[]
  corners?: CornerDocument[]
  albums?: AlbumDocument[]
  journey: JourneyMilestone[]
}

export interface AlbumDocument {
  story?: boolean
  id: string
  slug: string
  moduleId: string
  encrypted?: boolean
  title: Record<Locale, string>
  description: Record<Locale, string>
  bodies: Record<Locale, string>
  bodyLocales: Record<Locale, Locale>
  cover: string
  count: number
  items: GalleryPhoto[]
}
export interface GalleryPhoto {
  width?: number
  height?: number
  kind?: "image" | "video"
  date?: string
  src: string
  title: Record<Locale, string>
  place: string
}
export interface ProfileMilestone {
  label: string
  title: Record<Locale, string>
  description: Record<Locale, string>
  href?: string
}
export interface ProfileAchievement {
  category: Record<Locale, string>
  title: Record<Locale, string>
  description: Record<Locale, string>
  href?: string
}
export interface AuthorProfile {
  portrait: string
  bio: Record<Locale, string>[]
  interests: string[]
  timeline: ProfileMilestone[]
  achievements: ProfileAchievement[]
  photos: GalleryPhoto[]
}

export interface JourneyMilestone {
  encrypted?: boolean
  moduleId: string
  bodies: Record<Locale, string>
  bodyLocales: Record<Locale, Locale>
  photos?: GalleryPhoto[]
  id: string
  sample?: boolean
  year?: string
  label: Record<Locale, string>
  period: Record<Locale, string>
  title: Record<Locale, string>
  description: Record<Locale, string>
  status: "completed" | "current" | "planned"
  content?: Record<Locale, string[]>
  storySlug?: string
  entrySlugs?: string[]
  photoSources?: string[]
  illustration?: GalleryPhoto
  includeStoryCover?: boolean
  page?: "about" | "projects"
}
export interface JourneyItem extends JourneyMilestone {
  body: string
  bodyLocale: Locale
  href: string
  links: { href: string; title: string; sourceLocale?: Locale }[]
  photos: GalleryPhoto[]
}

export interface ProjectDocument extends Omit<Project, "title" | "href" | "body" | "bodyLocale"> {
  id: string
  title: Record<Locale, string>
  bodies: Record<Locale, string>
  bodyLocales: Record<Locale, Locale>
}
export interface ContentModule {
  id: string
  adapter: "notes" | "articles" | "stories" | "journey" | "projects" | "albums" | "corner"
  title: Record<Locale, string>
  description: Record<Locale, string>
  topics: string[]
  order: number
  count: number
  href: string
}

export type JourneyPreview = Pick<
  JourneyItem,
  "id" | "href" | "label" | "title" | "description" | "status" | "sample" | "photos"
>

export interface CornerDocument {
  id: string
  slug: string
  moduleId: string
  encrypted?: boolean
  category: "books" | "films" | "podcasts"
  title: Record<Locale, string>
  description: Record<Locale, string>
  creator: Record<Locale, string>
  bodies: Record<Locale, string>
  bodyLocales: Record<Locale, Locale>
  cover: string
  source?: string
  sample: boolean
  shelfStatus: "planned" | "current" | "finished"
  order: number
}
export interface CornerItem extends Omit<CornerDocument, "bodies" | "bodyLocales"> {
  body: string
  bodyLocale: Locale
  href: string
}
