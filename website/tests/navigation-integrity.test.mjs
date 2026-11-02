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
  const portalApp = await readFile(path.join(root, "portal", "src", "App.jsx"), "utf8");
  const portalRoutes = new Set(
    Array.from(portalApp.matchAll(/<Route\s+path=["']([^"']+)["']/g), (match) => match[1])
  );

  for (const page of pages) {
    const html = await readFile(page, "utf8");
    const relativePage = path.relative(root, page).replaceAll("\\", "/");
    const documentUrl = new URL(`/${relativePage}`, "https://threshold.invalid");
    const baseHref = html.match(/<base\b[^>]*\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    const baseUrl = baseHref ? new URL(baseHref, documentUrl) : documentUrl;
    const links = html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi);

    for (const match of links) {
      const attributes = match[1];
      const label = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const hrefMatch = attributes.match(/\bhref\s*=\s*["']([^"']*)["']/i);
      assert.ok(hrefMatch, `${relativePage}: labeled link "${label}" has no href`);

      const href = hrefMatch[1].trim();
      assert.notEqual(href, "", `${relativePage}: labeled link "${label}" has an empty href`);
      const hiddenSpiritNotePlaceholder = href === "#"
        && /\bid=["']viewer-note["']/i.test(attributes)
        && /<section\b[^>]*id=["']myth-viewer["'][^>]*aria-hidden=["']true["']/i.test(html);
      if (!hiddenSpiritNotePlaceholder) {
        assert.notEqual(href, "#", `${relativePage}: labeled link "${label}" has a dead # href`);
      }
      assert.doesNotMatch(href, /^javascript:/i, `${relativePage}: labeled link "${label}" uses a dead JavaScript URL`);

      if (/^(?:https?:|mailto:|tel:|obsidian:|\/\/)/i.test(href)) {
        continue;
      }

      const [pathAndQuery, fragment = ""] = href.split("#", 2);
      const routePath = pathAndQuery.split("?", 1)[0];
      if (routePath.startsWith("/portal/")) {
        const portalRoute = `/${routePath.slice("/portal/".length)}`;
        assert.ok(
          portalRoutes.has(portalRoute),
          `${relativePage}: Portal link "${label}" has no registered route: ${href}`
        );
        continue;
      }
      let targetPage = page;

      if (routePath) {
        const targetUrl = new URL(decodeURIComponent(routePath), baseUrl);
        assert.equal(
          targetUrl.origin,
          "https://threshold.invalid",
          `${relativePage}: link escapes the published site: ${href}`
        );
        const resolved = path.resolve(root, decodeURIComponent(targetUrl.pathname.slice(1)));
        const resolvedRelative = path.relative(root, resolved);
        assert.ok(
          resolvedRelative !== ".."
            && !resolvedRelative.startsWith(`..${path.sep}`)
            && !path.isAbsolute(resolvedRelative),
          `${relativePage}: link escapes the published site: ${href}`
        );
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

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }
    return entry.name.endsWith(".jsx") ? [entryPath] : [];
  }));
  return files.flat();
}

test("every literal Portal navigation route is registered", async () => {
  const portalRoot = path.join(root, "portal", "src");
  const app = await readFile(path.join(portalRoot, "App.jsx"), "utf8");
  const registered = new Set(
    Array.from(app.matchAll(/<Route\s+path=["']([^"']+)["']/g), (match) => match[1])
  );
  const sources = await collectSourceFiles(portalRoot);
  const routes = new Set();

  for (const source of sources) {
    const contents = await readFile(source, "utf8");
    for (const match of contents.matchAll(/<Link\s+to=["'](\/[^"']+)["']/g)) {
      routes.add(match[1]);
    }
    for (const match of contents.matchAll(/href:\s*["'](\/[^"']+)["']/g)) {
      routes.add(match[1]);
    }
    for (const match of contents.matchAll(/destination:\s*["'](\/[^"']+)["']/g)) {
      routes.add(match[1]);
    }
  }

  for (const route of routes) {
    if (route.endsWith(".html")) {
      await access(path.join(root, route.slice(1)));
      continue;
    }
    assert.ok(registered.has(route), `Portal navigation points to an unregistered route: ${route}`);
  }

  assert.doesNotMatch(
    app,
    /destination:\s*["']\/hub\.html["']/,
    "Portal Motion must return internally instead of linking to the static-only Hub route"
  );
});