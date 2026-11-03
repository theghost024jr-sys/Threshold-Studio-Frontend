import { describe, expect, it, vi } from "vitest";

import { createMainHubEngineAdapter } from "../scripts/main-hub-engine-adapter.js";

const HOUSE_GARDEN_ID = "housegarden";
const canonicalNodeIds = new Set([
  HOUSE_GARDEN_ID,
  "herbroom",
  "basin",
  "old-forest",
]);

function acceptedActivation({
  responded = true,
  reason = "state-changed",
} = {}) {
  return {
    type: "accepted",
    responded,
    intent: {
      nodeId: HOUSE_GARDEN_ID,
      payload: { type: "node.activate" },
    },
    result: {
      status: "ok",
      recorded: true,
      responded,
      reason,
    },
  };
}

function rejectedActivation({
  code = "engine-rejected",
  message = "Engine input failed (400).",
  status = 400,
} = {}) {
  return { type: "rejected", code, message, status };
}

function createHarness(options = {}) {
  const activationResult = Object.hasOwn(options, "activationResult")
    ? options.activationResult
    : acceptedActivation();
  const engineInterface = {
    tick: vi.fn().mockResolvedValue({ sequence: 1, nodes: [], inputs: [] }),
    activateNode: vi.fn().mockResolvedValue(activationResult),
  };
  const adapter = createMainHubEngineAdapter({
    engineInterface,
    canonicalNodeIds,
  });

  return { adapter, engineInterface };
}

describe("Main Hub Engine adapter intents", () => {
  it("reports unavailable without an Engine interface", () => {
    const adapter = createMainHubEngineAdapter();

    expect(adapter.available()).toBe(false);
  });

  it("synchronizes through tick without activating", async () => {
    const { adapter, engineInterface } = createHarness();

    const result = await adapter.synchronize();

    expect(engineInterface.tick).toHaveBeenCalledTimes(1);
    expect(engineInterface.activateNode).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: "ok", snapshot: { sequence: 1 } });
  });

  it("passes House & Garden and canonical IDs to activateNode", async () => {
    const { adapter, engineInterface } = createHarness();

    await adapter.activateFirstCrossing();

    expect(engineInterface.activateNode).toHaveBeenCalledTimes(1);
    expect(engineInterface.activateNode).toHaveBeenCalledWith(
      HOUSE_GARDEN_ID,
      canonicalNodeIds,
    );
  });

  it("translates an accepted state-changing activation", async () => {
    const { adapter } = createHarness({
      activationResult: acceptedActivation({
        responded: true,
        reason: "state-changed",
      }),
    });

    const result = await adapter.activateFirstCrossing();

    expect(result).toEqual({
      status: "state-changed",
      responded: true,
      acceptance: expect.objectContaining({
        type: "accepted",
        responded: true,
        result: {
          status: "ok",
          recorded: true,
          responded: true,
          reason: "state-changed",
        },
      }),
    });
  });

  it("does not confuse accepted with state-changing", async () => {
    const { adapter } = createHarness({
      activationResult: acceptedActivation({
        responded: false,
        reason: "recorded-only",
      }),
    });

    const result = await adapter.activateFirstCrossing();

    expect(result).toEqual({
      status: "recorded-only",
      responded: false,
      acceptance: expect.objectContaining({
        type: "accepted",
        responded: false,
      }),
    });
  });

  it("preserves Engine rejection as rejection", async () => {
    const rejection = rejectedActivation();
    const { adapter } = createHarness({ activationResult: rejection });

    const result = await adapter.activateFirstCrossing();

    expect(result.status).toBe("rejected");
    expect(result.responded).toBe(false);
    expect(result.rejection).toBe(rejection);
  });

  it("never promotes a rejected intent to acknowledgement", async () => {
    const { adapter } = createHarness({
      activationResult: rejectedActivation({ code: "unknown-node" }),
    });

    const result = await adapter.activateFirstCrossing();

    expect(result.status).not.toBe("state-changed");
    expect(result.responded).not.toBe(true);
  });

  it.each([
    null,
    undefined,
    {},
    { type: "something-else" },
  ])("fails closed for malformed intent result %#", async (activationResult) => {
    const { adapter } = createHarness({ activationResult });

    const result = await adapter.activateFirstCrossing();

    expect(result.status).toBe("unavailable");
    expect(result.responded).not.toBe(true);
  });

  it("returns unavailable when activateNode is absent", async () => {
    const adapter = createMainHubEngineAdapter({
      canonicalNodeIds,
      engineInterface: { tick: vi.fn() },
    });

    await expect(adapter.activateFirstCrossing()).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("contains activation exceptions", async () => {
    const error = new Error("offline");
    const adapter = createMainHubEngineAdapter({
      engineInterface: {
        activateNode: vi.fn().mockRejectedValue(error),
      },
      canonicalNodeIds,
    });

    await expect(adapter.activateFirstCrossing()).resolves.toEqual({
      status: "unavailable",
      error,
    });
  });
});
