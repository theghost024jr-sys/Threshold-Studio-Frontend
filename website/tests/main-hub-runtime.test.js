import fs from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMainHubRuntime } from "../scripts/main-hub-runtime.js";

const HOUSE_GARDEN_DESTINATION = "/housegarden.html";

function createHarness({
  activateFirstCrossing = vi.fn().mockResolvedValue({
    status: "state-changed",
    responded: true,
  }),
  synchronize = vi.fn().mockResolvedValue({ status: "ok", snapshot: {} }),
} = {}) {
  const engine = { activateFirstCrossing, synchronize };
  const navigate = vi.fn();
  const onStateChange = vi.fn();
  const runtime = createMainHubRuntime({
    engine,
    navigate,
    destination: HOUSE_GARDEN_DESTINATION,
    onStateChange,
  });

  return { engine, navigate, onStateChange, runtime };
}

describe("Main Hub runtime", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("MHR-003 initialization may synchronize Engine state but does not activate", async () => {
    const { engine, navigate, runtime } = createHarness();

    await runtime.initialize();

    expect(engine.synchronize).toHaveBeenCalledTimes(1);
    expect(engine.activateFirstCrossing).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("MHR-005 deliberate first crossing requests one adapter activation", async () => {
    const { engine, runtime } = createHarness();

    await runtime.requestFirstCrossing();

    expect(engine.activateFirstCrossing).toHaveBeenCalledTimes(1);
  });

  it("MHR-007 accepted state change permits the current crossing flow", async () => {
    const { navigate, runtime } = createHarness();

    await runtime.requestFirstCrossing();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(HOUSE_GARDEN_DESTINATION);
  });

  it("MHR-008 never navigates before adapter activation resolves", async () => {
    let resolveActivation;
    const activateFirstCrossing = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveActivation = resolve;
        }),
    );
    const { navigate, runtime } = createHarness({ activateFirstCrossing });

    const pending = runtime.requestFirstCrossing();

    expect(activateFirstCrossing).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();

    resolveActivation({ status: "state-changed", responded: true });
    await pending;

    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("MHR-011 Engine exception fails closed", async () => {
    const { navigate, runtime } = createHarness({
      activateFirstCrossing: vi.fn().mockRejectedValue(new Error("engine unavailable")),
    });

    await expect(runtime.requestFirstCrossing()).resolves.not.toThrow();

    expect(navigate).not.toHaveBeenCalled();
  });

  it("MHR-010 missing Engine fails closed", async () => {
    const navigate = vi.fn();
    const runtime = createMainHubRuntime({
      engine: null,
      navigate,
      destination: HOUSE_GARDEN_DESTINATION,
    });

    await expect(runtime.requestFirstCrossing()).resolves.not.toThrow();

    expect(navigate).not.toHaveBeenCalled();
  });

  it.each([
    null,
    undefined,
    {},
    { status: "unknown" },
    { status: "error" },
  ])("MHR-012 non-permitted adapter result %# does not navigate", async (response) => {
    const { navigate, runtime } = createHarness({
      activateFirstCrossing: vi.fn().mockResolvedValue(response),
    });

    await runtime.requestFirstCrossing();

    expect(navigate).not.toHaveBeenCalled();
  });

  it("MHR-014 rejected intent does not navigate", async () => {
    const { navigate, onStateChange, runtime } = createHarness({
      activateFirstCrossing: vi.fn().mockResolvedValue({
        status: "rejected",
        rejection: { type: "rejected" },
      }),
    });

    await runtime.requestFirstCrossing();

    expect(navigate).not.toHaveBeenCalled();
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ state: "crossing-rejected" }),
    );
  });

  it.each([
    ["state-changed", true, 1],
    ["recorded-only", false, 0],
    ["rejected", false, 0],
    ["unavailable", false, 0],
  ])(
    "MHR-025 %s with responded %s navigates %i time(s)",
    async (status, responded, expectedNavigations) => {
      const { navigate, runtime } = createHarness({
        activateFirstCrossing: vi.fn().mockResolvedValue({
          status,
          responded,
        }),
      });

      const result = await runtime.requestFirstCrossing();

      expect(navigate).toHaveBeenCalledTimes(expectedNavigations);
      expect(result).toBe(status === "state-changed");
    },
  );

  it("MHR-026 accepted-but-recorded-only can never authorize navigation", async () => {
    const { navigate, runtime } = createHarness({
      activateFirstCrossing: vi.fn().mockResolvedValue({
        status: "recorded-only",
        responded: false,
        acceptance: {
          type: "accepted",
          responded: false,
        },
      }),
    });

    await runtime.requestFirstCrossing();

    expect(navigate).not.toHaveBeenCalled();
  });

  it("MHR-013 records an accepted non-response without crossing", async () => {
    const { navigate, onStateChange, runtime } = createHarness({
      activateFirstCrossing: vi.fn().mockResolvedValue({
        status: "recorded-only",
        responded: false,
      }),
    });

    await runtime.requestFirstCrossing();

    expect(navigate).not.toHaveBeenCalled();
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ state: "crossing-unchanged" }),
    );
  });

  it("MHR-015 repeated input while activation is pending submits only once", async () => {
    let resolveActivation;
    const activateFirstCrossing = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveActivation = resolve;
        }),
    );
    const { navigate, runtime } = createHarness({ activateFirstCrossing });

    const first = runtime.requestFirstCrossing();
    const second = runtime.requestFirstCrossing();

    expect(activateFirstCrossing).toHaveBeenCalledTimes(1);

    resolveActivation({ status: "state-changed", responded: true });
    await Promise.all([first, second]);

    expect(activateFirstCrossing).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("MHR-016 retry is possible after completed Engine failure", async () => {
    const activateFirstCrossing = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporarily unavailable"))
      .mockResolvedValueOnce({ status: "state-changed", responded: true });
    const { navigate, runtime } = createHarness({ activateFirstCrossing });

    await runtime.requestFirstCrossing();

    expect(navigate).not.toHaveBeenCalled();

    await runtime.requestFirstCrossing();

    expect(activateFirstCrossing).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("MHR-017 Hub exploration never calls activateNode", () => {
    const explorationModules = [
      "website/scripts/main-hub-experience.js",
      "website/scripts/hub-graph.js",
      "website/scripts/hub-return-state.js",
      "website/scripts/entry-warmth.js",
      "website/scripts/canonical-path.js",
      "website/scripts/access-flow.js",
    ];

    for (const file of explorationModules) {
      const source = fs.readFileSync(file, "utf8");
      expect(source, `${file} must not request a crossing`).not.toMatch(
        /activateNode\s*\(|activateFirstCrossing\s*\(/,
      );
    }
  });

  it("MHR-019 vault constellation is not crossing authority", () => {
    const source = fs.readFileSync("website/scripts/hub-graph.js", "utf8");

    expect(source).not.toMatch(/activateNode\s*\(/);
  });

  it("MHR-021 only the binding may import the Engine adapter", () => {
    const scripts = fs
      .readdirSync("website/scripts")
      .filter((file) => file.endsWith(".js"));

    for (const file of scripts) {
      if (file === "main-hub-engine-binding.js") {
        continue;
      }

      const source = fs.readFileSync(`website/scripts/${file}`, "utf8");
      expect(source, `${file} must not import the adapter`).not.toMatch(
        /main-hub-engine-adapter/,
      );
    }
  });

  it.todo(
    "MHR-023 authoritative response proves that House & Garden is the target that was activated",
  );
  it.todo(
    "MHR-009 authoritative rejection distinguishes refusal from transport or API failure",
  );
  it.todo("MHR-024 stale authoritative revision cannot authorize crossing");
  it.todo(
    "MHR-018 Engine response proves world relationship support before navigation",
  );
});
