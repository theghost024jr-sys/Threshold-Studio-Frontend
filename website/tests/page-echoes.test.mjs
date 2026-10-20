import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import vaultIndex from "../data/vault-index.json" with { type: "json" };
import {
  INVENTORY_ECHO_EXCLUSIONS,
  gaussianNameSimilarity,
  PAGE_ECHOES,
  PAGE_ECHO_MATCHING,
  resolvePageEchoes
} from "../config/page-echoes.js";
import {
  addInventoryBase,
  rewriteInventoryLinks
} from "../../scripts/build-inventory-echoes.mjs";
import { ThresholdBranchEngine } from "../threshold-engine.js";
import { BRANCHES } from "../portal/src/modules/branches.js";

const websiteRoot = fileURLToPath(new URL("../", import.meta.url));
const repositoryRoot = path.dirname(websiteRoot);
const ignoredDirectories = new Set([
  "echoes",
  "generated-pages",
  "html-inventory",
  "node_modules",
  "page-templates",
  "portal-dist"
]);

async function listHtmlFiles(directory, relativeDirectory = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const relativePath = path.posix.join(relativeDirectory, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listHtmlFiles(absolutePath, relativePath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(relativePath);
    }
  }

  return files;
}

function resolveWebsitePath(sourcePath, href) {
  const url = new URL(href, `https://threshold.invalid/${sourcePath}`);
  return decodeURIComponent(url.pathname.slice(1));
}

function linkedStylesheets(html, sourcePath) {
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => tag);
  return links.flatMap((tag) => {
    const rel = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] || "";
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!/\bstylesheet\b/i.test(rel) || !href || /^(?:https?:|\/\/|data:)/i.test(href)) {
      return [];
    }
    return [resolveWebsitePath(sourcePath, href.split(/[?#]/, 1)[0])];
  });
}

async function assertStylesheetTree(stylesheetPath, visited = new Set()) {
  if (visited.has(stylesheetPath)) {
    return;
  }
  visited.add(stylesheetPath);
  const css = await readFile(path.join(websiteRoot, stylesheetPath), "utf8");
  const imports = [...css.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+\.css)(?:[?#][^"')\s;]*)?["']?\s*\)?/gi)];

  for (const match of imports) {
    await assertStylesheetTree(resolveWebsitePath(stylesheetPath, match[1]), visited);
  }
}

test("registers every authored rendered HTML file as a page echo", async () => {
  const discovered = (await listHtmlFiles(websiteRoot)).sort();
  const registered = [...new Set(
    PAGE_ECHOES.map((echo) => echo.source).filter(Boolean)
  )].sort();

  assert.deepEqual(registered, discovered);
  assert.equal(new Set(PAGE_ECHOES.map((echo) => echo.id)).size, PAGE_ECHOES.length);
  assert.equal(new Set(PAGE_ECHOES.map((echo) => echo.href)).size, PAGE_ECHOES.length);
  assert.ok(PAGE_ECHOES.every((echo) => echo.kind === "page-echo" && echo.force === "low"));
});

test("promotes the current inventory website snapshot without importing its history", async () => {
  const inventoryRoot = path.join(repositoryRoot, "html-inventory", "website");
  const discovered = (await listHtmlFiles(inventoryRoot)).sort();
  const registered = PAGE_ECHOES
    .map((echo) => echo.inventorySource)
    .filter(Boolean)
    .sort();

  const excluded = Object.keys(INVENTORY_ECHO_EXCLUSIONS).sort();
  assert.deepEqual(registered, discovered.filter((source) => !excluded.includes(source)));
  assert.deepEqual(excluded, ["environment/waterfall.html"]);
  assert.ok(!registered.some((source) => /git-history|prototype|legacy/i.test(source)));
  assert.ok(PAGE_ECHOES.filter((echo) => echo.inventorySource).every(
    (echo) => echo.href === `/echoes/inventory/${echo.inventorySource}`
  ));
});

test("connects each rendered page to its local stylesheet dependencies", async () => {
  const sourceEchoes = PAGE_ECHOES.filter((echo) => echo.source || echo.inventorySource);

  for (const echo of sourceEchoes) {
    const sourcePath = echo.source || echo.inventorySource;
    const sourceFile = echo.source
      ? path.join(websiteRoot, echo.source)
      : path.join(repositoryRoot, "html-inventory", "website", echo.inventorySource);
    const html = await readFile(sourceFile, "utf8");
    const expected = linkedStylesheets(html, sourcePath);

    if (html.includes("scripts/destination-page.js")) {
      expected.push("styles/destination-page.css", "styles/access-flow.css");
    }
    if (echo.source === "portal/index.html") {
      const [app, main] = await Promise.all([
        readFile(path.join(websiteRoot, "portal/src/App.jsx"), "utf8"),
        readFile(path.join(websiteRoot, "portal/src/main.jsx"), "utf8")
      ]);
      assert.match(app, /import ['"]\.\/App\.css['"]/);
      assert.match(main, /import ['"]\.\/index\.css['"]/);
      expected.push("portal/src/App.css", "portal/src/index.css");
    }

    assert.deepEqual([...echo.styles].sort(), [...new Set(expected)].sort(), sourcePath);
    for (const stylesheetPath of echo.styles) {
      await assertStylesheetTree(stylesheetPath);
    }
  }
});

test("keeps page echoes passive on their existing Engine branches", () => {
  const engine = {
    renderBranch() {},
    vault: vaultIndex
  };
  new ThresholdBranchEngine(engine).initialize();
  const portalBranches = new Set(BRANCHES.map((branch) => branch.engineId));
  const resolved = resolvePageEchoes(PAGE_ECHOES, vaultIndex);

  assert.equal(Object.keys(engine.branches).length, 11);
  for (const echo of PAGE_ECHOES) {
    assert.ok(engine.branches[echo.branchId], `${echo.id} has an Engine parent`);
    assert.ok(portalBranches.has(echo.branchId), `${echo.id} has a Portal parent`);
    assert.ok(engine.branches[echo.branchId].echoes.some((item) => item.id === echo.id));
    assert.ok(BRANCHES.find((branch) => branch.engineId === echo.branchId)
      .echoes.some((item) => item.id === echo.id));
    assert.equal(resolved.find((item) => item.id === echo.id).force, "low");
  }
});

test("uses a Gaussian filename score and links only unique published Markdown matches", () => {
  const resolved = resolvePageEchoes(PAGE_ECHOES, vaultIndex);
  const basinEchoes = ["basin-reference-page", "basin-generated-page", "inventory-basin"];
  for (const id of basinEchoes) {
    const echo = resolved.find((item) => item.id === id);
    assert.equal(echo.status, "matched");
    assert.equal(echo.markdownMatch.relativePath, "_publish/basin.md");
    assert.equal(echo.markdownMatch.score, 1);
  }

  const waterfall = resolvePageEchoes([{
    id: "inventory-waterfall-candidate",
    href: "/echoes/inventory/environment/waterfall.html",
    inventorySource: "environment/waterfall.html"
  }], vaultIndex)[0];
  assert.equal(waterfall.status, "unmatched");
  assert.equal(waterfall.markdownMatch, null);
  assert.ok(gaussianNameSimilarity("basin", "basins") > PAGE_ECHO_MATCHING.minimumScore);
  assert.ok(gaussianNameSimilarity("basin", "stone basin") < PAGE_ECHO_MATCHING.minimumScore);

  const ambiguous = resolvePageEchoes(
    [PAGE_ECHOES.find((echo) => echo.id === "basin-reference-page")],
    {
      documents: [
        { id: "basin-one", title: "Basin", relativePath: "_publish/basin.md" },
        { id: "basin-two", title: "Basins", relativePath: "_publish/basins.md" }
      ]
    }
  )[0];
  assert.equal(ambiguous.status, "ambiguous");
  assert.equal(ambiguous.markdownMatch, null);
});

test("adds an original-site base to promoted inventory pages", () => {
  const promoted = addInventoryBase(
    "<!doctype html><html><head><title>Basin</title></head><body></body></html>",
    "environment/basin.html"
  );
  assert.match(promoted, /<base href="\/environment\/">/);
  assert.throws(
    () => addInventoryBase("<html><body></body></html>", "basin.html"),
    /missing a head element/
  );
  assert.throws(
    () => addInventoryBase("<html><head></head></html>", "../basin.html"),
    /Invalid inventory echo source path/
  );
});

test("routes unavailable inventory destinations to live page echoes", () => {
  assert.equal(
    rewriteInventoryLinks('<a href="ledger.html">Ledger</a>', "contact.html"),
    '<a href="/portal/">Ledger</a>'
  );
  assert.equal(
    rewriteInventoryLinks('<a href="ledger.html">Ledger</a>', "housegarden.html"),
    '<a href="/portal/">Ledger</a>'
  );
  assert.equal(
    rewriteInventoryLinks('<a href="ledger.html">Ledger</a>', "mythology.html"),
    '<a href="/portal/">Ledger</a>'
  );
  assert.equal(
    rewriteInventoryLinks(
      '<a href="chamber-palette-map.html">Chamber Map</a>',
      "housegarden.html"
    ),
    '<a href="/world-map.html">Chamber Map</a>'
  );
  assert.equal(
    rewriteInventoryLinks(
      '<a href="chamber-palette-map.html">Chamber Map</a>',
      "mythology.html"
    ),
    '<a href="/world-map.html">Chamber Map</a>'
  );
  assert.equal(
    rewriteInventoryLinks(
      '<a href="/environment/waterfall.html">Look South</a>',
      "environment/herbroom.html"
    ),
    '<a href="/environment/waterfall.html">Look South</a>'
  );
  assert.equal(
    rewriteInventoryLinks(
      '<a href="/environment/waterfall.html" class="exit-south">Look South</a>',
      "environment/herbroom.html"
    ),
    '<span class="exit-south">Look South</span>'
  );
  assert.equal(
    rewriteInventoryLinks('<a href="ledger.html">Ledger</a>', "hub.html"),
    '<a href="ledger.html">Ledger</a>'
  );
});

test("registers generated pages from the explicit page mapping", async () => {
  const mapping = JSON.parse(await readFile(
    path.join(websiteRoot, "page-mapping.json"),
    "utf8"
  ));

  for (const page of mapping.pages) {
    const echo = PAGE_ECHOES.find((item) => item.href === `/generated-pages/${page.output}`);
    assert.ok(echo, `missing generated page echo for ${page.output}`);
    assert.equal(echo.branchId, "houseGarden");
    assert.equal(echo.source, null);
  }
});

test("connects Portal echoes only to routes declared by the Portal router", async () => {
  const app = await readFile(path.join(websiteRoot, "portal/src/App.jsx"), "utf8");
  const routes = new Set([...app.matchAll(/<Route\s+path="([^"]+)"/g)].map(([, route]) => route));

  for (const echo of PAGE_ECHOES.filter((item) => item.href.startsWith("/portal/"))) {
    const route = echo.href.slice("/portal".length) || "/";
    const matchedRoute = route.startsWith("/branches/")
      ? "/branches/:branchId"
      : route.startsWith("/world/chambers/") && route !== "/world/chambers"
        ? "/world/chambers/:id"
        : route;
    assert.ok(routes.has(matchedRoute), `${echo.href} is not a declared Portal route`);
  }
});
