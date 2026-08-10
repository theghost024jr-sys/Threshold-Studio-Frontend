import assert from "node:assert/strict";
import test from "node:test";

import worker from "./index.js";

function pulse(overrides = {}) {
  const state = {
    version: "v3-vines",
    choice: "mist-gate",
    direction: "north",
    ...(overrides.state || {})
  };
  const relicState = {
    version: state.version,
    choice: state.choice,
    shimmer: false,
    stays: 0
  };
  return {
    state,
    seed: {
      kind: "relic",
      fromFib: 8,
      state: relicState,
      relic: { fib: 8, direction: state.direction, state: relicState }
    },
    signal: "proceed",
    ...overrides
  };
}

function env(objects = new Map()) {
  return {
    SEED_SECRET: "test-seed-secret",
    NODE_BUNDLES: {
      async get(key) {
        const body = objects.get(key);
        return body === undefined ? null : { body, etag: `etag-${key}` };
      }
    },
    ASSETS: { fetch: async () => new Response("anchor") }
  };
}

test("plants a seed and reports signed progression", async () => {
  const planted = await worker.fetch(new Request("https://example.test/api/seeds/plant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ spoke: "mythology" })
  }), env());

  assert.equal(planted.status, 200);
  const cookie = planted.headers.get("set-cookie").split(";", 1)[0];
  const progression = await worker.fetch(new Request("https://example.test/api/progression", {
    headers: { cookie }
  }), env());
  assert.deepEqual(await progression.json(), { seedPlanted: true });
});

test("requires progression for protected activation", async () => {
  const response = await worker.fetch(new Request("https://example.test/api/nodes/activate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ spoke: "mythology", activation: "vault" })
  }), env());

  assert.equal(response.status, 403);
});

test("reads activation bundles and assets from their private R2 keys", async () => {
  const objects = new Map([
    ["nodes/mythology/mythology.json", JSON.stringify({
      id: "mythology",
      choices: [{ id: "open", activation: "open" }]
    })],
    ["nodes/mythology/open.json", JSON.stringify({ id: "open", children: [] })],
    ["assets/mythology/open/map.png", "asset"]
  ]);
  const bindings = env(objects);
  const bootstrap = await worker.fetch(new Request("https://example.test/api/nodes/activate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ spoke: "mythology", activation: "mythology", pulse: null })
  }), bindings);
  const activation = await worker.fetch(new Request("https://example.test/api/nodes/activate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ spoke: "mythology", activation: "open", pulse: pulse() })
  }), bindings);
  const asset = await worker.fetch(new Request("https://example.test/api/nodes/assets/mythology/open/map.png"), bindings);

  assert.deepEqual(await bootstrap.json(), {
    id: "mythology",
    children: [{ id: "open", activation: "open" }]
  });
  assert.deepEqual(await activation.json(), { id: "open", children: [] });
  assert.equal(activation.headers.get("cache-control"), "private, no-store");
  assert.equal(await asset.text(), "asset");
  assert.equal(asset.headers.get("cache-control"), "private, max-age=3600");
});

test("does not route nested asset paths into R2", async () => {
  const response = await worker.fetch(new Request("https://example.test/api/nodes/assets/mythology/open/../secret.json"), env());
  assert.equal(await response.text(), "anchor");
});

test("rejects missing or malformed pulses before reading a child node", async () => {
  const objects = new Map([["nodes/mythology/open.json", "bundle"]]);
  const bindings = env(objects);
  const missing = await worker.fetch(new Request("https://example.test/api/nodes/activate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ spoke: "mythology", activation: "open" })
  }), bindings);
  const unclear = await worker.fetch(new Request("https://example.test/api/nodes/activate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      spoke: "mythology",
      activation: "open",
      pulse: pulse({ signal: "return" })
    })
  }), bindings);
  const contaminated = await worker.fetch(new Request("https://example.test/api/nodes/activate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      spoke: "mythology",
      activation: "open",
      pulse: { ...pulse(), vault: { heavy: true } }
    })
  }), bindings);
  const nestedContamination = pulse();
  nestedContamination.seed.state.vault = { heavy: true };
  nestedContamination.seed.relic.state.vault = { heavy: true };
  const nested = await worker.fetch(new Request("https://example.test/api/nodes/activate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      spoke: "mythology",
      activation: "open",
      pulse: nestedContamination
    })
  }), bindings);

  assert.equal(missing.status, 409);
  assert.equal(unclear.status, 409);
  assert.equal(contaminated.status, 409);
  assert.equal(nested.status, 409);
  assert.deepEqual(await missing.json(), { error: "Pulse rejected" });
});