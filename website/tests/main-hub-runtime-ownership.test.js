import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function moduleScripts(source) {
  return [...source.matchAll(/<script\s+type=["']module["']\s+src=["']([^"']+)["']/g)]
    .map((match) => match[1].replace(/\?.*$/, ""))
    .filter((sourcePath) => sourcePath.startsWith("/"));
}

describe("Main Hub runtime ownership", () => {
  it("MHR-001 index owns the replacement runtime and Return does not", () => {
    const entry = read("website/index.html");
    const returnHub = read("website/hub.html");

    expect(entry).toContain("/scripts/main-hub-runtime.js");
    expect(entry).toContain("/scripts/main-hub-engine-binding.js");
    expect(entry).not.toContain("main-hub-engine.js");
    expect(returnHub).not.toContain("main-hub-runtime.js");
  });

  it("MHR-002 every local module imported by the Main Hub exists", () => {
    const entry = read("website/index.html");

    for (const sourcePath of moduleScripts(entry)) {
      expect(
        fs.existsSync(path.join(root, "website", sourcePath.slice(1))),
        `expected ${sourcePath} imported by index.html to exist`,
      ).toBe(true);
    }
  });

  it("MHR-020 does not promote Garden to a Main Hub crossing", () => {
    const entry = read("website/index.html");

    expect(entry).not.toMatch(/activateNode\s*\(\s*["']garden["']/);
  });

  it("MHR-022 binds the existing Main Hub seam to House & Garden", () => {
    const entry = read("website/index.html");

    expect(entry).toMatch(/data-main-hub-first-crossing/);
    expect(entry).toMatch(/href="housegarden\.html"/);
    expect(entry).not.toMatch(/data-main-hub-first-crossing[^>]*href="hub\.html"/);
  });
});
