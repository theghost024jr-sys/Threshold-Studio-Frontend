import fs from "fs";
import path from "path";

const NAV_PATH = path.join(process.cwd(), "website", "navigation.json");
const OUTPUT = path.join(process.cwd(), "website", "pages");
const TEMPLATE = path.join(process.cwd(), "website", "templates", "page.html");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pageUrl(filePath) {
  const encodedPath = filePath
    .split(/[\\/]/)
    .map(segment => encodeURIComponent(segment))
    .join("/");

  return `/pages/${encodedPath}`;
}

function buildStylesBlock(section) {
  return [
    '<link rel="stylesheet" href="/styles/base.css">',
    `<link rel="stylesheet" href="/styles/${encodeURIComponent(section)}.css">`
  ].join("\n  ");
}

function renderItems(items = []) {
  return items
    .map(item => {
      const name = escapeHtml(item.name);

      if (item.leaf) {
        return `<li><a href="${pageUrl(item.path)}">${name}</a></li>`;
      }

      return `<li>${name}<ul>${renderItems(item.children)}</ul></li>`;
    })
    .join("");
}

function renderIndex(title, items) {
  const template = fs.readFileSync(TEMPLATE, "utf8");
  const safeTitle = escapeHtml(title);
  const content = `<h1>${safeTitle}</h1><ul>${renderItems(items)}</ul>`;

  return template
    .replace("{{title}}", safeTitle)
    .replace("{{content}}", content)
    .replace("{{tags}}", "")
    .replace("{{styles}}", buildStylesBlock(title));
}

function buildIndexForSection(section) {
  const outDir = path.join(OUTPUT, section.name);
  ensureDir(outDir);

  const html = renderIndex(section.name, section.children);
  fs.writeFileSync(path.join(outDir, "index.html"), html);
}

function main() {
  console.log("Building index pages...");

  const navigation = JSON.parse(fs.readFileSync(NAV_PATH, "utf8"));
  const sections = navigation.filter(item => !item.leaf);

  for (const section of sections) {
    buildIndexForSection(section);
  }

  console.log(`Index generation complete (${sections.length} sections).`);
}

main();