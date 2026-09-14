import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test, { before } from "node:test";

const root = new URL("../../", import.meta.url);
const run = promisify(execFile);

before(async () => {
  await run(process.execPath, ["scripts/build-pages.mjs", "--static"], {
    cwd: root
  });
});

test("configures the canonical project as Cloudflare Pages advanced mode", async () => {
  const wrangler = await readFile(new URL("wrangler.toml", root), "utf8");
  assert.match(wrangler, /^name = "threshold-studio-frontend"$/m);
  assert.match(wrangler, /^pages_build_output_dir = "\.\/website"$/m);
  assert.doesNotMatch(wrangler, /^main\s*=/m);
  assert.match(wrangler, /^\[observability\]$/m);
  assert.match(wrangler, /^enabled = true$/m);
  assert.match(wrangler, /^head_sampling_rate = 1$/m);
  assert.match(wrangler, /^\[observability\.logs\]$/m);
  assert.match(wrangler, /^invocation_logs = true$/m);
  assert.match(wrangler, /binding = "NODE_BUNDLES"/);
  assert.match(wrangler, /bucket_name = "threshold-node-bundles"/);
});

test("build emits the canonical Worker into the Pages output directory", async () => {
  const source = await readFile(new URL("worker.js", root), "utf8");
  const output = await readFile(new URL("_worker.js", new URL("../", import.meta.url)), "utf8");
  assert.equal(output, source);
  assert.match(output, /return env\.ASSETS\.fetch\(request\)/);
  assert.match(output, /env\.NODE_BUNDLES/);
  assert.match(output, /env\.SEED_SECRET/);
});