import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const VAULT = path.join(process.cwd(), "vault");
const OUTPUT = path.join(process.cwd(), "website", "pages");
const TEMPLATE = path.join(process.cwd(), "website", "templates", "page.html");
const NAV_PATH = path.join(process.cwd(), "website", "navigation.json");

const IGNORE = new Set(["_archive", "_inbox", "_private", "_templates", "dist"]);

function isMarkdown(file) {
  return file.toLowerCase().endsWith(".md");
}

function getSectionName(relPath) {
  const parts = relPath.split(path.sep);
  return parts.length > 0 ? parts[0] : null;
}

function buildStylesBlock(section) {
  const links = ['<link rel="stylesheet" href="/styles/base.css">'];

  if (section) {
    links.push(`<link rel="stylesheet" href="/styles/${encodeURIComponent(section)}.css">`);
  }

  return links.join("\n  ");
}

function applyTemplate(html, meta, relPath) {
  const isVaultPage = relPath.includes(path.sep);
  const section = isVaultPage ? getSectionName(relPath) : null;
  const styles = isVaultPage ? buildStylesBlock(section) : "";
  const template = fs.readFileSync(TEMPLATE, "utf8");

  return template
    .replace("{{title}}", meta.title || "Untitled")
    .replace("{{content}}", html)
    .replace("{{tags}}", (meta.tags || []).join(", "))
    .replace("{{styles}}", styles);
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
      const finalHtml = applyTemplate(html, data, relative);

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

  const navigation = walkVault(VAULT);
  fs.writeFileSync(NAV_PATH, JSON.stringify(navigation, null, 2));

  console.log("Page generation complete.");
}

main();
