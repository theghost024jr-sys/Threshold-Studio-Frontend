(function () {
  const storageKey = "threshold.harmonyLaw.v1";
  const page = getPageKey();
  const body = document.body;

  if (!body || !page) {
    return;
  }

  const state = loadState();
  recordVisit();
  applyHarmony();
  persistState();

  let moveGateUntil = 0;

  document.addEventListener("click", function () {
    registerStimulus("click");
  }, { passive: true });

  document.addEventListener("keydown", function () {
    registerStimulus("key");
  }, { passive: true });

  document.addEventListener("pointermove", function () {
    const now = Date.now();
    if (now < moveGateUntil) {
      return;
    }
    moveGateUntil = now + 1200;
    registerStimulus("move");
  }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      persistState();
    }
  });

  window.addEventListener("beforeunload", persistState);

  window.thresholdHarmonyLaw = {
    getState: function () {
      return snapshotState();
    },
    registerStimulus: registerStimulus,
    phase: function () {
      return computePhase();
    }
  };

  function registerStimulus(type) {
    if (!state.stimulus[type]) {
      state.stimulus[type] = 0;
    }
    state.stimulus[type] += 1;
    state.totalInteractions += 1;
    applyHarmony();
  }

  function recordVisit() {
    if (!state.visits[page]) {
      state.visits[page] = 0;
    }
    state.visits[page] += 1;
    state.totalVisits += 1;

    if (state.lastPage && state.lastPage !== page) {
      const edge = state.lastPage + "->" + page;
      if (!state.transitions[edge]) {
        state.transitions[edge] = 0;
      }
      state.transitions[edge] += 1;
    }

    state.lastPage = page;
    state.updatedAt = Date.now();
  }

  function computePhase() {
    const uniquePages = Object.keys(state.visits).length;
    const transitions = Object.keys(state.transitions).length;
    const interactionWeight = Math.min(20, Math.floor(state.totalInteractions / 8));
    const score = uniquePages + transitions + interactionWeight;

    if (score < 8) {
      return "seed";
    }
    if (score < 16) {
      return "weave";
    }
    if (score < 25) {
      return "bloom";
    }
    return "resolve";
  }

  function computeCoherence() {
    const totalTransitionWeight = Object.keys(state.transitions).reduce(function (acc, key) {
      return acc + state.transitions[key];
    }, 0);
    const uniquePages = Math.max(1, Object.keys(state.visits).length);
    const density = totalTransitionWeight / uniquePages;

    if (density < 1.5) {
      return "soft";
    }
    if (density < 3) {
      return "woven";
    }
    return "harmonic";
  }

  function applyHarmony() {
    const phase = computePhase();
    const coherence = computeCoherence();

    body.dataset.harmonyPhase = phase;
    body.dataset.harmonyCoherence = coherence;
    body.dataset.harmonyPage = page;

    const profile = getPhaseProfile(phase, coherence);
    body.style.setProperty("--harmony-glow", String(profile.glow));
    body.style.setProperty("--harmony-saturate", String(profile.saturate));
    body.style.setProperty("--harmony-breath-duration", profile.breathDuration + "s");

    window.dispatchEvent(new CustomEvent("threshold:harmony-update", {
      detail: {
        page: page,
        phase: phase,
        coherence: coherence,
        visits: state.totalVisits,
        interactions: state.totalInteractions
      }
    }));
  }

  function getPhaseProfile(phase, coherence) {
    const base = {
      glow: 0.12,
      saturate: 1,
      breathDuration: 12
    };

    if (phase === "seed") {
      base.glow = 0.1;
      base.saturate = 0.98;
      base.breathDuration = 13;
    } else if (phase === "weave") {
      base.glow = 0.16;
      base.saturate = 1.02;
      base.breathDuration = 11;
    } else if (phase === "bloom") {
      base.glow = 0.22;
      base.saturate = 1.06;
      base.breathDuration = 9;
    } else if (phase === "resolve") {
      base.glow = 0.18;
      base.saturate = 1.01;
      base.breathDuration = 10;
    }

    if (coherence === "woven") {
      base.glow += 0.03;
    } else if (coherence === "harmonic") {
      base.glow += 0.06;
      base.saturate += 0.02;
    }

    return base;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return freshState();
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return freshState();
      }

      return {
        visits: parsed.visits && typeof parsed.visits === "object" ? parsed.visits : {},
        transitions: parsed.transitions && typeof parsed.transitions === "object" ? parsed.transitions : {},
        stimulus: parsed.stimulus && typeof parsed.stimulus === "object" ? parsed.stimulus : {},
        totalVisits: Number(parsed.totalVisits || 0),
        totalInteractions: Number(parsed.totalInteractions || 0),
        lastPage: typeof parsed.lastPage === "string" ? parsed.lastPage : "",
        updatedAt: Number(parsed.updatedAt || Date.now())
      };
    } catch (error) {
      return freshState();
    }
  }

  function freshState() {
    return {
      visits: {},
      transitions: {},
      stimulus: {},
      totalVisits: 0,
      totalInteractions: 0,
      lastPage: "",
      updatedAt: Date.now()
    };
  }

  function persistState() {
    try {
      state.updatedAt = Date.now();
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      // Ignore storage restrictions.
    }
  }

  function snapshotState() {
    return {
      visits: Object.assign({}, state.visits),
      transitions: Object.assign({}, state.transitions),
      stimulus: Object.assign({}, state.stimulus),
      totalVisits: state.totalVisits,
      totalInteractions: state.totalInteractions,
      lastPage: state.lastPage,
      updatedAt: state.updatedAt
    };
  }

  function getPageKey() {
    const path = window.location.pathname;
    if (!path) {
      return "unknown";
    }

    const file = path.split("/").pop() || "index.html";
    return file.replace(/\.html$/i, "") || "index";
  }
})();