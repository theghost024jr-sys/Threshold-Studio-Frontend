export function createMainHubRuntime({
  engine,
  navigate,
  destination,
  onStateChange = () => {},
} = {}) {
  let initialized = false;
  let destroyed = false;
  let pendingCrossing = null;

  function emit(state, detail = {}) {
    onStateChange({
      state,
      ...detail,
    });
  }

  async function initialize() {
    if (destroyed || initialized) {
      return;
    }

    initialized = true;
    if (!engine || typeof engine.synchronize !== "function") {
      emit("engine-unavailable");
      return;
    }

    try {
      const result = await engine.synchronize();
      if (destroyed) {
        return;
      }

      if (result?.status !== "ok") {
        emit("engine-unavailable", { result });
        return;
      }

      emit("ready", { snapshot: result.snapshot });
    } catch (error) {
      emit("engine-unavailable", { error });
    }
  }

  async function performFirstCrossing() {
    if (destroyed) {
      return false;
    }

    if (!engine || typeof engine.activateFirstCrossing !== "function") {
      emit("crossing-unavailable");
      return false;
    }

    emit("crossing-pending");

    let result;
    try {
      result = await engine.activateFirstCrossing();
    } catch (error) {
      if (!destroyed) {
        emit("crossing-unavailable", { error });
      }
      return false;
    }

    if (destroyed) {
      return false;
    }

    if (result?.status === "recorded-only") {
      emit("crossing-unchanged", { result });
      return false;
    }

    if (result?.status === "rejected") {
      emit("crossing-rejected", { result });
      return false;
    }

    if (result?.status !== "state-changed") {
      emit("crossing-unavailable", { result });
      return false;
    }

    if (typeof destination !== "string" || destination.length === 0 || typeof navigate !== "function") {
      emit("crossing-unavailable", { result });
      return false;
    }

    emit("crossing-state-changed", { result });
    navigate(destination);
    return true;
  }

  function requestFirstCrossing() {
    if (destroyed) {
      return Promise.resolve(false);
    }

    if (pendingCrossing) {
      return pendingCrossing;
    }

    pendingCrossing = performFirstCrossing().finally(() => {
      pendingCrossing = null;
    });

    return pendingCrossing;
  }

  function destroy() {
    destroyed = true;
    pendingCrossing = null;
    emit("destroyed");
  }

  return {
    initialize,
    requestFirstCrossing,
    destroy,
  };
}
