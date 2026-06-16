import fs from "fs";
import path from "path";
import CryptoJS from "crypto-js"; // Import crypto-js for build-time AES encryption

function parseFrontmatter(fileContent) {
  const frontmatterRegex = /^---\r?\n([\s\S]+?)\r?\n---/;
  const match = fileContent.match(frontmatterRegex);
  if (!match) return { data: {}, body: fileContent };

  const rawYaml = match[1];
  const body = fileContent.replace(frontmatterRegex, "").trim();
  const data = {};

  rawYaml.split(/\r?\n/).forEach((line) => {
    const colonIdx = line.indexOf(":");
    if (colonIdx > -1) {
      const key = line.slice(0, colonIdx).trim().replace(/['"]/g, "");
      let val = line.slice(colonIdx + 1).trim();
      if (val.startsWith("[") && val.endsWith("]")) {
        val = val.slice(1, -1).split(",").map(v => v.trim().replace(/['"]/g, ""));
      } else {
        val = val.replace(/['"]/g, "");
      }
      data[key] = val;
    }
  });

  return { data, body };
}

function generateData() {
  const contentDir = path.resolve("content");
  
  const allSeries = [];
  const allChapters = [];
  const allNotes = [];

  if (fs.existsSync(contentDir)) {
    // 1. Scan Stories Content
    const storiesDir = path.join(contentDir, "stories");
    if (fs.existsSync(storiesDir)) {
      const seriesFolders = fs.readdirSync(storiesDir);
      for (const seriesSlug of seriesFolders) {
        const seriesPath = path.join(storiesDir, seriesSlug);
        if (!fs.statSync(seriesPath).isDirectory()) continue;

        for (const lang of ["en", "vi"]) {
          const langPath = path.join(seriesPath, lang);
          if (fs.existsSync(langPath)) {
            const seriesMdFile = path.join(langPath, "series.md");
            if (fs.existsSync(seriesMdFile)) {
              const { data } = parseFrontmatter(fs.readFileSync(seriesMdFile, "utf-8"));
              allSeries.push({
                slug: seriesSlug,
                title: data.title || seriesSlug,
                description: data.description || "",
                coverImage: data.coverImage || "",
                chapterCount: 0,
                status: data.status || "ongoing",
                tags: data.tags || [],
                startDate: data.date || "",
                lang: lang
              });
            }

            const files = fs.readdirSync(langPath).filter(f => f.endsWith(".md") && f !== "series.md");
            for (const file of files) {
              const filePath = path.join(langPath, file);
              const rawContent = fs.readFileSync(filePath, "utf-8");
              const { data, body } = parseFrontmatter(rawContent);

              // Encrypt chapter content if password frontmatter exists
              let chapterContent = body;
              let isLocked = false;
              if (data.password) {
                isLocked = true;
                chapterContent = CryptoJS.AES.encrypt(body, data.password.toString().trim()).toString();
              }

              allChapters.push({
                slug: file.replace(".md", ""),
                seriesSlug: seriesSlug,
                part: parseInt(data.part) || 1,
                title: data.title || file,
                preview: data.preview || "",
                date: data.date || "",
                content: chapterContent,
                isLocked: isLocked, // Mark as locked
                lang: lang
              });
            }
          }
        }
      }
    }

    allSeries.forEach(s => {
      s.chapterCount = allChapters.filter(c => c.seriesSlug === s.slug && c.lang === s.lang).length;
    });

    // 2. Scan Notes Content
    const notesDir = path.join(contentDir, "notes");
    if (fs.existsSync(notesDir)) {
      const noteFolders = fs.readdirSync(notesDir);
      for (const category of noteFolders) {
        const catPath = path.join(notesDir, category);
        if (!fs.statSync(catPath).isDirectory()) continue;

        for (const lang of ["en", "vi"]) {
          const langPath = path.join(catPath, lang);
          if (fs.existsSync(langPath)) {
            const files = fs.readdirSync(langPath).filter(f => f.endsWith(".md"));
            for (const file of files) {
              const filePath = path.join(langPath, file);
              const rawContent = fs.readFileSync(filePath, "utf-8");
              const { data, body } = parseFrontmatter(rawContent);

              const words = body.trim().split(/\s+/).filter(Boolean).length;
              const readingTime = Math.max(1, Math.round(words / 200));

              // Encrypt note content if password frontmatter exists
              let noteContent = body;
              let isLocked = false;
              if (data.password) {
                isLocked = true;
                noteContent = CryptoJS.AES.encrypt(body, data.password.toString().trim()).toString();
              }

              allNotes.push({
                slug: file.replace(".md", ""),
                title: data.title || file,
                description: data.description || "",
                tags: data.tags || [],
                date: data.date || "",
                readingTime: readingTime,
                content: noteContent,
                isLocked: isLocked, // Mark as locked
                lang: lang
              });
            }
          }
        }
      }
    }
  } else {
    console.log("[Generate] content directory not found. Generating template with empty collections.");
  }

  const outputCode = `// Generated automatically. Do not edit.
export type Lang = "en" | "vi";

export interface Series {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  chapterCount: number;
  status: "ongoing" | "completed";
  tags: string[];
  startDate: string;
  lang: Lang;
}

export interface Chapter {
  slug: string;
  seriesSlug: string;
  part: number;
  title: string;
  preview: string;
  date: string;
  content: string;
  isLocked?: boolean;
  lang: Lang;
}

export interface Note {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  readingTime: number;
  content: string;
  isLocked?: boolean;
  lang: Lang;
}

export interface TagInfo {
  tag: string;
  count: number;
}

export const allSeries: Series[] = ${JSON.stringify(allSeries, null, 2)};
export const allChapters: Chapter[] = ${JSON.stringify(allChapters, null, 2)};
export const allNotes: Note[] = ${JSON.stringify(allNotes, null, 2)};

function groupBySlug<T extends { slug: string; lang: Lang }>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const item of items) {
    const bucket = grouped.get(item.slug) ?? []
    bucket.push(item)
    grouped.set(item.slug, bucket)
  }
  return grouped
}

// Select by Lang with deduplication logic
function selectByLang<T extends { slug: string; lang: Lang }>(items: T[], lang: Lang): T[] {
  return Array.from(groupBySlug(items).values()).map((bucket) => bucket.find((item) => item.lang === lang) ?? bucket[0])
}

// Select single item by slug and lang fallback
function selectOne<T extends { slug: string; lang: Lang }>(items: T[], slug: string, lang: Lang): T | undefined {
  const matches = items.filter((item) => item.slug === slug)
  return matches.find((item) => item.lang === lang) ?? matches[0]
}

export function getSeriesBySlug(slug: string, lang: Lang = "en"): Series | undefined {
  return selectOne(allSeries, slug, lang)
}

export function getVisibleSeries(lang: Lang = "en"): Series[] {
  return selectByLang(allSeries, lang).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
}

export function getChaptersBySeriesSlug(seriesSlug: string, lang: Lang = "en"): Chapter[] {
  const exact = allChapters.filter((chapter) => chapter.seriesSlug === seriesSlug && chapter.lang === lang)
  const chosen = exact.length > 0 ? exact : allChapters.filter((chapter) => chapter.seriesSlug === seriesSlug)
  return [...chosen].sort((a, b) => a.part - b.part)
}

export function getChapter(seriesSlug: string, chapterSlug: string, lang: Lang = "en"): Chapter | undefined {
  return getChaptersBySeriesSlug(seriesSlug, lang).find((chapter) => chapter.slug === chapterSlug)
}

export function getNoteBySlug(slug: string, lang: Lang = "en"): Note | undefined {
  return selectOne(allNotes, slug, lang)
}

export function getVisibleNotes(lang: Lang = "en"): Note[] {
  return selectByLang(allNotes, lang).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getRelatedNotes(note: Note, limit = 3): Note[] {
  return getVisibleNotes(note.lang)
    .filter((item) => item.slug !== note.slug && item.tags.some((tag) => note.tags.includes(tag)))
    .slice(0, limit)
}

export function getAllTags(lang: Lang = "en"): TagInfo[] {
  const counts: Record<string, number> = {}
  for (const series of getVisibleSeries(lang)) {
    for (const tag of series.tags) counts[tag] = (counts[tag] ?? 0) + 1
  }
  for (const note of getVisibleNotes(lang)) {
    for (const tag of note.tags) counts[tag] = (counts[tag] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export function getPostsByTag(tag: string, lang: Lang = "en"): Array<{ type: "story"; item: Series } | { type: "note"; item: Note }> {
  const posts: Array<{ type: "story"; item: Series } | { type: "note"; item: Note }> = []
  for (const series of getVisibleSeries(lang)) {
    if (series.tags.includes(tag)) posts.push({ type: "story", item: series })
  }
  for (const note of getVisibleNotes(lang)) {
    if (note.tags.includes(tag)) posts.push({ type: "note", item: note })
  }
  const getDate = (entry: (typeof posts)[number]) => entry.type === "story" ? entry.item.startDate : entry.item.date
  return posts.sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime())
}

export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export function formatDate(dateStr: string, lang: Lang = "en"): string {
  const date = new Date(dateStr)
  if (lang === "vi") {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}
`;

  fs.mkdirSync(path.resolve("lib"), { recursive: true });
  fs.writeFileSync(path.resolve("lib/content.generated.ts"), outputCode);
  console.log("[Generate] lib/content.generated.ts generated successfully.");
}

generateData();