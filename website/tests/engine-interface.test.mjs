import assert from "node:assert/strict";
import test from "node:test";

import {
  EngineContractError,
  assertAuthoritativeState,
  createNodeActivationIntent,
  createNodeInputIntent
} from "../scripts/engine-contract.js";
import { createEngineInterface } from "../scripts/engine-interface.js";

function createBrowserHarness() {
  const events = [];
  const previous = {
    CustomEvent: globalThis.CustomEvent,
    fetch: globalThis.fetch,
    window: globalThis.window
  };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init.detail;
    }
  };
  globalThis.window = {
    dispatchEvent(event) {
      events.push(event);
      return true;
    }
  };
  return {
    events,
    restore() {
      Object.assign(globalThis, previous);
    }
  };
}

test("creates immutable node intents from frontend-safe payloads", () => {
  const intent = createNodeInputIntent("node-1", { action: "select" });
  assert.deepEqual(intent, {
    type: "node.input",
    nodeId: "node-1",
    payload: { action: "select" }
  });
  assert.ok(Object.isFrozen(intent));
  assert.ok(Object.isFrozen(intent.payload));
});

test("rejects frontend attempts to send authoritative engine state", () => {
  assert.throws(
    () => createNodeInputIntent("node-1", { action: "select", worldState: "collapse" }),
    (error) => error instanceof EngineContractError && error.code === "authoritative-field"
  );
});

test("allows only the explicit selection input schema", () => {
  assert.throws(
    () => createNodeInputIntent("node-1", { action: "highlight" }),
    (error) => error instanceof EngineContractError && error.code === "unsupported-intent"
  );
  assert.throws(
    () => createNodeInputIntent("node-1", { action: "select", extra: true }),
    (error) => error instanceof EngineContractError && error.code === "unsupported-intent"
  );
});

test("validates node activation against canonical identity", () => {
  const canonicalNodeIds = new Set(["basin", "glyph_archive"]);
  assert.deepEqual(createNodeActivationIntent("basin", canonicalNodeIds), {
    type: "node.activate",
    nodeId: "basin",
    payload: { type: "node.activate" }
  });
  assert.throws(
    () => createNodeActivationIntent("invented-node", canonicalNodeIds),
    (error) => error instanceof EngineContractError && error.code === "unknown-canonical-node"
  );
});

test("requires an ordered authoritative engine snapshot", () => {
  assert.deepEqual(assertAuthoritativeState({ sequence: 4, worldState: "stable" }), {
    sequence: 4,
    worldState: "stable"
  });
  assert.throws(
    () => assertAuthoritativeState({ sequence: -1 }),
    (error) => error instanceof EngineContractError && error.code === "invalid-state"
  );
});

test("emits intent acceptance before the next authoritative state event", async () => {
  const browser = createBrowserHarness();
  try {
    const responses = [
      Response.json({ sequence: 1 }),
      Response.json({ acceptedAt: 4 }),
      Response.json({ sequence: 2 })
    ];
    globalThis.fetch = async (url, options) => {
      if (url === "http://engine.test/input/node-1") {
        assert.equal(options.method, "POST");
        assert.deepEqual(JSON.parse(options.body), { action: "select" });
      }
      return responses.shift();
    };
    const engine = createEngineInterface({ endpoint: "http://engine.test", root: { dataset: {} } });
    await engine.tick();
    const result = await engine.applyInput("node-1", { action: "select" });
    await engine.tick();
    assert.equal(result.type, "accepted");
    assert.deepEqual(browser.events.map((event) => event.type), [
      "threshold:engine-state",
      "threshold:engine-intent-accepted",
      "threshold:engine-state"
    ]);
  } finally {
    browser.restore();
  }
});

test("submits activation only through canonical-node validation", async () => {
  const browser = createBrowserHarness();
  try {
    let requested = false;
    globalThis.fetch = async (url, options) => {
      requested = true;
      assert.equal(url, "http://engine.test/input/basin");
      assert.deepEqual(JSON.parse(options.body), { type: "node.activate" });
      return Response.json({ status: "ok" });
    };
    const engine = createEngineInterface({ endpoint: "http://engine.test", root: { dataset: {} } });
    const accepted = await engine.activateNode("basin", new Set(["basin"]));
    const rejected = await engine.activateNode("invented-node", new Set(["basin"]));
    assert.equal(accepted.type, "accepted");
    assert.equal(rejected.type, "rejected");
    assert.equal(rejected.code, "unknown-canonical-node");
    assert.equal(requested, true);
    assert.equal("applyIntent" in engine, false);
  } finally {
    browser.restore();
  }
});

test("rejects every authoritative field without contacting the engine", async () => {
  const browser = createBrowserHarness();
  try {
    let requested = false;
    globalThis.fetch = async () => {
      requested = true;
      return Response.json({});
    };
    const engine = createEngineInterface({ endpoint: "http://engine.test", root: { dataset: {} } });
    const authorityFields = ["active", "chambers", "click", "migration", "threshold", "tint", "volatility", "worldState"];
    for (const field of authorityFields) {
      const result = await engine.applyInput("node-1", { [field]: "frontend-value" });
      assert.equal(result.type, "rejected");
      assert.equal(result.code, "authoritative-field");
    }
    assert.equal(requested, false);
    assert.deepEqual(
      browser.events.map((event) => event.type),
      Array(authorityFields.length).fill("threshold:engine-rejection")
    );
    assert.ok(browser.events.every((event) => event.type !== "threshold:engine-intent-accepted"));
  } finally {
    browser.restore();
  }
});
