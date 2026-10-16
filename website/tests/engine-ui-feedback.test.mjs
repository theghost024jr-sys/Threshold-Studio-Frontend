import assert from "node:assert/strict";
import test from "node:test";

import { bindEngineFeedback } from "../scripts/engine-ui-feedback.js";

function event(type, detail) {
  return new CustomEvent(type, { detail });
}

test("renders authoritative state, accepted intent, and rejection feedback", () => {
  const eventTarget = new EventTarget();
  const root = { dataset: {} };
  const status = { dataset: {}, textContent: "" };
  const unbind = bindEngineFeedback({ root, status, eventTarget });

  eventTarget.dispatchEvent(event("threshold:engine-state", { sequence: 8 }));
  assert.equal(root.dataset.engineFeedbackState, "synchronized");
  assert.equal(root.dataset.engineSequence, "8");
  assert.equal(status.textContent, "Engine state synchronized at sequence 8.");

  eventTarget.dispatchEvent(event("threshold:engine-intent-accepted", {
    intent: { type: "node.input", nodeId: "node-1" }
  }));
  assert.equal(root.dataset.engineFeedbackState, "accepted");
  assert.equal(status.textContent, "Engine accepted node.input for node-1.");

  eventTarget.dispatchEvent(event("threshold:engine-rejection", {
    message: "Frontend intent must not include authoritative field \"payload.threshold\"."
  }));
  assert.equal(root.dataset.engineFeedbackState, "rejected");
  assert.match(status.textContent, /Engine rejected intent/);

  unbind();
  eventTarget.dispatchEvent(event("threshold:engine-state", { sequence: 9 }));
  assert.equal(root.dataset.engineSequence, "8");
});
