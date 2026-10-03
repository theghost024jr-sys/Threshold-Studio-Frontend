import assert from "node:assert/strict";
import test from "node:test";

const events = [];
globalThis.window = {
  dispatchEvent(event) {
    events.push(event);
  },
  setTimeout(callback) {
    callback();
  }
};

const thresholdEngineModule = await import("../threshold-engine.js");

function createBranch(id) {
  return {
    id,
    visible: true,
    state: "stable",
    payload: null,
    hide() {
      this.visible = false;
      this.state = "hidden";
    },
    reveal() {
      this.visible = true;
      this.state = "stable";
      this.payload = null;
    },
    pulse() {
      this.state = "pulsing";
    },
    alter(payload) {
      this.state = "altered";
      this.payload = payload;
    }
  };
}

test("applies an explicit action to the glyph node and publishes its update", () => {
  events.length = 0;
  const branch = createBranch("home");
  const glyphEngine = new thresholdEngineModule.ThresholdGlyphEngine({}, {
    pickBranch(id) {
      return id === "home" ? branch : null;
    }
  });

  const update = glyphEngine.glyphInteractWithBranch({ nodeId: "home", action: "alter", glyphId: "field-signal" });

  assert.deepEqual(update, {
    branchId: "home",
    action: "alter",
    glyph: { nodeId: "home", action: "alter", glyphId: "field-signal" },
    visible: true,
    state: "altered",
    payload: { glyph: { nodeId: "home", action: "alter", glyphId: "field-signal" } }
  });
  assert.equal(events.length, 1);
  assert.deepEqual(events[0].detail, update);
});

test("returns null without publishing an update when no branch is available", () => {
  events.length = 0;
  const glyphEngine = new thresholdEngineModule.ThresholdGlyphEngine({}, { pickBranch: () => null });

  assert.equal(glyphEngine.glyphInteractWithBranch({ nodeId: "missing", action: "hide" }), null);
  assert.equal(events.length, 0);
});