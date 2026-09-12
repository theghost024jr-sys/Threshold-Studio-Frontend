import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../scripts/image-fallback.js", import.meta.url), "utf8");
const context = {};
vm.runInNewContext(source, context);
const images = context.ThresholdImages;

class FakeImage {
  constructor() {
    this.dataset = {};
    this.hidden = false;
    this.listeners = new Map();
    this.src = "";
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type) {
    this.listeners.delete(type);
  }

  removeAttribute(name) {
    if (name === "src") {
      this.src = "";
    }
  }

  emit(type) {
    this.listeners.get(type)?.();
  }
}

test("advances through unique image providers in priority order", () => {
  const image = new FakeImage();
  images.loadWithFallback(image, ["/preferred.png", "/next.png", "/next.png", "/last.png"]);

  assert.equal(image.src, "/preferred.png");
  image.emit("error");
  assert.equal(image.src, "/next.png");
  image.emit("error");
  assert.equal(image.src, "/last.png");
  image.emit("load");
  assert.equal(image.dataset.imageState, "fallback-loaded");
});

test("hides an image only after every provider fails", () => {
  const image = new FakeImage();
  images.loadWithFallback(image, ["/first.png", "/second.png"]);

  image.emit("error");
  assert.equal(image.hidden, false);
  image.emit("error");
  assert.equal(image.hidden, true);
  assert.equal(image.src, "");
  assert.equal(image.dataset.imageState, "unavailable");
});

test("replaces the provider chain when a reusable image changes context", () => {
  const image = new FakeImage();
  images.loadWithFallback(image, ["/old.png", "/old-fallback.png"]);
  images.loadWithFallback(image, ["/new.png", "/new-fallback.png"]);

  image.emit("error");
  assert.equal(image.src, "/new-fallback.png");
});

test("prioritizes record assets before shared defaults", () => {
  const candidates = images.candidatesFor({
    assets: [{ webPath: "/record-primary.png" }, { webPath: "/record-secondary.png" }],
    asset: "/record-primary.png"
  }, ["/shared.png"]);

  assert.deepEqual(Array.from(candidates), [
    "/record-primary.png",
    "/record-secondary.png",
    "/shared.png"
  ]);
  assert.equal(Array.from(images.defaultCandidates).some((path) => path.includes("/weather/")), false);
});