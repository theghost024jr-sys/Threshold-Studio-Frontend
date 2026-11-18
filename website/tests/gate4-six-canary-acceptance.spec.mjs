import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import process from "node:process";

import { chromium, expect, test } from "@playwright/test";

export const GATE4_CANARIES = [
  { route: "/portal", identity: "Threshold Portal", key: "portal", marker: /THRESHOLD \/ PORTAL/ },
  { route: "/portal/basin", identity: "Basin", key: "basin", marker: /BASIN \/ WATER SYSTEM/ },
  { route: "/portal/basin-falls", identity: "Basin Falls", key: "basin-falls", marker: /BASIN OF THE FALLS \/ LOWER WORKS/ },
  { route: "/portal/cabin-of-moss", identity: "Cabin of Moss", key: "cabin-of-moss", marker: /CABIN \/ ADAPTIVE CLARITY/ },
  { route: "/portal/shimmer", identity: "Shimmer", key: "shimmer", marker: /The construction is familiar\. Its making is not\./ },
  { route: "/portal/cave-corridor", identity: "Cave Corridor", key: "cave-corridor", marker: /Back to House & Garden/ },
];

const LOCAL_RESOURCE_TYPES = new Set(["document", "script", "stylesheet"]);
const ASSET_RESOURCE_TYPES = new Set(["script", "stylesheet"]);
const VIEWPORTS = [
  { name: "normal", width: 1024, height: 768 },
  { name: "wide", width: 1440, height: 900 },
];

let server;
let workerEvents = [];
let workerOutput = "";
let baseUrl;
let workerLog;

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function availablePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

function recordWorkerOutput(chunk) {
  workerOutput += chunk.toString();
  const lines = workerOutput.split(/\r?\n/);
  workerOutput = lines.pop();
  for (const line of lines) {
    const start = line.indexOf("{");
    const end = line.lastIndexOf("}");
    if (start < 0 || end <= start) continue;
    try {
      const event = JSON.parse(line.slice(start, end + 1));
      if (event.diagnostic === "portal_shell") workerEvents.push(event);
    } catch {
      // Wrangler also emits non-JSON diagnostics.
    }
  }
}

async function waitForReady() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/portal`);
      if (response.ok) return;
    } catch {
      // The local runtime has not bound the port yet.
    }
    await sleep(250);
  }
  throw new Error(`Wrangler did not become ready at ${baseUrl}`);
}

async function waitForShellEvent(route, startIndex) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const event = workerEvents
      .slice(startIndex)
      .find((candidate) => candidate.request_path === route);
    if (event) return event;
    await sleep(50);
  }
  throw new Error(`No portal_shell diagnostic was emitted for ${route}`);
}

async function assertIdentity(page, canary) {
  await expect(page).toHaveTitle("Threshold Portal");
  await expect.poll(
    () => page.locator("body").innerText(),
    { timeout: 10_000 }
  ).toMatch(canary.marker);

  const body = await page.locator("body").innerText();
  expect(body).not.toContain("Threshold destination unavailable.");
  expect(body).not.toContain("This route could not be loaded.");

  const identity = page.locator(`[data-threshold-identity="${canary.key}"]`);
  await expect(identity, `${canary.route}: identity marker count`).toHaveCount(1);
  await expect(identity, `${canary.route}: identity marker visibility`).toBeVisible();
  await expect(identity, `${canary.route}: identity marker value`).toHaveAttribute(
    "data-threshold-identity",
    canary.key
  );

  if (canary.key !== "portal") {
    await expect(
      page.locator('[data-threshold-identity="portal"]'),
      `${canary.route}: Portal fallback identity`
    ).toHaveCount(0);
    await expect(page.locator(".entry-shell"), `${canary.route}: Entry Hub fallback`).toHaveCount(0);
  }
}

async function assertViewportOwnership(page, canary, phase, viewport) {
  const root = await page.locator("#root").boundingBox();

  expect(root, `${canary.route} ${phase} ${viewport.name}: Portal root bounds`).not.toBeNull();
  expect(root.x, `${canary.route} ${phase} ${viewport.name}: Portal root left edge`).toBe(0);
  expect(root.width, `${canary.route} ${phase} ${viewport.name}: Portal root width`).toBe(viewport.width);
}

function expectedMimePattern(resourceType) {
  return resourceType === "script"
    ? /(?:javascript|ecmascript)/i
    : /^text\/css(?:;|$)/i;
}

async function observeCanary(browser, canary, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const observations = [];

  try {
    for (const phase of ["initial", "refresh"]) {
      const failedRequests = [];
      const failedResponses = [];
      const consoleErrors = [];
      const assetResponses = [];
      let documentHeaders = {};
      const workerStartIndex = workerEvents.length;
      const onRequest = (request) => {
        if (
          request.url() === `${baseUrl}${canary.route}`
          && request.resourceType() === "document"
        ) {
          documentHeaders = request.headers();
        }
      };
      const onRequestFailed = (request) => {
        if (request.url().startsWith(baseUrl) && LOCAL_RESOURCE_TYPES.has(request.resourceType())) {
          failedRequests.push({
            resourceType: request.resourceType(),
            url: request.url(),
            failure: request.failure()?.errorText ?? "unknown",
          });
        }
      };
      const onConsole = (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      };
      const onResponse = (response) => {
        const request = response.request();
        if (!response.url().startsWith(baseUrl)) return;

        const resourceType = request.resourceType();
        if (
          LOCAL_RESOURCE_TYPES.has(resourceType)
          && (response.status() < 200 || response.status() >= 300)
        ) {
          failedResponses.push({
            resourceType,
            status: response.status(),
            url: response.url(),
          });
        }
        if (ASSET_RESOURCE_TYPES.has(resourceType)) {
          assetResponses.push({
            resourceType,
            status: response.status(),
            contentType: response.headers()["content-type"] ?? "",
            url: response.url(),
          });
        }
      };

      page.on("request", onRequest);
      page.on("requestfailed", onRequestFailed);
      page.on("response", onResponse);
      page.on("console", onConsole);
      try {
        const response = phase === "initial"
          ? await page.goto(`${baseUrl}${canary.route}`, { waitUntil: "domcontentloaded" })
          : await page.reload({ waitUntil: "domcontentloaded" });
        const shell = await waitForShellEvent(canary.route, workerStartIndex);

        expect(response?.status(), `${canary.route} ${phase} document status`).toBe(200);
        expect(shell.upstream_status, `${canary.route} ${phase} shell upstream status`).toBe(200);
        expect(shell.final_status, `${canary.route} ${phase} shell final status`).toBe(200);
        if (documentHeaders["if-none-match"]) {
          expect(shell.conditional_headers_removed).toContain("if-none-match");
        }
        await assertIdentity(page, canary);
        await assertViewportOwnership(page, canary, phase, viewport);
      } finally {
        page.off("request", onRequest);
        page.off("requestfailed", onRequestFailed);
        page.off("response", onResponse);
        page.off("console", onConsole);
      }

      expect(failedRequests, `${canary.route} ${phase} failed requests`).toEqual([]);
      expect(failedResponses, `${canary.route} ${phase} failed document or asset responses`).toEqual([]);
      expect(consoleErrors, `${canary.route} ${phase} console errors`).toEqual([]);
      for (const resourceType of ASSET_RESOURCE_TYPES) {
        expect(
          assetResponses.some((asset) => asset.resourceType === resourceType),
          `${canary.route} ${phase} requested ${resourceType} asset`
        ).toBe(true);
      }
      for (const asset of assetResponses) {
        expect(asset.status, `${canary.route} ${phase} asset status: ${asset.url}`).toBe(200);
        expect(
          asset.contentType,
          `${canary.route} ${phase} asset MIME type: ${asset.url}`
        ).toMatch(expectedMimePattern(asset.resourceType));
      }
      observations.push({ phase, viewport: viewport.name, failedRequests, failedResponses, consoleErrors, assetResponses });
    }
  } finally {
    await context.close();
  }

  return observations;
}

test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

test.beforeAll(async () => {
  const port = await availablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  const wrangler = resolve("node_modules", "wrangler", "bin", "wrangler.js");
  server = spawn(process.execPath, [wrangler, "pages", "dev", "website", "--port", String(port)], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (process.env.GATE4_WRANGLER_LOG) {
    workerLog = createWriteStream(process.env.GATE4_WRANGLER_LOG, { flags: "a" });
  }
  const captureOutput = (chunk) => {
    workerLog?.write(chunk);
    recordWorkerOutput(chunk);
  };
  server.stdout.on("data", captureOutput);
  server.stderr.on("data", captureOutput);
  await waitForReady();
});

test.afterAll(async () => {
  if (server && !server.killed) {
    server.kill();
  }
  if (workerLog) {
    await new Promise((resolve) => workerLog.end(resolve));
  }
});

test("Gate 4 requires all six canaries to retain identity after refresh", async () => {
  const browser = await chromium.launch();
  try {
    const results = [];
    for (const viewport of VIEWPORTS) {
      for (const canary of GATE4_CANARIES) {
        results.push(await observeCanary(browser, canary, viewport));
      }
    }
    expect(results).toHaveLength(GATE4_CANARIES.length * VIEWPORTS.length);
  } finally {
    await browser.close();
  }
});
