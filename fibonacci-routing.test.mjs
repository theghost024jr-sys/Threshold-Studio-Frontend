import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import routes from "./website/config/fibonacci-routes.json" with { type: "json" };
import {
  buildFibonacciUrl,
  FIBONACCI_SEQUENCE,
  nextFibonacciFib,
  readFibonacciLineage,
  resolveFibonacciRoute
} from "./website/scripts/fibonacci-routing.js";

test("uses the decreasing Fibonacci layering law", () => {
  assert.deepEqual(FIBONACCI_SEQUENCE, [13, 8, 5, 3, 2, 1]);
  assert.deepEqual(routes.sequence, FIBONACCI_SEQUENCE);
});

test("maps House and Garden paths to Fib 8 versions", () => {
  assert.equal(resolveFibonacciRoute(routes, "house-garden", "garden").version, "v3-vines");
  assert.equal(resolveFibonacciRoute(routes, "house-garden", "shaper").version, "v2-black-shapers");
  assert.equal(resolveFibonacciRoute(routes, "house-garden", "chamber").version, "v1-green-box");
});

test("carries route lineage into the spoke URL", () => {
  const lineage = resolveFibonacciRoute(routes, "house-garden", "garden");
  const url = buildFibonacciUrl(lineage);
  assert.deepEqual(readFibonacciLineage(url.slice(url.indexOf("?"))), {
    spoke: "house-garden",
    path: "garden",
    version: "v3-vines",
    fib: 8
  });
});

test("rejects routes that do not move inward", () => {
  const invalid = structuredClone(routes);
  invalid.spokes["house-garden"].routes[0].targetFib = 13;
  assert.throws(
    () => resolveFibonacciRoute(invalid, "house-garden", "garden"),
    /must move inward/
  );
});

test("keeps Fib 8 route manifests aligned with the loader contract", async () => {
  const spoke = routes.spokes["house-garden"];
  for (const route of spoke.routes) {
    const source = await readFile(
      new URL(`./website/house-and-garden/fib8/${route.version}/route.json`, import.meta.url),
      "utf8"
    );
    const manifest = JSON.parse(source);
    assert.equal(manifest.spoke, "house-garden");
    assert.equal(manifest.path, route.id);
    assert.equal(manifest.version, route.version);
    assert.equal(manifest.fib, route.targetFib);
  }
  assert.deepEqual(Object.keys(spoke.continuation).map(Number), [1, 2, 3, 5]);
});

test("moves inward one Fibonacci ring at a time", () => {
  assert.equal(nextFibonacciFib(13), 8);
  assert.equal(nextFibonacciFib(8), 5);
  assert.equal(nextFibonacciFib(5), 3);
  assert.equal(nextFibonacciFib(3), 2);
  assert.equal(nextFibonacciFib(2), 1);
  assert.equal(nextFibonacciFib(1), 1);
});