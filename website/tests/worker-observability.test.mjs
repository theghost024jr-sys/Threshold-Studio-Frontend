import assert from "node:assert/strict";
import test from "node:test";

import worker from "../../worker.js";

const VERSION = "2026-09-13b";

function captureLogs() {
  const records = [];
  const original = { log: console.log, warn: console.warn, error: console.error };
  for (const level of Object.keys(original)) {
    console[level] = (record) => records.push({ level, ...record });
  }
  return {
    records,
    restore() {
      Object.assign(console, original);
    }
  };
}

test("versions generated JSON and traces a request with one correlation ID", async () => {
  const logs = captureLogs();
  try {
    const response = await worker.fetch(
      new Request("https://threshold.example/api/progression", {
        headers: { "cf-ray": "trace-123" }
      }),
      {}
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-threshold-version"), VERSION);
    assert.equal(response.headers.get("x-request-id"), "trace-123");
    assert.deepEqual(await response.json(), { version: VERSION, seedPlanted: false });
    assert.deepEqual(logs.records.map((record) => record.event), [
      "request.started",
      "request.completed"
    ]);
    assert.ok(logs.records.every((record) => record.requestId === "trace-123"));
  } finally {
    logs.restore();
  }
});

test("preserves static response bodies while adding trace headers", async () => {
  const logs = captureLogs();
  try {
    const response = await worker.fetch(
      new Request("https://threshold.example/index.html"),
      { ASSETS: { fetch: async () => new Response("Threshold", { status: 200 }) } }
    );
    assert.equal(await response.text(), "Threshold");
    assert.equal(response.headers.get("x-threshold-version"), VERSION);
    assert.ok(response.headers.get("x-request-id"));
  } finally {
    logs.restore();
  }
});

test("logs sanitized node activation failures without a LOG binding", async () => {
  const logs = captureLogs();
  try {
    const response = await worker.fetch(
      new Request("https://threshold.example/api/nodes/activate", {
        method: "POST",
        headers: { "content-type": "application/json", "cf-ray": "trace-node" },
        body: JSON.stringify({ spoke: "ethos", activation: "root" })
      }),
      {}
    );
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      version: VERSION,
      error: "node storage is unavailable"
    });
    assert.ok(logs.records.some((record) => (
      record.level === "error"
      && record.event === "node.activate.failed"
      && record.reason === "node-storage-unavailable"
    )));
  } finally {
    logs.restore();
  }
});

test("caches chamber assets by limit without dropping group-specific matches", async () => {
  const logs = captureLogs();
  let assetFetches = 0;
  const searchIndex = {
    nodes: [
      {
        id: "behavior-only",
        title: "Conduct Protocol",
        path: "operations/conduct.md",
        excerpt: "signal.png",
        tags: [],
        links: [],
        backlinks: [],
        tokens: []
      },
      {
        id: "ethos-root",
        title: "Ethos Root",
        path: "ethos/root.md",
        excerpt: "Identity and alignment",
        tags: [],
        links: [],
        backlinks: [],
        tokens: []
      }
    ]
  };
  const env = {
    ASSETS: {
      async fetch(request) {
        assetFetches += 1;
        const path = new URL(request.url).pathname;
        if (path === "/vault-search-index.json") {
          return Response.json(searchIndex);
        }
        if (path === "/data/all-png-images.json") {
          return Response.json(["images/signal.png"]);
        }
        return new Response("not found", { status: 404 });
      }
    }
  };

  try {
    const first = await worker.fetch(
      new Request("https://threshold.example/api/ethos/chamber?limit=17", {
        headers: { "cf-ray": "trace-chamber-1" }
      }),
      env
    );
    const firstPayload = await first.json();
    assert.equal(firstPayload.version, VERSION);
    assert.ok(firstPayload.groups.behavior.items.some((item) => item.id === "behavior-only"));
    assert.deepEqual(
      firstPayload.groups.behavior.items.find((item) => item.id === "behavior-only").assets,
      ["images/signal.png"]
    );

    const second = await worker.fetch(
      new Request("https://threshold.example/api/ethos/chamber?limit=17", {
        headers: { "cf-ray": "trace-chamber-2" }
      }),
      env
    );
    assert.deepEqual(await second.json(), firstPayload);
    assert.equal(assetFetches, 2);
    assert.ok(logs.records.some((record) => (
      record.event === "ethos.chamber.timing" && record.cacheHit === false && record.limit === 17
    )));
    assert.ok(logs.records.some((record) => (
      record.event === "ethos.chamber.timing" && record.cacheHit === true && record.limit === 17
    )));
  } finally {
    logs.restore();
  }
});