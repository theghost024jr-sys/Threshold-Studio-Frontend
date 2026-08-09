const VALID_HUB_STATES = new Set(["idle", "locked", "committed"]);
const VALID_PATHS = new Set(["wake", "fold", "spire", null]);

function normalizeHubState(state) {
  return VALID_HUB_STATES.has(state) ? state : "idle";
}

function normalizePath(path) {
  return VALID_PATHS.has(path) ? path : null;
}

export function createStateStore(initialState = {}) {
  let state = {
    hubState: normalizeHubState(initialState.hubState),
    hoverPath: normalizePath(initialState.hoverPath),
    path: normalizePath(initialState.path),
    reducedMotion: Boolean(initialState.reducedMotion),
    quality: initialState.quality || "high",
  };

  const subscribers = new Set();

  function getState() {
    return state;
  }

  function setState(patch) {
    const next = {
      ...state,
      ...patch,
    };

    next.hubState = normalizeHubState(next.hubState);
    next.path = normalizePath(next.path);
    next.hoverPath = normalizePath(next.hoverPath);

    state = next;

    for (const subscriber of subscribers) {
      subscriber(state);
    }

    return state;
  }

  function subscribe(listener) {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  }

  return {
    getState,
    setState,
    subscribe,
  };
}

export function createInitialEngineStateFromDom() {
  const root = document.body;
  return {
    hubState: root?.dataset?.hubState || "idle",
    hoverPath: root?.dataset?.hover || null,
    path: root?.dataset?.path || null,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}
