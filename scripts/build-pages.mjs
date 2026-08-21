import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import matter from "gray-matter";
import { marked } from "marked";

const VAULT = path.join(process.cwd(), "vault");
const OUTPUT = path.join(process.cwd(), "website", "pages");
const TEMPLATE = path.join(process.cwd(), "website", "templates", "page.html");
const NAV_PATH = path.join(process.cwd(), "website", "navigation.json");
const ENGINE_STYLE_SOURCE = path.join(VAULT, "11 - Engine", "Engine.css");
const ENGINE_STYLE_OUTPUT = path.join(process.cwd(), "website", "styles", "11 - Engine.css");

const IGNORE = new Set(["_archive", "_inbox", "_private", "_templates", "dist"]);
const ENTITY_KEYWORDS = [
  "Snail", "Hermit Snail", "Spiral Snail", "Drift Snail",
  "Deer", "Owl", "Seal", "Iceform", "Treeform",
  "Collapse", "Drift", "Beyond",
  "Circulatory", "Nervous", "Respiratory",
  "Brinicle", "Humanoid", "Species"
];

function isMarkdown(file) {
  return file.toLowerCase().endsWith(".md");
}

function findMatchingPng(fullPath) {
  const dir = path.dirname(fullPath);
  const base = path.basename(fullPath, path.extname(fullPath));
  const pngPath = path.join(dir, `${base}.png`);

  return fs.existsSync(pngPath) ? pngPath : null;
}

export function extractReferencedEntities(mdText) {
  const found = new Set();

  for (const keyword of ENTITY_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(mdText)) {
      found.add(keyword);
    }
  }

  return Array.from(found);
}

export function normalizeEntityName(name) {
  return name.replace(/\s+/g, "");
}

function findEntityPng(dir, entityName) {
  const pngPath = path.join(dir, `${normalizeEntityName(entityName)}.png`);
  return fs.existsSync(pngPath) ? pngPath : null;
}

function encodeUrlPath(filePath) {
  return filePath
    .split(path.sep)
    .map(segment => encodeURIComponent(segment))
    .join("/");
}

function copyImage(relPath, pngPath) {
  const relativePngPath = path.join(path.dirname(relPath), path.basename(pngPath));
  const assetFile = path.join(process.cwd(), "website", "assets", relativePngPath);

  ensureDir(path.dirname(assetFile));
  fs.copyFileSync(pngPath, assetFile);

  return `/assets/${encodeUrlPath(relativePngPath)}`;
}

export function getEngineImageClass(relPath, imagePath) {
  if (getSectionName(relPath) !== "11 - Engine") return "";

  const normalizedPath = imagePath.replaceAll("\\", "/").toLowerCase();
  if (normalizedPath.includes("blueprint")) return "engine-blueprint";
  if (normalizedPath.includes("map")) return "engine-map";
  return "";
}

export function buildGalleryHtml(images) {
  if (images.length < 2) return "";

  const imageHtml = images
    .map(({ url, name, imageClass = "" }) => {
      const classes = ["gallery-image", imageClass].filter(Boolean).join(" ");
      return `  <img src="${url}" class="${classes}" alt="${escapeHtml(name)}">`;
    })
    .join("\n");

  return `<div class="gallery">\n${imageHtml}\n</div>\n`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSectionName(relPath) {
  const parts = relPath.split(/[\\/]/);
  return parts.length > 0 ? parts[0] : null;
}

function buildStylesBlock(section) {
  const links = ['<link rel="stylesheet" href="/styles/base.css">'];

  if (section) {
    links.push(`<link rel="stylesheet" href="/styles/${encodeURIComponent(section)}.css">`);
  }

  return links.join("\n  ");
}

function applyTemplate(html, meta, relPath, imageHtml = "") {
  const isVaultPage = relPath.includes(path.sep);
  const section = isVaultPage ? getSectionName(relPath) : null;
  const styles = isVaultPage ? buildStylesBlock(section) : "";
  const bodyAttributes = section === "11 - Engine"
    ? ' class="engine-section engine-blueprint-bg"'
    : "";
  const template = fs.readFileSync(TEMPLATE, "utf8");

  return template
    .replace("{{title}}", meta.title || "Untitled")
    .replace("{{content}}", imageHtml + html)
    .replace("{{tags}}", (meta.tags || []).join(", "))
    .replace("{{styles}}", styles)
    .replace("{{bodyAttributes}}", bodyAttributes);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walkVault(dir, rel = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const nav = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const relative = path.join(rel, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE.has(entry.name)) continue;

      const children = walkVault(full, relative);
      nav.push({ name: entry.name, path: relative, children });
    }

    if (entry.isFile() && isMarkdown(entry.name)) {
      const raw = fs.readFileSync(full, "utf8");
      const { data, content } = matter(raw);
      const html = marked(content);
      const pngPath = findMatchingPng(full);
      const pageImageClass = pngPath ? getEngineImageClass(relative, pngPath) : "";
      const pageImageClasses = ["page-image", pageImageClass].filter(Boolean).join(" ");
      const imageHtml = pngPath
        ? `<img src="${copyImage(relative, pngPath)}" class="${pageImageClasses}" alt="${escapeHtml(data.title || path.basename(full, path.extname(full)))}">\n`
        : "";
      const galleryImages = extractReferencedEntities(raw)
        .map(name => ({ name, pngPath: findEntityPng(path.dirname(full), name) }))
        .filter(image => image.pngPath)
        .map(image => ({
          name: image.name,
          url: copyImage(relative, image.pngPath),
          imageClass: getEngineImageClass(relative, image.pngPath)
        }));
      const galleryHtml = buildGalleryHtml(galleryImages);
      const finalHtml = applyTemplate(html, data, relative, imageHtml + galleryHtml);

      const outDir = path.join(OUTPUT, rel);
      ensureDir(outDir);

      const outFile = path.join(outDir, entry.name.replace(".md", ".html"));
      fs.writeFileSync(outFile, finalHtml);

      nav.push({
        name: data.title || entry.name.replace(".md", ""),
        path: relative.replace(".md", ".html"),
        leaf: true
      });
    }
  }

  return nav;
}

function main() {
  console.log("Building pages recursively from Vault…");

  fs.copyFileSync(ENGINE_STYLE_SOURCE, ENGINE_STYLE_OUTPUT);
  const navigation = walkVault(VAULT);
  fs.writeFileSync(NAV_PATH, JSON.stringify(navigation, null, 2));

  console.log("Page generation complete.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
