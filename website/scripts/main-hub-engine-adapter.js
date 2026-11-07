const HOUSE_GARDEN_NODE_ID = "housegarden";
const DEFAULT_CANONICAL_NODE_IDS = new Set([
  HOUSE_GARDEN_NODE_ID,
  "herbroom",
  "basin",
  "old-forest",
]);

export function createMainHubEngineAdapter({
  engineInterface,
  canonicalNodeIds = DEFAULT_CANONICAL_NODE_IDS,
} = {}) {
  function available() {
    return Boolean(
      engineInterface
      && typeof engineInterface.activateNode === "function",
    );
  }

  async function synchronize() {
    if (!engineInterface || typeof engineInterface.tick !== "function") {
      return { status: "unavailable" };
    }

    try {
      const snapshot = await engineInterface.tick();
      return { status: "ok", snapshot };
    } catch (error) {
      return { status: "unavailable", error };
    }
  }

  async function activateFirstCrossing() {
    if (!available()) {
      return { status: "unavailable" };
    }

    try {
      const response = await engineInterface.activateNode(
        HOUSE_GARDEN_NODE_ID,
        canonicalNodeIds,
      );

      if (!response) {
        return { status: "unavailable" };
      }

      if (response.type === "rejected") {
        return {
          status: "rejected",
          responded: false,
          rejection: response,
        };
      }

      if (response.type !== "accepted") {
        return { status: "unavailable", response };
      }

      if (response.responded !== true) {
        return {
          status: "recorded-only",
          responded: false,
          acceptance: response,
        };
      }

      return {
        status: "state-changed",
        responded: true,
        acceptance: response,
      };
    } catch (error) {
      return { status: "unavailable", error };
    }
  }

  return Object.freeze({
    available,
    synchronize,
    activateFirstCrossing,
  });
}
