(function (root) {
  "use strict";

  const EMOTIONS = Object.freeze(["fear", "relief", "confusion", "reflection"]);
  const GLYPH_EMOTIONS = Object.freeze({
    collapse: "fear",
    expand: "relief",
    fog: "confusion",
    soil: "reflection"
  });
  const GLYPH_EFFECTS = Object.freeze({
    collapse: Object.freeze({ status: "unstable", effects: ["cracks", "pressure", "deepened-descent"] }),
    expand: Object.freeze({ status: "open", effects: ["new-paths", "clarity", "release"] }),
    fog: Object.freeze({ status: "obscured", effects: ["hidden-routes", "softened-boundaries", "drift"] }),
    soil: Object.freeze({ status: "grounded", effects: ["memory", "compost", "anchoring"] })
  });
  const STORAGE_KEY = "threshold.circle2.emotions.v1";

  function freshState() {
    return {
      emotion: { fear: 0, relief: 0, confusion: 0, reflection: 0 },
      chamber: { id: null, force: null, status: "stable", effects: [] },
      visibleGlyphs: [],
      activatedGlyphs: [],
      ethos: { pressure: 0, boundary: "balanced", identity: "steady", adjacency: "stable" },
      lastInput: null
    };
  }

  function checkGlyphAppearance(chamber, emotion) {
    if (!chamber || !emotion) return null;
    const glyphId = String(chamber.force || "").toLowerCase();
    const emotionId = GLYPH_EMOTIONS[glyphId];
    return emotionId && Number(emotion[emotionId] || 0) > 0 ? glyphId : null;
  }

  function createEmotionalEngine(options) {
    const settings = options || {};
    const storage = settings.storage || null;
    const dispatch = typeof settings.dispatch === "function" ? settings.dispatch : function () {};
    let state = loadState(storage);

    function commit(source, detail) {
      state.ethos = deriveEthos(state.emotion);
      state.lastInput = { source: source, detail: detail || null };
      const appearance = checkGlyphAppearance(state.chamber, state.emotion);
      if (appearance && !state.visibleGlyphs.includes(appearance)) {
        state.visibleGlyphs.push(appearance);
        dispatch("threshold:glyph-appeared", { glyph: appearance, state: snapshot() });
      }
      persist(storage, state);
      const current = snapshot();
      dispatch("threshold:emotion-update", { source: source, state: current });
      return current;
    }

    function shift(delta, source, detail) {
      const values = delta && typeof delta === "object" ? delta : {};
      EMOTIONS.forEach(function (emotion) {
        if (Object.prototype.hasOwnProperty.call(values, emotion)) {
          state.emotion[emotion] = clamp(state.emotion[emotion] + Number(values[emotion] || 0));
        }
      });
      return commit(source, detail || values);
    }

    function transitionChamber(chamber, delta) {
      const next = chamber && typeof chamber === "object" ? chamber : {};
      state.chamber = {
        id: next.id || null,
        force: next.force || null,
        status: next.status || "stable",
        effects: Array.isArray(next.effects) ? next.effects.slice() : []
      };
      return shift(delta, "chamber-transition", next);
    }

    function interactSpecies(interaction) {
      const detail = interaction && typeof interaction === "object" ? interaction : {};
      return shift(detail.emotion || detail.delta, "species-interaction", detail);
    }

    function receiveSpiritSignal(signal) {
      const detail = signal && typeof signal === "object" ? signal : {};
      const emotion = String(detail.emotion || "");
      const amount = Math.abs(Number(detail.amount || 1));
      const delta = {};
      if (EMOTIONS.includes(emotion)) {
        delta[emotion] = detail.mode === "dampen" ? -amount : amount;
      }
      return shift(delta, "spirit-animal-signal", detail);
    }

    function applyNarrativeBeat(beat) {
      const detail = beat && typeof beat === "object" ? beat : {};
      return shift(detail.emotion || detail.delta, "narrative-beat", detail);
    }

    function choose(choice) {
      const detail = choice && typeof choice === "object" ? choice : {};
      return shift(detail.emotion || detail.delta, "player-choice", detail);
    }

    function activateGlyph(glyphId) {
      const id = String(glyphId || "").toLowerCase();
      const effect = GLYPH_EFFECTS[id];
      if (!effect || !state.visibleGlyphs.includes(id)) return null;
      state.chamber.status = effect.status;
      state.chamber.effects = effect.effects.slice();
      if (!state.activatedGlyphs.includes(id)) state.activatedGlyphs.push(id);
      const current = commit("glyph-activation", { glyph: id, effect: effect });
      dispatch("threshold:glyph-activated", { glyph: id, chamber: current.chamber, state: current });
      return current.chamber;
    }

    function reset() {
      state = freshState();
      return commit("reset", null);
    }

    function snapshot() {
      return JSON.parse(JSON.stringify(state));
    }

    return Object.freeze({
      activateGlyph: activateGlyph,
      applyNarrativeBeat: applyNarrativeBeat,
      checkGlyphAppearance: function (chamber, emotion) {
        return checkGlyphAppearance(chamber || state.chamber, emotion || state.emotion);
      },
      choose: choose,
      getState: snapshot,
      interactSpecies: interactSpecies,
      receiveSpiritSignal: receiveSpiritSignal,
      reset: reset,
      shift: shift,
      transitionChamber: transitionChamber
    });
  }

  function deriveEthos(emotion) {
    const pressure = EMOTIONS.reduce(function (total, key) { return total + emotion[key]; }, 0);
    const dominant = EMOTIONS.reduce(function (current, key) {
      return emotion[key] > emotion[current] ? key : current;
    }, "fear");
    if (pressure === 0) {
      return { pressure: 0, boundary: "balanced", identity: "steady", adjacency: "stable" };
    }
    const boundary = emotion.fear + emotion.confusion > emotion.relief + emotion.reflection
      ? "contracted"
      : "open";
    const adjacency = {
      fear: "inward",
      relief: "outward",
      confusion: "obscured",
      reflection: "rooted"
    }[dominant];
    return { pressure: pressure, boundary: boundary, identity: dominant, adjacency: adjacency };
  }

  function clamp(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }

  function loadState(storage) {
    try {
      const parsed = JSON.parse(storage && storage.getItem(STORAGE_KEY));
      const state = freshState();
      if (!parsed || typeof parsed !== "object") return state;
      EMOTIONS.forEach(function (emotion) {
        state.emotion[emotion] = clamp(Number(parsed.emotion && parsed.emotion[emotion] || 0));
      });
      if (parsed.chamber && typeof parsed.chamber === "object") {
        state.chamber.id = parsed.chamber.id || null;
        state.chamber.force = parsed.chamber.force || null;
        state.chamber.status = parsed.chamber.status || "stable";
        state.chamber.effects = Array.isArray(parsed.chamber.effects) ? parsed.chamber.effects.slice() : [];
      }
      state.visibleGlyphs = Array.isArray(parsed.visibleGlyphs) ? parsed.visibleGlyphs.slice() : [];
      state.activatedGlyphs = Array.isArray(parsed.activatedGlyphs) ? parsed.activatedGlyphs.slice() : [];
      state.ethos = deriveEthos(state.emotion);
      return state;
    } catch (error) {
      return freshState();
    }
  }

  function persist(storage, state) {
    try {
      if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // Runtime state remains available when session storage is restricted.
    }
  }

  function bindRuntimeEvents(engine) {
    const bindings = {
      "threshold:chamber-transition": function (detail) { engine.transitionChamber(detail.chamber || detail, detail.emotion); },
      "threshold:species-interaction": function (detail) { engine.interactSpecies(detail); },
      "threshold:spirit-signal": function (detail) { engine.receiveSpiritSignal(detail); },
      "threshold:narrative-beat": function (detail) { engine.applyNarrativeBeat(detail); },
      "threshold:player-choice": function (detail) { engine.choose(detail); }
    };
    Object.keys(bindings).forEach(function (eventName) {
      root.addEventListener(eventName, function (event) { bindings[eventName](event.detail || {}); });
    });
  }

  root.ThresholdEmotionEngine = Object.freeze({
    createEmotionalEngine: createEmotionalEngine,
    checkGlyphAppearance: checkGlyphAppearance
  });

  if (root.document) {
    const engine = createEmotionalEngine({
      storage: root.sessionStorage,
      dispatch: function (eventName, detail) {
        root.dispatchEvent(new CustomEvent(eventName, { detail: detail }));
      }
    });
    root.ThresholdEmotions = engine;
    bindRuntimeEvents(engine);
    root.addEventListener("threshold:emotion-update", function (event) {
      const ethos = event.detail.state.ethos;
      if (root.document.body) {
        root.document.body.dataset.emotionalBoundary = ethos.boundary;
        root.document.body.dataset.emotionalIdentity = ethos.identity;
        root.document.body.dataset.emotionalAdjacency = ethos.adjacency;
      }
    });
    const spoke = root.document.body && root.document.body.dataset.thresholdSpoke;
    if (spoke) engine.transitionChamber({ id: spoke });
  }
})(typeof globalThis !== "undefined" ? globalThis : this);