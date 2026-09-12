import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

async function collectHtmlFiles(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectHtmlFiles(entryPath);
    }
    return entry.name.endsWith(".html") ? [entryPath] : [];
  }));
  return files.flat();
}

async function firstExisting(paths) {
  for (const candidate of paths) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue to the next route representation.
    }
  }
  return null;
}

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("every labeled static link resolves to a real destination", async () => {
  const pages = await collectHtmlFiles();

  for (const page of pages) {
    const html = await readFile(page, "utf8");
    const relativePage = path.relative(root, page).replaceAll("\\", "/");
    const links = html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi);

    for (const match of links) {
      const attributes = match[1];
      const label = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const hrefMatch = attributes.match(/\bhref\s*=\s*["']([^"']*)["']/i);
      assert.ok(hrefMatch, `${relativePage}: labeled link "${label}" has no href`);

      const href = hrefMatch[1].trim();
      assert.notEqual(href, "", `${relativePage}: labeled link "${label}" has an empty href`);
      assert.notEqual(href, "#", `${relativePage}: labeled link "${label}" has a dead # href`);
      assert.doesNotMatch(href, /^javascript:/i, `${relativePage}: labeled link "${label}" uses a dead JavaScript URL`);

      if (/^(?:https?:|mailto:|tel:|obsidian:|\/\/)/i.test(href)) {
        continue;
      }

      const [pathAndQuery, fragment = ""] = href.split("#", 2);
      const routePath = pathAndQuery.split("?", 1)[0];
      let targetPage = page;

      if (routePath) {
        const decodedPath = decodeURIComponent(routePath);
        const resolved = decodedPath.startsWith("/")
          ? path.join(root, decodedPath.slice(1))
          : path.resolve(path.dirname(page), decodedPath);
        assert.ok(resolved.startsWith(root), `${relativePage}: link escapes the published site: ${href}`);
        targetPage = await firstExisting([
          resolved,
          `${resolved}.html`,
          path.join(resolved, "index.html")
        ]);
        assert.ok(targetPage, `${relativePage}: labeled link "${label}" has no target: ${href}`);
      }

      if (fragment) {
        const targetHtml = targetPage === page ? html : await readFile(targetPage, "utf8");
        assert.match(
          targetHtml,
          new RegExp(`(?:id|name)=["']${escapePattern(decodeURIComponent(fragment))}["']`, "i"),
          `${relativePage}: labeled link "${label}" has no anchor target: ${href}`
        );
      }
    }
  }
});

test("shared chamber navigation exposes only implemented paths", async () => {
  const tabs = await readFile(path.join(root, "scripts", "spoke-tabs.js"), "utf8");

  assert.match(tabs, /href="index\.html">Return to Hub/);
  assert.doesNotMatch(tabs, /data-seed-gate|data-seed-action|\/api\//);
});