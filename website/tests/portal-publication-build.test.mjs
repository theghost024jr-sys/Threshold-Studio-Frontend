import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("CI publication builds Portal assets and route shells before packaging website", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../../package.json", import.meta.url), "utf8")
  );
  const command = packageJson.scripts["build:ci"];
  const portalBuild = "npm --prefix website/portal run build:site";
  const pagesPackage = "node scripts/build-pages.mjs --static";

  assert.ok(command.includes(portalBuild));
  assert.ok(command.includes(pagesPackage));
  assert.ok(command.indexOf(portalBuild) < command.indexOf(pagesPackage));
});
