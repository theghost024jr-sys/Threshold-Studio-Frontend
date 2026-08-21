import fs from "fs";
import path from "path";

const VAULT = path.join(process.cwd(), "vault");
const OUTPUT = path.join(process.cwd(), "website", "assets");

const IGNORE = new Set(["_archive", "_inbox", "_private", "_templates", "dist"]);
const ASSET_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function isAsset(file) {
  return ASSET_EXT.has(path.extname(file).toLowerCase());
}

function walk(dir, rel = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const relative = path.join(rel, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE.has(entry.name)) continue;
      walk(full, relative);
    }

    if (entry.isFile() && isAsset(entry.name)) {
      const outDir = path.join(OUTPUT, rel);
      ensureDir(outDir);

      const outFile = path.join(outDir, entry.name);
      fs.copyFileSync(full, outFile);
    }
  }
}

function main() {
  console.log("Syncing assets from Vault...");
  walk(VAULT);
  console.log("Asset sync complete.");
}

main();