import fs from "fs";
import path from "path";

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
      console.log(`[Sync] Sibling folder for ${repo.name} not found at ${srcDir}, skipping.`);
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
}

syncContent();