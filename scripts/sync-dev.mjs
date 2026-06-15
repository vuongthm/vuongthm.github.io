import fs from "fs";
import path from "path";

// Buffer ảnh PNG trong suốt kích thước 1x1 pixel siêu nhẹ
const TRANSPARENT_PNG_BASE64 = "iVBOR0w0GgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const FALLBACK_PNG_BUFFER = Buffer.from(TRANSPARENT_PNG_BASE64, "base64");

// Mã nguồn tệp SVG dự phòng tĩnh cho các tài nguyên đồ họa vector
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
  console.log("[Sync] Checking and generating fallback assets to prevent Next.js routing errors...");

  // 1. Sinh ảnh bìa mặc định cho các bộ truyện (Stories) nếu chưa có
  const expectedSeries = ["between-two-harbors", "fearless-years", "nameless-child", "unnamed-years"];
  for (const series of expectedSeries) {
    const mediaDir = path.resolve(`public/media/stories/${series}`);
    const coverPath = path.join(mediaDir, "cover.png");
    
    if (!fs.existsSync(coverPath)) {
      fs.mkdirSync(mediaDir, { recursive: true });
      fs.writeFileSync(coverPath, FALLBACK_PNG_BUFFER);
      console.log(`[Sync] -> Generated fallback cover.png for stories/${series}/`);
    }
  }

  // 2. Sinh ảnh sơ đồ mặc định cho các danh mục Ghi chú (Notes) nếu chưa có
  const expectedCategories = ["fundamentals", "protocols"];
  const expectedImages = [
    "layered-stack.svg", 
    "osi-model.png", 
    "tcp-ip-model.png", 
    "network-traffic.svg", 
    "tcp.png"
  ];

  for (const cat of expectedCategories) {
    const mediaDir = path.resolve(`public/media/notes/${cat}`);
    fs.mkdirSync(mediaDir, { recursive: true });

    for (const img of expectedImages) {
      const imgPath = path.join(mediaDir, img);
      if (!fs.existsSync(imgPath)) {
        if (img.endsWith(".svg")) {
          fs.writeFileSync(imgPath, FALLBACK_SVG_CONTENT);
        } else {
          fs.writeFileSync(imgPath, FALLBACK_PNG_BUFFER);
        }
        console.log(`[Sync] -> Generated fallback ${img} for notes/${cat}/`);
      }
    }
  }
}

function syncContent() {
  const configPath = path.resolve("sync.config.json");
  if (!fs.existsSync(configPath)) {
    console.error("[Sync] sync.config.json not found!");
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  
  cleanDirectory(path.resolve("content"));
  cleanDirectory(path.resolve("public/media/stories"));
  cleanDirectory(path.resolve("public/media/notes"));

  for (const repo of config.repos) {
    const srcDir = path.resolve("..", repo.name);
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
      
      const destContentDir = path.resolve(repo.name === "stories" ? `content/stories/${folder}` : `content/notes/${folder}`);
      fs.mkdirSync(destContentDir, { recursive: true });
      
      for (const lang of ["en", "vi"]) {
        const langPath = path.join(folderPath, lang);
        if (fs.existsSync(langPath)) {
          const destLangDir = path.join(destContentDir, lang);
          fs.mkdirSync(destLangDir, { recursive: true });
          copyFolderRecursiveSync(langPath, destLangDir);
        }
      }

      const seriesMd = path.join(folderPath, "series.md");
      if (fs.existsSync(seriesMd)) {
        fs.copyFileSync(seriesMd, path.join(destContentDir, "series.md"));
      }

      const mediaPath = path.join(folderPath, "media");
      if (fs.existsSync(mediaPath)) {
        const destMediaDir = path.resolve(repo.name === "stories" ? `public/media/stories/${folder}` : `public/media/notes/${folder}`);
        fs.mkdirSync(destMediaDir, { recursive: true });
        copyFolderRecursiveSync(mediaPath, destMediaDir);
        console.log(`[Sync] Copied media for ${folder} to public/media.`);
      }
    }
  }

  // Tự động kiểm tra và bù đắp các ảnh bìa, sơ đồ dự phòng còn thiếu
  ensureFallbackAssets();
}

syncContent();