import fs from "fs";
import path from "path";
import CryptoJS from "crypto-js";
import { fileURLToPath } from "url";

// Establish absolute path directories based on current script location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRootDir = path.resolve(__dirname, "..");

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
  const contentDir = path.join(projectRootDir, "content");
  
  const allSeries = [];
  const allChapters = [];
  const allNotes = [];
  const allAlbums = [];

  let passwordMap = {};
  const passwordMapPath = path.join(projectRootDir, "passwords.json");
  if (fs.existsSync(passwordMapPath)) {
    try {
      passwordMap = JSON.parse(fs.readFileSync(passwordMapPath, "utf-8"));
      console.log("[Encrypt] Successfully loaded passwords.json");
    } catch (err) {
      console.error("[Encrypt] Error parsing passwords.json:", err);
    }
  }

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

              let chapterContent = body;
              let isLocked = false;
              if (data.locked === "true" || data.locked === true) {
                isLocked = true;
                const chapterSlug = file.replace(".md", "");
                const securePassword = passwordMap[chapterSlug];
                
                if (securePassword) {
                  chapterContent = CryptoJS.AES.encrypt(body, securePassword.trim()).toString();
                } else {
                  console.warn(`[Encrypt] Password not found for chapter: ${seriesSlug}/${chapterSlug}`);
                }
              }

              allChapters.push({
                slug: file.replace(".md", ""),
                seriesSlug: seriesSlug,
                part: parseInt(data.part) || 1,
                title: data.title || file,
                preview: data.preview || "",
                date: data.date || "",
                content: chapterContent,
                isLocked: isLocked,
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

              let noteContent = body;
              let isLocked = false;
              if (data.locked === "true" || data.locked === true) {
                isLocked = true;
                const noteSlug = file.replace(".md", "");
                const securePassword = passwordMap[noteSlug];

                if (securePassword) {
                  noteContent = CryptoJS.AES.encrypt(body, securePassword.trim()).toString();
                } else {
                  console.warn(`[Encrypt] Password not found for note: ${noteSlug}`);
                }
              }

              allNotes.push({
                slug: file.replace(".md", ""),
                title: data.title || file,
                description: data.description || "",
                tags: data.tags || [],
                date: data.date || "",
                readingTime: readingTime,
                content: noteContent,
                // Parse optional weight from Frontmatter (fallback to 999 if empty)
                weight: parseInt(data.weight) || 999,
                isLocked: isLocked,
                lang: lang
              });
            }
          }
        }
      }
    }

    // 3. Scan dynamic Decoupled Albums
    const albumsDir = path.join(contentDir, "albums");
    if (fs.existsSync(albumsDir)) {
      const albumFolders = fs.readdirSync(albumsDir);
      for (const albumSlug of albumFolders) {
        const albumPath = path.join(albumsDir, albumSlug);
        if (!fs.statSync(albumPath).isDirectory()) continue;

        for (const lang of ["en", "vi"]) {
          const langPath = path.join(albumPath, lang);
          if (fs.existsSync(langPath)) {
            const albumMdFile = path.join(langPath, "album.md");
            if (fs.existsSync(albumMdFile)) {
              const { data, body } = parseFrontmatter(fs.readFileSync(albumMdFile, "utf-8"));
              
              const mediaItems = [];
              const mediaPublicDir = path.join(projectRootDir, `public/media/albums/${albumSlug}`);
              const metaJsonPath = path.join(mediaPublicDir, "metadata.json");
              
              let fileMetadata = {};
              if (fs.existsSync(metaJsonPath)) {
                try {
                  fileMetadata = JSON.parse(fs.readFileSync(metaJsonPath, "utf-8"));
                } catch (e) {
                  console.error(`[Album] Failed to parse metadata.json for ${albumSlug}`, e);
                }
              }

              let firstImageFile = "";
              if (fs.existsSync(mediaPublicDir)) {
                const mediaFiles = fs.readdirSync(mediaPublicDir).filter(f => {
                  const ext = path.extname(f).toLowerCase();
                  return [".png", ".jpg", ".jpeg", ".webp", ".mp4", ".webm"].includes(ext);
                });

                const imageFile = mediaFiles.find(f => {
                  const ext = path.extname(f).toLowerCase();
                  return [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
                });
                if (imageFile) {
                  firstImageFile = `/media/albums/${albumSlug}/${imageFile}`;
                }

                for (const filename of mediaFiles) {
                  const ext = path.extname(filename).toLowerCase();
                  const isVideo = [".mp4", ".webm"].includes(ext);
                  
                  const customMeta = fileMetadata[filename] || {};
                  const itemTitle = (customMeta.title && customMeta.title[lang]) || filename;
                  const itemDate = customMeta.date || data.date || "2024-01-01";
                  const itemNote = (customMeta.note && customMeta.note[lang]) || "";

                  mediaItems.push({
                    filename: filename,
                    src: `/media/albums/${albumSlug}/${filename}`,
                    type: isVideo ? "video" : "image",
                    title: itemTitle,
                    date: itemDate,
                    note: itemNote
                  });
                }
              }

              allAlbums.push({
                slug: albumSlug,
                title: data.title || albumSlug,
                description: data.description || "",
                coverImage: data.coverImage || firstImageFile || `/media/albums/${albumSlug}/photo-1.png`,
                date: data.date || "2024-01-01",
                lang: lang,
                content: body,
                media: mediaItems
              });
            }
          }
        }
      }
    }
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
  weight?: number; // Added optional weight parameter
  isLocked?: boolean;
  lang: Lang;
}

export interface AlbumMediaItem {
  filename: string;
  src: string;
  type: "image" | "video";
  title: string;
  date: string;
  note: string;
}

export interface Album {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  date: string;
  lang: Lang;
  content: string;
  media: AlbumMediaItem[];
}

export interface TagInfo {
  tag: string;
  count: number;
}

export const allSeries: Series[] = ${JSON.stringify(allSeries, null, 2)};
export const allChapters: Chapter[] = ${JSON.stringify(allChapters, null, 2)};
export const allNotes: Note[] = ${JSON.stringify(allNotes, null, 2)};
export const allAlbums: Album[] = ${JSON.stringify(allAlbums, null, 2)};

function groupBySlug<T extends { slug: string; lang: Lang }>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const item of items) {
    const bucket = grouped.get(item.slug) ?? []
    bucket.push(item)
    grouped.set(item.slug, bucket)
  }
  return grouped
}

function selectByLang<T extends { slug: string; lang: Lang }>(items: T[], lang: Lang): T[] {
  return Array.from(groupBySlug(items).values()).map((bucket) => bucket.find((item) => item.lang === lang) ?? bucket[0])
}

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

// Double sort algorithm: Prioritize custom weight ASC, then sort secondarily by date DESC
export function getVisibleNotes(lang: Lang = "en"): Note[] {
  return selectByLang(allNotes, lang).sort((a, b) => {
    const wA = a.weight ?? 999;
    const wB = b.weight ?? 999;
    if (wA !== wB) return wA - wB;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function getRelatedNotes(note: Note, limit = 3): Note[] {
  return getVisibleNotes(note.lang)
    .filter((item) => item.slug !== note.slug && item.tags.some((tag) => note.tags.includes(tag)))
    .slice(0, limit)
}

export function getVisibleAlbums(lang: Lang = "en"): Album[] {
  return selectByLang(allAlbums, lang).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getAlbumBySlug(slug: string, lang: Lang = "en"): Album | undefined {
  return selectOne(allAlbums, slug, lang)
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

// Enhanced double-type tag sorting: Keep learning roadmap sequence intact
export function getPostsByTag(tag: string, lang: Lang = "en"): Array<{ type: "story"; item: Series } | { type: "note"; item: Note }> {
  const posts: Array<{ type: "story"; item: Series } | { type: "note"; item: Note }> = []
  for (const series of getVisibleSeries(lang)) {
    if (series.tags.includes(tag)) posts.push({ type: "story", item: series })
  }
  for (const note of getVisibleNotes(lang)) {
    if (note.tags.includes(tag)) posts.push({ type: "note", item: note })
  }
  return posts.sort((a, b) => {
    if (a.type === "note" && b.type === "note") {
      const wA = (a.item as Note).weight ?? 999;
      const wB = (b.item as Note).weight ?? 999;
      if (wA !== wB) return wA - wB;
    }
    const dateA = a.type === "story" ? a.item.startDate : a.item.date;
    const dateB = b.type === "story" ? b.item.startDate : b.item.date;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
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

  fs.mkdirSync(path.join(projectRootDir, "lib"), { recursive: true });
  fs.writeFileSync(path.join(projectRootDir, "lib/content.generated.ts"), outputCode);
  console.log("[Generate] lib/content.generated.ts compiled successfully.");
}

generateData();