import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Establish absolute path directories based on current script location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root represents vuongthm.github.io/
const projectRootDir = path.resolve(__dirname, "..");
// Workspace root represents the parent directory github-page-project/
const workspaceRootDir = path.resolve(projectRootDir, "..");

const TRANSPARENT_PNG_BASE64 = "iVBOR0w0GgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const FALLBACK_PNG_BUFFER = Buffer.from(TRANSPARENT_PNG_BASE64, "base64");

const DUMMY_VIDEO_BASE64 = "AAAAIGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAAAhtZGF0AAAAFmZyZWUAAAAHbW9vdgAAAGxtdmhk";
const FALLBACK_VIDEO_BUFFER = Buffer.from(DUMMY_VIDEO_BASE64, "base64");

const FALLBACK_SVG_CONTENT = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e5e7eb"/></svg>`;

function cleanDirectory(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(source)) return;
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  for (const file of files) {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);
    if (fs.lstatSync(curSource).isDirectory()) {
      if (file !== "media" && !file.startsWith(".")) {
        copyFolderRecursiveSync(curSource, curTarget);
      }
    } else {
      fs.copyFileSync(curSource, curTarget);
    }
  }
}

function ensureFallbackAssets() {
  console.log("[Sync] Setting up assets pipeline fallback files...");

  // Setup dynamic albums directories using absolute paths
  const destAlbumsDir = path.join(projectRootDir, "content/albums");
  fs.mkdirSync(destAlbumsDir, { recursive: true });

  const defaultCategories = ["family", "friends", "me", "travel"];
  
  for (const cat of defaultCategories) {
    const catContentDir = path.join(destAlbumsDir, cat);
    
    // Generate placeholder metadata files
    for (const lang of ["en", "vi"]) {
      const langDir = path.join(catContentDir, lang);
      fs.mkdirSync(langDir, { recursive: true });
      const albumMdFile = path.join(langDir, "album.md");
      
      if (!fs.existsSync(albumMdFile)) {
        const titleVal = cat.charAt(0).toUpperCase() + cat.slice(1);
        const mdTemplate = `---
title: "${titleVal} Moments"
description: "A private safe keeping of our dynamic ${cat} memories, stories, and visual footprints."
coverImage: "/media/albums/${cat}/photo-1.png"
date: "2024-01-01"
---
# ${titleVal} Album
These are dynamic placeholders. Replace them inside your local sibling 'my-album' repository.`;
        fs.writeFileSync(albumMdFile, mdTemplate);
      }
    }

    // Generate fallback files inside public media folders
    const mediaDir = path.join(projectRootDir, `public/media/albums/${cat}`);
    fs.mkdirSync(mediaDir, { recursive: true });

    const fallbackPhotos = ["photo-1.png", "photo-2.png"];
    for (const photo of fallbackPhotos) {
      const photoPath = path.join(mediaDir, photo);
      if (!fs.existsSync(photoPath)) {
        fs.writeFileSync(photoPath, FALLBACK_PNG_BUFFER);
      }
    }

    const videoPath = path.join(mediaDir, "video-1.mp4");
    if (!fs.existsSync(videoPath)) {
      fs.writeFileSync(videoPath, FALLBACK_VIDEO_BUFFER);
    }

    const metaJsonPath = path.join(mediaDir, "metadata.json");
    if (!fs.existsSync(metaJsonPath)) {
      const metaTemplate = {
        "photo-1.png": {
          "title": { "en": `First ${cat} capture`, "vi": `Khoảnh khắc ${cat} đầu tiên` },
          "date": "2024-05-15",
          "note": { "en": "A warm visual memory recorded in pixel and light.", "vi": "Kỷ niệm đẹp được lưu lại qua dải ánh sáng ấm áp." }
        },
        "photo-2.png": {
          "title": { "en": `Second ${cat} capture`, "vi": `Khoảnh khắc ${cat} thứ hai` },
          "date": "2024-08-20",
          "note": { "en": "Another quiet footprint on this traveling journey.", "vi": "Một dấu chân lặng lẽ khác trên con đường hành trình." }
        },
        "video-1.mp4": {
          "title": { "en": "Dynamic Memory Clip", "vi": "Thước phim kỷ niệm động" },
          "date": "2024-11-10",
          "note": { "en": "Captured dynamic video movement from our workplace daily lives.", "vi": "Ghi lại những khoảnh khắc chuyển động thực tế từ cuộc sống hàng ngày." }
        }
      };
      fs.writeFileSync(metaJsonPath, JSON.stringify(metaTemplate, null, 2));
    }
  }

  // Generate stories fallbacks
  const destStoriesDir = path.join(projectRootDir, "content/stories");
  if (fs.existsSync(destStoriesDir)) {
    const activeSeries = fs.readdirSync(destStoriesDir).filter(f => {
      return fs.statSync(path.join(destStoriesDir, f)).isDirectory();
    });

    for (const folder of activeSeries) {
      const mediaDir = path.join(projectRootDir, `public/media/stories/${folder}`);
      const coverPath = path.join(mediaDir, "cover.png");
      
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }
      if (!fs.existsSync(coverPath)) {
        fs.writeFileSync(coverPath, FALLBACK_PNG_BUFFER);
      }
      if (folder.startsWith("internship-")) {
        for (const num of [1, 2, 3, 4, 5, 6]) {
          const albumImgPath = path.join(mediaDir, `album-${num}.png`);
          if (!fs.existsSync(albumImgPath)) {
            fs.writeFileSync(albumImgPath, FALLBACK_PNG_BUFFER);
          }
        }
      }
    }
  }

  // Setup notes fallbacks
  const expectedCategories = ["fundamentals", "protocols"];
  const expectedImages = ["layered-stack.svg", "osi-model.png", "tcp-ip-model.png", "network-traffic.svg", "tcp.png"];

  for (const cat of expectedCategories) {
    const mediaDir = path.join(projectRootDir, `public/media/notes/${cat}`);
    fs.mkdirSync(mediaDir, { recursive: true });

    for (const img of expectedImages) {
      const imgPath = path.join(mediaDir, img);
      if (!fs.existsSync(imgPath)) {
        if (img.endsWith(".svg")) {
          fs.writeFileSync(imgPath, FALLBACK_SVG_CONTENT);
        } else {
          fs.writeFileSync(imgPath, FALLBACK_PNG_BUFFER);
        }
      }
    }
  }
}

function syncContent() {
  const configPath = path.join(projectRootDir, "sync.config.json");
  if (!fs.existsSync(configPath)) {
    console.error("[Sync] sync.config.json not found!");
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  
  cleanDirectory(path.join(projectRootDir, "content"));
  cleanDirectory(path.join(projectRootDir, "public/media/stories"));
  cleanDirectory(path.join(projectRootDir, "public/media/notes"));
  cleanDirectory(path.join(projectRootDir, "public/media/albums"));

  for (const repo of config.repos) {
    const srcDir = path.join(workspaceRootDir, repo.name);
    if (!fs.existsSync(srcDir)) {
      console.log(`[Sync] Sibling folder for ${repo.name} not found at ${srcDir}, skipping sync.`);
      continue;
    }

    console.log(`[Sync] Syncing files from ${repo.name}...`);

    const folders = fs.readdirSync(srcDir).filter(f => {
      const fullPath = path.join(srcDir, f);
      return fs.statSync(fullPath).isDirectory() && !f.startsWith(".") && f !== "node_modules";
    });

    for (const folder of folders) {
      const folderPath = path.join(srcDir, folder);
      
      const destContentDir = path.join(
        projectRootDir,
        repo.name === "stories" ? `content/stories/${folder}` : 
        repo.name === "my-album" ? `content/albums/${folder}` : `content/notes/${folder}`
      );
      fs.mkdirSync(destContentDir, { recursive: true });
      
      for (const lang of ["en", "vi"]) {
        const langPath = path.join(folderPath, lang);
        if (fs.existsSync(langPath)) {
          const destLangDir = path.join(destContentDir, lang);
          fs.mkdirSync(destLangDir, { recursive: true });
          copyFolderRecursiveSync(langPath, destLangDir);
        }
      }

      // Sync specific category metadata files
      const configFiles = ["series.md", "album.md"];
      for (const configName of configFiles) {
        const configPath = path.join(folderPath, configName);
        if (fs.existsSync(configPath)) {
          fs.copyFileSync(configPath, path.join(destContentDir, configName));
        }
      }

      const mediaPath = path.join(folderPath, "media");
      if (fs.existsSync(mediaPath)) {
        const destMediaDir = path.join(
          projectRootDir,
          repo.name === "stories" ? `public/media/stories/${folder}` : 
          repo.name === "my-album" ? `public/media/albums/${folder}` : `public/media/notes/${folder}`
        );
        fs.mkdirSync(destMediaDir, { recursive: true });
        copyFolderRecursiveSync(mediaPath, destMediaDir);
        console.log(`[Sync] Copied media for ${folder} to public/media.`);
      }
    }
  }

  // Guarantee assets are populated
  ensureFallbackAssets();
}

syncContent();