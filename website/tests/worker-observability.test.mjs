import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("serves the Portal router shell for direct World navigation", async () => {
  const requestedPaths = [];
  const response = await worker.fetch(
    new Request("https://threshold.example/world/chambers"),
    {
      ASSETS: {
        async fetch(request) {
          requestedPaths.push(new URL(request.url).pathname);
          return new Response("<!doctype html><title>Threshold World</title>");
        }
      }
    }
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  assert.deepEqual(requestedPaths, ["/portal-dist/portal-shell.txt"]);
});

test("redirects static Hub routes that were resolved beneath Portal", async () => {
  const response = await worker.fetch(
    new Request("https://threshold.example/portal/housegarden.html?path=garden")
  );

  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://threshold.example/housegarden.html?path=garden");
});

test("serves Cabin of Moss as HTML when the Portal shell is requested directly", async () => {
  const requestedPaths = [];
  const response = await worker.fetch(
    new Request("https://threshold.example/portal/cabin-of-moss"),
    {
      ASSETS: {
        async fetch(request) {
          requestedPaths.push(new URL(request.url).pathname);
          return new Response("<!doctype html><title>Threshold Portal</title>");
        }
      }
    }
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  assert.deepEqual(requestedPaths, ["/portal-dist/portal-shell.txt"]);
});

test("marks all extensionless Portal shells as HTML for static fallback delivery", async () => {
  const headers = await readFile(new URL("../_headers", import.meta.url), "utf8");

  assert.match(
    headers,
    /^\/portal\/\*\r?\n {2}Content-Type: text\/html; charset=utf-8$/m
  );
});

test("records Portal shell delivery decisions", async () => {
  const records = [];
  const originalLog = console.log;
  console.log = (record) => {
    if (typeof record === "string") {
      records.push(JSON.parse(record));
    }
  };

  try {
    await worker.fetch(
      new Request("https://threshold.example/portal/cave-corridor"),
      {
        ASSETS: {
          async fetch() {
            return new Response("<!doctype html><title>Threshold Portal</title>", {
              headers: { "content-type": "text/plain; charset=utf-8" }
            });
          }
        }
      }
    );
    await worker.fetch(
      new Request("https://threshold.example/portal/cave-corridor"),
      {
        ASSETS: {
          async fetch() {
            return new Response("Not found", {
              status: 404,
              headers: { "content-type": "text/plain; charset=utf-8" }
            });
          }
        }
      }
    );
    await worker.fetch(
      new Request("https://threshold.example/portal/cave-corridor"),
      {
        ASSETS: {
          async fetch() {
            return new Response("<title>Threshold Hub - Entry</title><main class=\"entry-shell\">", {
              headers: { "content-type": "text/html; charset=utf-8" }
            });
          }
        }
      }
    );

    assert.deepEqual(records.map((record) => ({
      diagnostic: record.diagnostic,
      request_path: record.request_path,
      rewritten_path: record.rewritten_path,
      upstream_status: record.upstream_status,
      upstream_content_type: record.upstream_content_type,
      rejection_reason: record.rejection_reason,
      final_status: record.final_status
    })), [
      {
        diagnostic: "portal_shell",
        request_path: "/portal/cave-corridor",
        rewritten_path: "/portal-dist/portal-shell.txt",
        upstream_status: 200,
        upstream_content_type: "text/plain; charset=utf-8",
        rejection_reason: null,
        final_status: 200
      },
      {
        diagnostic: "portal_shell",
        request_path: "/portal/cave-corridor",
        rewritten_path: "/portal-dist/portal-shell.txt",
        upstream_status: 404,
        upstream_content_type: "text/plain; charset=utf-8",
        rejection_reason: "upstream-status",
        final_status: 404
      },
      {
        diagnostic: "portal_shell",
        request_path: "/portal/cave-corridor",
        rewritten_path: "/portal-dist/portal-shell.txt",
        upstream_status: 200,
        upstream_content_type: "text/html; charset=utf-8",
        rejection_reason: "entry-hub-document",
        final_status: 404
      }
    ]);
    assert.ok(records.every((record) => (
      Number.isFinite(record.shellFetchDurationMs)
      && record.shellFetchDurationMs >= 0
      && Number.isFinite(record.totalDurationMs)
      && record.totalDurationMs >= record.shellFetchDurationMs
      && Number.isFinite(Date.parse(record.startedAt))
      && Number.isFinite(Date.parse(record.shellFetchStartedAt))
      && Number.isFinite(Date.parse(record.shellFetchCompletedAt))
      && Number.isFinite(Date.parse(record.completedAt))
    )));
  } finally {
    console.log = originalLog;
  }
});

test("does not forward browser validators to the internal Portal shell lookup", async () => {
  const records = [];
  const originalLog = console.log;
  let internalRequest;
  console.log = (record) => {
    if (typeof record === "string") {
      records.push(JSON.parse(record));
    }
  };

  try {
    const response = await worker.fetch(
      new Request("https://threshold.example/portal/basin", {
        headers: {
          "if-none-match": "\"browser-shell-validator\"",
          "if-modified-since": "Wed, 12 Nov 2026 07:18:46 GMT",
          "accept": "text/html"
        }
      }),
      {
        ASSETS: {
          async fetch(request) {
            internalRequest = request;
            if (request.headers.has("if-none-match") || request.headers.has("if-modified-since")) {
              return new Response(null, { status: 304 });
            }
            return new Response("<!doctype html><title>Threshold Portal</title>", {
              headers: { "content-type": "text/plain; charset=utf-8" }
            });
          }
        }
      }
    );

    assert.equal(new URL(internalRequest.url).pathname, "/portal-dist/portal-shell.txt");
    assert.equal(internalRequest.headers.has("if-none-match"), false);
    assert.equal(internalRequest.headers.has("if-modified-since"), false);
    assert.equal(internalRequest.headers.get("accept"), "text/html");
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "<!doctype html><title>Threshold Portal</title>");
    assert.deepEqual(records.map((record) => ({
      diagnostic: record.diagnostic,
      conditional_headers_removed: record.conditional_headers_removed,
      upstream_status: record.upstream_status,
      rejection_reason: record.rejection_reason,
      final_status: record.final_status
    })), [
      {
        diagnostic: "portal_shell",
        conditional_headers_removed: ["if-none-match", "if-modified-since"],
        upstream_status: 200,
        rejection_reason: null,
        final_status: 200
      }
    ]);
  } finally {
    console.log = originalLog;
  }
});

test("rejects an unexpected 304 Portal shell response", async () => {
  const records = [];
  const originalLog = console.log;
  console.log = (record) => {
    if (typeof record === "string") {
      records.push(JSON.parse(record));
    }
  };

  try {
    const response = await worker.fetch(
      new Request("https://threshold.example/portal/basin"),
      { ASSETS: { fetch: async () => new Response(null, { status: 304 }) } }
    );

    assert.equal(response.status, 404);
    assert.equal(await response.text(), "Threshold destination unavailable.");
    assert.equal(records[0].rejection_reason, "unexpected-not-modified");
    assert.equal(records[0].final_status, 404);
  } finally {
    console.log = originalLog;
  }
});

test("resolves public Portal JavaScript requests to the built asset namespace", async () => {
  const requestedPaths = [];
  const response = await worker.fetch(
    new Request("https://threshold.example/portal/assets/index-test.js"),
    {
      ASSETS: {
        async fetch(request) {
          requestedPaths.push(new URL(request.url).pathname);
          return new Response('console.log("portal asset")', {
            headers: { "content-type": "application/javascript" }
          });
        }
      }
    }
  );

  assert.equal(response.status, 200);
  const body = await response.text();
  assert.equal(response.headers.get("content-type"), "application/javascript");
  assert.equal(body, 'console.log("portal asset")');
  assert.doesNotMatch(body, /<div id="root">|Threshold Portal/);
  assert.deepEqual(requestedPaths, ["/portal-dist/assets/index-test.js"]);
});

test("resolves public Portal stylesheet requests to the built asset namespace", async () => {
  const requestedPaths = [];
  const response = await worker.fetch(
    new Request("https://threshold.example/portal/assets/index-test.css"),
    {
      ASSETS: {
        async fetch(request) {
          requestedPaths.push(new URL(request.url).pathname);
          return new Response(".portal { display: block; }", {
            headers: { "content-type": "text/css" }
          });
        }
      }
    }
  );

  const body = await response.text();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/css");
  assert.equal(body, ".portal { display: block; }");
  assert.doesNotMatch(body, /<div id="root">|Threshold Portal/);
  assert.deepEqual(requestedPaths, ["/portal-dist/assets/index-test.css"]);
});

test("does not forward browser validators to the internal Portal asset lookup", async () => {
  let internalRequest;
  const response = await worker.fetch(
    new Request("https://threshold.example/portal/assets/index-test.js", {
      headers: {
        "if-none-match": "\"browser-asset-validator\"",
        "if-modified-since": "Wed, 12 Nov 2026 07:18:46 GMT"
      }
    }),
    {
      ASSETS: {
        async fetch(request) {
          internalRequest = request;
          if (request.headers.has("if-none-match") || request.headers.has("if-modified-since")) {
            return new Response(null, { status: 304 });
          }
          return new Response('console.log("portal asset")', {
            headers: { "content-type": "application/javascript" }
          });
        }
      }
    }
  );

  assert.equal(new URL(internalRequest.url).pathname, "/portal-dist/assets/index-test.js");
  assert.equal(internalRequest.headers.has("if-none-match"), false);
  assert.equal(internalRequest.headers.has("if-modified-since"), false);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'console.log("portal asset")');
});

test("serves generated shell-referenced Portal assets through public URLs", async () => {
  const shell = await readFile(
    new URL("../portal-dist/portal-shell.txt", import.meta.url),
    "utf8"
  );
  const publicAssets = [...new Set(
    [...shell.matchAll(/(?:src|href)="(\/portal\/assets\/[^"]+\.(?:js|css))"/g)]
      .map((match) => match[1])
  )];
  const javascriptAsset = publicAssets.find((asset) => asset.endsWith(".js"));
  const stylesheetAsset = publicAssets.find((asset) => asset.endsWith(".css"));

  assert.ok(javascriptAsset, "generated Portal shell must reference a JavaScript asset");
  assert.ok(stylesheetAsset, "generated Portal shell must reference a stylesheet asset");

  const assets = new Map(await Promise.all(
    [javascriptAsset, stylesheetAsset].map(async (publicPath) => {
      const fileName = publicPath.slice("/portal/assets/".length);
      const internalPath = "/portal-dist/assets/" + fileName;
      return [
        internalPath,
        {
          body: await readFile(new URL(`../portal-dist/assets/${fileName}`, import.meta.url)),
          contentType: publicPath.endsWith(".js") ? "application/javascript" : "text/css"
        }
      ];
    })
  ));
  const env = {
    ASSETS: {
      async fetch(request) {
        if (request.headers.has("if-none-match") || request.headers.has("if-modified-since")) {
          return new Response(null, { status: 304 });
        }
        const asset = assets.get(new URL(request.url).pathname);
        return asset
          ? new Response(asset.body, { headers: { "content-type": asset.contentType } })
          : new Response("Not found", { status: 404 });
      }
    }
  };

  for (const publicPath of [javascriptAsset, stylesheetAsset]) {
    const response = await worker.fetch(
      new Request(`https://threshold.example${publicPath}`, {
        headers: {
          "if-none-match": "\"browser-asset-validator\"",
          "if-modified-since": "Wed, 12 Nov 2026 07:18:46 GMT"
        }
      }),
      env
    );
    const body = await response.text();
    const expected = assets.get("/portal-dist/assets/" + publicPath.slice("/portal/assets/".length));

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), expected.contentType);
    assert.equal(body, expected.body.toString());
    assert.doesNotMatch(body, /<html|Portal asset unavailable\.|Threshold destination unavailable\./i);
  }
});

test("rejects a nonexistent public asset derived from the generated Portal shell", async () => {
  const shell = await readFile(
    new URL("../portal-dist/portal-shell.txt", import.meta.url),
    "utf8"
  );
  const javascriptAsset = [...shell.matchAll(/src="(\/portal\/assets\/[^"]+\.js)"/g)]
    .map((match) => match[1])[0];
  const missingPublicPath = javascriptAsset.replace(
    "/portal/assets/",
    "/portal/assets/missing-"
  );
  const records = [];
  const originalLog = console.log;
  console.log = (record) => {
    if (typeof record === "string") {
      records.push(JSON.parse(record));
    }
  };

  try {
    const response = await worker.fetch(
      new Request(`https://threshold.example${missingPublicPath}`),
      {
        ASSETS: {
          async fetch(request) {
            return new Response("Not found", {
              status: 404,
              headers: { "content-type": "text/plain; charset=utf-8" }
            });
          }
        }
      }
    );

    const missingInternalPath = "/portal-dist/assets/" + missingPublicPath.slice("/portal/assets/".length);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
    assert.equal(await response.text(), "Portal asset unavailable.");
    assert.deepEqual(records.map((record) => ({
      diagnostic: record.diagnostic,
      request_path: record.request_path,
      rewritten_path: record.rewritten_path,
      upstream_status: record.upstream_status,
      upstream_content_type: record.upstream_content_type,
      rejection_reason: record.rejection_reason,
      final_status: record.final_status
    })), [
      {
        diagnostic: "portal_asset",
        request_path: missingPublicPath,
        rewritten_path: missingInternalPath,
        upstream_status: 404,
        upstream_content_type: "text/plain; charset=utf-8",
        rejection_reason: "upstream-status",
        final_status: 404
      }
    ]);
  } finally {
    console.log = originalLog;
  }
});

test("rejects HTML fallback responses for Portal asset requests", async () => {
  const response = await worker.fetch(
    new Request("https://threshold.example/portal/assets/index-test.js"),
    {
      ASSETS: {
        async fetch() {
          return new Response("<!doctype html><title>Threshold Hub - Entry</title>", {
            headers: { "content-type": "text/html; charset=utf-8" }
          });
        }
      }
    }
  );

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(await response.text(), "Portal asset unavailable.");
});

test("records Portal asset delivery decisions", async () => {
  const records = [];
  const originalLog = console.log;
  console.log = (record) => {
    if (typeof record === "string") {
      records.push(JSON.parse(record));
    }
  };

  try {
    await worker.fetch(
      new Request("https://threshold.example/portal/assets/index-test.js"),
      {
        ASSETS: {
          async fetch() {
            return new Response('console.log("portal asset")', {
              headers: { "content-type": "application/javascript" }
            });
          }
        }
      }
    );
    await worker.fetch(
      new Request("https://threshold.example/portal/assets/index-test.js"),
      {
        ASSETS: {
          async fetch() {
            return new Response("<!doctype html><title>Threshold Hub - Entry</title>", {
              headers: { "content-type": "text/html; charset=utf-8" }
            });
          }
        }
      }
    );

    assert.deepEqual(records.map((record) => ({
      diagnostic: record.diagnostic,
      request_path: record.request_path,
      rewritten_path: record.rewritten_path,
      upstream_status: record.upstream_status,
      upstream_content_type: record.upstream_content_type,
      rejection_reason: record.rejection_reason,
      final_status: record.final_status
    })), [
      {
        diagnostic: "portal_asset",
        request_path: "/portal/assets/index-test.js",
        rewritten_path: "/portal-dist/assets/index-test.js",
        upstream_status: 200,
        upstream_content_type: "application/javascript",
        rejection_reason: null,
        final_status: 200
      },
      {
        diagnostic: "portal_asset",
        request_path: "/portal/assets/index-test.js",
        rewritten_path: "/portal-dist/assets/index-test.js",
        upstream_status: 200,
        upstream_content_type: "text/html; charset=utf-8",
        rejection_reason: "upstream-html-fallback",
        final_status: 404
      }
    ]);
    assert.ok(records.every((record) => (
      Number.isFinite(record.assetFetchDurationMs)
      && record.assetFetchDurationMs >= 0
      && Number.isFinite(record.totalDurationMs)
      && record.totalDurationMs >= record.assetFetchDurationMs
      && Number.isFinite(Date.parse(record.startedAt))
      && Number.isFinite(Date.parse(record.assetFetchStartedAt))
      && Number.isFinite(Date.parse(record.assetFetchCompletedAt))
      && Number.isFinite(Date.parse(record.completedAt))
    )));
  } finally {
    console.log = originalLog;
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

test("Doug routes grounded help requests to a relevant portal seam", async () => {
  const response = await worker.fetch(
    new Request("https://threshold.example/api/doug/help", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "I am lost in the spiral", path: "/spiral-grove" })
    }),
    {}
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    version: VERSION,
    label: "Doug’s desk",
    answer: "I can start from where you are and make the next seam less sharp.",
    href: "/portal/motion",
    action: "Enter Motion"
  });
});

test("Doug requires a readable help question", async () => {
  const response = await worker.fetch(
    new Request("https://threshold.example/api/doug/help", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "" })
    }),
    {}
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    version: VERSION,
    error: "Doug needs a question before he can find the right form."
  });
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