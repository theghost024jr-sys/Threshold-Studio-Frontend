import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const loaderSource = await readFile(new URL("../scripts/chamber-loader.js", import.meta.url), "utf8");

async function runLoader(search = "") {
  const listeners = new Map();
  const logs = [];
  const window = {
    location: { search },
    localStorage: {
      getItem: function () { return null; },
      setItem: function () {}
    },
    addEventListener: function (name, listener) {
      listeners.set(name, listener);
    },
    dispatchEvent: function (event) {
      const listener = listeners.get(event.type);
      if (listener) {
        listener(event);
      }
    }
  };

  const context = vm.createContext({
    URLSearchParams,
    console: {
      info: function (...args) { logs.push(args); }
    },
    document: {
      querySelector: function () {
        return { dataset: { branch: "garden" } };
      },
      getElementById: function () { return null; }
    },
    fetch: async function () {
      return { ok: false };
    },
    window
  });

  await vm.runInContext(loaderSource, context);
  return { logs, window };
}

test("chamber loader diagnostics are silent by default", async () => {
  const { logs, window } = await runLoader();

  assert.equal(window.thresholdChamberDiagnostics.status(), false);
  assert.equal(logs.length, 0);
});

test("diagnostics report chamber entry before identity data resolves", async () => {
  const { logs, window } = await runLoader("?thresholdDiagnostics=1");

  assert.equal(window.thresholdChamberDiagnostics.status(), true);
  assert.match(logs[0][0], /Loader:Chamber/);
  assert.match(logs[0][0], /Entered garden/);
  assert.match(logs.at(-1)[0], /No identity data found for garden/);
});

test("diagnostics report glyph interaction details", async () => {
  const { logs, window } = await runLoader("?thresholdDiagnostics=1");
  const detail = { glyphId: "soil", chamberId: "garden" };

  window.dispatchEvent({ type: "threshold:glyph-interaction", detail });

  assert.match(logs.at(-1)[0], /Loader:Glyph/);
  assert.deepEqual(logs.at(-1)[3], detail);
});