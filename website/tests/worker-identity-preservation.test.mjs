import assert from "node:assert/strict";
import test from "node:test";

import worker from "../../worker.js";

const HUB_DOCUMENT = `<!doctype html><title>Threshold Hub - Entry</title><main class="entry-shell">Hub</main>`;
const NON_HUB_DESTINATIONS = [
  "/portal/cave-corridor",
  "/portal/shimmer",
  "/portal/cabin-of-moss",
  "/portal/canyon",
  "/portal/deep-system/engine.html",
  "/portal/definitely-not-a-threshold-place",
];

function hubFallbackAssets() {
  return {
    ASSETS: {
      fetch: async () => new Response(HUB_DOCUMENT, {
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    },
  };
}

function identityOf(responseBody) {
  if (
    responseBody.includes("<title>Threshold Hub - Entry</title>")
    && responseBody.includes('<main class="entry-shell">')
  ) {
    return "hub";
  }
  return "other";
}

test("preserves Hub identity for the Hub route only", async () => {
  const response = await worker.fetch(
    new Request("https://threshold.example/"),
    hubFallbackAssets(),
  );
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(identityOf(body), "hub");
});

for (const path of NON_HUB_DESTINATIONS) {
  test(`does not let ${path} impersonate the Hub`, async () => {
    const response = await worker.fetch(
      new Request(`https://threshold.example${path}`),
      hubFallbackAssets(),
    );
    const body = await response.text();

    if (response.ok) {
      assert.notEqual(identityOf(body), "hub");
    }
    assert.doesNotMatch(body, /<title>Threshold Hub - Entry<\/title>/);
    assert.doesNotMatch(body, /<main class="entry-shell">/);
  });
}
