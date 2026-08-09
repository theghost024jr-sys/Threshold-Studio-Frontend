(function (global) {
  const manifest = {
    version: "1.0.0",
    substrate: "Threshold Vault",
    palette: {
      ink: "#2c241d",
      soil: "#6e5c4f",
      clay: "#8c7b6a",
      ash: "#c2b8a3",
      mist: "#f7f2e9",
      paper: "#fffaf4"
    },
    glyphs: {
      primary: ["sigil", "ring", "branch", "thread", "seed"],
      states: ["awake", "drifting", "anchored", "resonant"]
    },
    cycles: ["realization", "faith", "compost", "release", "ponder", "echo"],
    soil: ["humus", "loam", "root", "moss", "silt"],
    myth: ["house", "garden", "vault", "threshold", "crown"],
    ledger: ["trace", "record", "entry", "proof", "vow"],
    echoes: ["the garden remembers", "the threshold stays open", "the shimmer returns"],
    motifs: ["grain", "ring", "drift", "branch", "pulse"],
    textures: ["paper", "linen", "stone", "soil", "glass"],
    typography: {
      serif: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
      sans: "'Manrope', 'Inter', system-ui, sans-serif",
      mono: "'Source Code Pro', 'SFMono-Regular', Consolas, monospace"
    },
    motion: {
      breathe: "vault-motion-breathe",
      drift: "vault-motion-drift",
      pulse: "vault-motion-pulse",
      reveal: "vault-motion-reveal",
      shimmer: "vault-motion-shimmer"
    },
    chambers: {
      soil: {
        key: "soil",
        label: "Soil",
        palette: {
          bg: "#2F2922",
          surface: "#3A332B",
          accent: "#6B7D4A",
          structural: "#556B2F",
          body: "#FFFFFF"
        },
        textLaw: "white-breath-moss-root",
        motionLaw: {
          breathe: "14s",
          drift: "24s",
          pulse: "4.2s"
        }
      },
      stone: {
        key: "stone",
        label: "Stone",
        palette: {
          bg: "#2D2E31",
          surface: "#3E4044",
          accent: "#9CA3A8",
          structural: "#C6CCD1",
          body: "#F5F7FA"
        },
        textLaw: "high-contrast-mineral",
        motionLaw: {
          breathe: "16s",
          drift: "30s",
          pulse: "5.2s"
        }
      },
      root: {
        key: "root",
        label: "Root",
        palette: {
          bg: "#1F251E",
          surface: "#2C3528",
          accent: "#6C8A4B",
          structural: "#7E9D58",
          body: "#F7F8F4"
        },
        textLaw: "living-depth-breath",
        motionLaw: {
          breathe: "13s",
          drift: "20s",
          pulse: "4.8s"
        }
      },
      breath: {
        key: "breath",
        label: "Breath",
        palette: {
          bg: "#1E2733",
          surface: "#2B394A",
          accent: "#C9C4D9",
          structural: "#D9D5E7",
          body: "#FFFFFF"
        },
        textLaw: "clarity-return-layer",
        motionLaw: {
          breathe: "11s",
          drift: "22s",
          pulse: "4s"
        }
      },
      ache: {
        key: "ache",
        label: "Ache",
        palette: {
          bg: "#2E2127",
          surface: "#432D36",
          accent: "#C18493",
          structural: "#D6A5B1",
          body: "#FDF7F9"
        },
        textLaw: "tender-contrast",
        motionLaw: {
          breathe: "17s",
          drift: "28s",
          pulse: "5.6s"
        }
      },
      shimmer: {
        key: "shimmer",
        label: "Shimmer",
        palette: {
          bg: "#201E2E",
          surface: "#2D2A42",
          accent: "#E4C77F",
          structural: "#F0DDA8",
          body: "#FFFDF7"
        },
        textLaw: "luminous-contrast",
        motionLaw: {
          breathe: "12s",
          drift: "18s",
          pulse: "3.6s"
        }
      }
    },
    turbulence: {
      key: "threshold.vault.turbulence.v1",
      bands: ["still", "shear", "storm", "rift"],
      roles: {
        still: "latent pressure",
        shear: "alignment strain",
        storm: "forming motion",
        rift: "pre-trunk instability"
      }
    },
    serenity: {
      key: "threshold.vault.serenity.v1",
      bands: ["breath", "settled", "aligned", "return"],
      roles: {
        breath: "post-form ease",
        settled: "dynamic equilibrium",
        aligned: "harmonic rest",
        return: "memory-complete clarity"
      },
      glyph: "◔"
    },
    trunk: {
      key: "threshold.vault.trunk.v1",
      orientationOrder: ["fire", "water", "air", "earth", "light"],
      orientations: {
        fire: { label: "Fire", glyph: "✶", tone: "#A3473C", role: "ignition" },
        water: { label: "Water", glyph: "◌", tone: "#5A6FA8", role: "flow" },
        air: { label: "Air", glyph: "✧", tone: "#E4C77F", role: "lift" },
        earth: { label: "Earth", glyph: "◍", tone: "#4A3F2E", role: "grounding" },
        light: { label: "Light", glyph: "✦", tone: "#F3E1A4", role: "reveal" }
      }
    },
    rooms: {
      home: {
        chamber: "breath",
        palette: ["mist", "clay", "soil"],
        motif: ["ring", "drift"],
        motion: ["breathe", "reveal"]
      },
      ethos: {
        chamber: "stone",
        palette: ["paper", "soil", "ash"],
        motif: ["grain"],
        motion: ["reveal"]
      },
      glyphs: {
        chamber: "shimmer",
        palette: ["ink", "clay", "ash"],
        motif: ["branch", "ring"],
        motion: ["pulse", "shimmer"]
      },
      wheel: {
        chamber: "breath",
        palette: ["mist", "clay", "ash"],
        motif: ["ring", "drift"],
        motion: ["drift", "pulse"]
      },
      ledger: {
        chamber: "stone",
        palette: ["paper", "ink", "clay"],
        motif: ["grid", "record"],
        motion: ["reveal"]
      },
      dialogues: {
        chamber: "soil",
        palette: ["paper", "soil", "mist"],
        motif: ["echo", "drift"],
        motion: ["breathe", "reveal"]
      },
      mythology: {
        chamber: "shimmer",
        palette: ["#0C0C12", "#E4C77F", "#A3473C", "#5A6FA8", "#4A3F2E"],
        motif: ["grain", "ring", "dust", "glyph", "soil"],
        motion: ["reveal", "breathe", "shimmer"]
      },
      housegarden: {
        chamber: "root",
        palette: ["soil", "clay", "ash"],
        motif: ["branch", "seed"],
        motion: ["drift", "breathe"]
      },
      invitation: {
        chamber: "breath",
        palette: ["mist", "ash", "clay"],
        motif: ["threshold", "echo"],
        motion: ["breathe", "reveal"]
      },
      contact: {
        chamber: "ache",
        palette: ["paper", "clay", "soil"],
        motif: ["trace"],
        motion: ["reveal"]
      },
      thankyou: {
        chamber: "breath",
        palette: ["paper", "mist", "ash"],
        motif: ["echo", "ring"],
        motion: ["breathe"]
      }
    }
  };

  function pick(section, key) {
    const value = manifest[section];
    if (!value) {
      return null;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      return key ? value[key] ?? null : value;
    }

    return value;
  }

  function room(name) {
    return manifest.rooms[name] ?? null;
  }

  function defaultTurbulenceState() {
    return {
      version: manifest.version,
      pressure: 0,
      band: "still",
      force: 0,
      notes: [],
      updatedAt: null
    };
  }

  function defaultSerenityState() {
    return {
      version: manifest.version,
      coherence: 0,
      band: "breath",
      ease: 0,
      notes: [],
      updatedAt: null
    };
  }

  function computeTurbulenceFromTrunk(trunkState) {
    const currentTrunk = trunkState || readTrunkState();
    const totalVectors = manifest.trunk.orientationOrder.length;
    const activeVectors = manifest.trunk.orientationOrder.filter((name) => currentTrunk.vectors[name] && currentTrunk.vectors[name].weight > 0);
    const activeCount = activeVectors.length;
    const missing = Math.max(0, totalVectors - activeCount);
    const averageWeight = activeCount
      ? activeVectors.reduce((sum, name) => sum + (currentTrunk.vectors[name].weight || 0), 0) / activeCount
      : 0;
    const spread = activeCount
      ? Math.max(...activeVectors.map((name) => currentTrunk.vectors[name].weight || 0)) - Math.min(...activeVectors.map((name) => currentTrunk.vectors[name].weight || 0))
      : 0;
    const pressure = Math.max(0, Math.min(1, ((missing / totalVectors) * 0.7) + Math.min(0.3, spread / 6) + (averageWeight ? Math.max(0, 0.15 - Math.min(0.15, averageWeight / 20)) : 0.15)));
    let band = "still";

    if (pressure > 0.75) {
      band = "rift";
    } else if (pressure > 0.5) {
      band = "storm";
    } else if (pressure > 0.25) {
      band = "shear";
    }

    return {
      version: manifest.version,
      pressure: Math.round(pressure * 1000) / 1000,
      band,
      force: Math.round((pressure * 10) * 10) / 10,
      notes: [
        `${missing} orientations missing`,
        `${activeCount} vectors active`
      ],
      updatedAt: new Date().toISOString()
    };
  }

  function readTurbulenceState(trunkState) {
    const derived = computeTurbulenceFromTrunk(trunkState);
    if (!global.localStorage) {
      return derived;
    }

    try {
      const raw = global.localStorage.getItem(manifest.turbulence.key);
      if (!raw) {
        return derived;
      }

      const parsed = JSON.parse(raw);
      return {
        ...derived,
        ...parsed,
        pressure: Number.isFinite(Number(parsed.pressure)) ? Math.max(0, Math.min(1, Number(parsed.pressure))) : derived.pressure,
        band: manifest.turbulence.bands.includes(parsed.band) ? parsed.band : derived.band
      };
    } catch (_error) {
      return derived;
    }
  }

  function computeSerenityFromLayers(trunkState, turbulenceState) {
    const currentTrunk = trunkState || readTrunkState();
    const currentTurbulence = turbulenceState || readTurbulenceState(currentTrunk);
    const totalVectors = manifest.trunk.orientationOrder.length;
    const activeCount = manifest.trunk.orientationOrder.filter((name) => currentTrunk.vectors[name] && currentTrunk.vectors[name].weight > 0).length;
    const completion = totalVectors ? activeCount / totalVectors : 0;
    const stability = Math.max(0, 1 - Math.min(1, currentTurbulence.pressure * 0.95));
    const spread = manifest.trunk.orientationOrder
      .map((name) => currentTrunk.vectors[name] && currentTrunk.vectors[name].weight ? currentTrunk.vectors[name].weight : 0)
      .filter((value) => value > 0);
    const imbalance = spread.length > 1 ? (Math.max(...spread) - Math.min(...spread)) / Math.max(1, Math.max(...spread)) : 0;
    const coherence = Math.max(0, Math.min(1, (completion * 0.58) + (stability * 0.32) + ((1 - imbalance) * 0.1)));
    let band = "breath";

    if (coherence > 0.82) {
      band = "return";
    } else if (coherence > 0.62) {
      band = "aligned";
    } else if (coherence > 0.38) {
      band = "settled";
    }

    return {
      version: manifest.version,
      coherence: Math.round(coherence * 1000) / 1000,
      band,
      ease: Math.round((coherence * 10) * 10) / 10,
      notes: [
        `${activeCount}/${totalVectors} orientations in place`,
        `${currentTurbulence.band} pressure resolved`
      ],
      updatedAt: new Date().toISOString()
    };
  }

  function readSerenityState(trunkState, turbulenceState) {
    const derived = computeSerenityFromLayers(trunkState, turbulenceState);
    if (!global.localStorage) {
      return derived;
    }

    try {
      const raw = global.localStorage.getItem(manifest.serenity.key);
      if (!raw) {
        return derived;
      }

      const parsed = JSON.parse(raw);
      return {
        ...derived,
        ...parsed,
        coherence: Number.isFinite(Number(parsed.coherence)) ? Math.max(0, Math.min(1, Number(parsed.coherence))) : derived.coherence,
        band: manifest.serenity.bands.includes(parsed.band) ? parsed.band : derived.band
      };
    } catch (_error) {
      return derived;
    }
  }

  function writeSerenityState(state) {
    if (!global.localStorage) {
      return state;
    }

    try {
      global.localStorage.setItem(manifest.serenity.key, JSON.stringify(state));
    } catch (_error) {
      // Ignore storage failures; serenity can still be derived.
    }

    return state;
  }

  function getSerenityState(trunkState, turbulenceState) {
    return readSerenityState(trunkState, turbulenceState);
  }

  function summarizeSerenity(state) {
    const current = state || readSerenityState();
    return `${current.band} coherence ${current.coherence.toFixed(3)}`;
  }

  function setSerenityState(nextState) {
    const derived = computeSerenityFromLayers(nextState && nextState.trunk ? nextState.trunk : undefined, nextState && nextState.turbulence ? nextState.turbulence : undefined);
    const state = {
      ...derived,
      ...(nextState || {})
    };
    return writeSerenityState(state);
  }

  function writeTurbulenceState(state) {
    if (!global.localStorage) {
      return state;
    }

    try {
      global.localStorage.setItem(manifest.turbulence.key, JSON.stringify(state));
    } catch (_error) {
      // Ignore storage failures; turbulence can still be derived.
    }

    return state;
  }

  function getTurbulenceState(trunkState) {
    return readTurbulenceState(trunkState);
  }

  function summarizeTurbulence(state) {
    const current = state || readTurbulenceState();
    return `${current.band} pressure ${current.pressure.toFixed(3)}`;
  }

  function setTurbulenceState(nextState) {
    const derived = computeTurbulenceFromTrunk(nextState && nextState.trunk ? nextState.trunk : undefined);
    const state = {
      ...derived,
      ...(nextState || {})
    };
    return writeTurbulenceState(state);
  }

  function defaultTrunkState() {
    const vectors = {};
    manifest.trunk.orientationOrder.forEach((name) => {
      vectors[name] = {
        name,
        label: manifest.trunk.orientations[name].label,
        glyph: manifest.trunk.orientations[name].glyph,
        tone: manifest.trunk.orientations[name].tone,
        role: manifest.trunk.orientations[name].role,
        weight: 0,
        contributions: []
      };
    });

    return {
      version: manifest.version,
      contributions: [],
      vectors,
      updatedAt: null
    };
  }

  function readTrunkState() {
    if (!global.localStorage) {
      return defaultTrunkState();
    }

    try {
      const raw = global.localStorage.getItem(manifest.trunk.key);
      if (!raw) {
        return defaultTrunkState();
      }

      const parsed = JSON.parse(raw);
      const base = defaultTrunkState();
      const state = {
        ...base,
        ...parsed,
        vectors: { ...base.vectors }
      };

      manifest.trunk.orientationOrder.forEach((name) => {
        state.vectors[name] = {
          ...base.vectors[name],
          ...(parsed.vectors && parsed.vectors[name] ? parsed.vectors[name] : {})
        };
      });

      return state;
    } catch (_error) {
      return defaultTrunkState();
    }
  }

  function writeTrunkState(state) {
    if (!global.localStorage) {
      return state;
    }

    try {
      global.localStorage.setItem(manifest.trunk.key, JSON.stringify(state));
    } catch (_error) {
      // Ignore storage failures; the trunk can still assemble in memory.
    }

    return state;
  }

  function normalizeTrunkContribution(input) {
    if (!input) {
      return null;
    }

    const vector = String(input.vector || input.orientation || "").toLowerCase();
    if (!vector || !manifest.trunk.orientations[vector]) {
      return null;
    }

    const weight = Number.isFinite(Number(input.weight)) ? Math.max(0.1, Number(input.weight)) : 1;
    return {
      id: String(input.id || `${String(input.source || "unknown").toLowerCase()}:${vector}:${String(input.label || manifest.trunk.orientations[vector].label).toLowerCase()}`),
      vector,
      weight,
      source: String(input.source || "unknown"),
      label: String(input.label || manifest.trunk.orientations[vector].label),
      detail: String(input.detail || "")
    };
  }

  function getTrunkState() {
    return readTrunkState();
  }

  function summarizeTrunk(state) {
    const currentState = state || readTrunkState();
    const activeVectors = manifest.trunk.orientationOrder.filter((name) => currentState.vectors[name] && currentState.vectors[name].weight > 0);
    if (!activeVectors.length) {
      return "Trunk awaiting contribution";
    }

    return activeVectors.map((name) => {
      const vector = currentState.vectors[name];
      const count = Math.round(vector.weight * 10) / 10;
      return `${vector.label} ${count}`;
    }).join(" · ");
  }

  function contributeToTrunk(input) {
    const contribution = normalizeTrunkContribution(input);
    if (!contribution) {
      return readTrunkState();
    }

    const state = readTrunkState();
    if (state.contributions.some((entry) => entry.id === contribution.id)) {
      return state;
    }

    const vector = state.vectors[contribution.vector];
    vector.weight = Math.round((vector.weight + contribution.weight) * 10) / 10;
    vector.contributions = vector.contributions.concat({
      id: contribution.id,
      source: contribution.source,
      label: contribution.label,
      detail: contribution.detail,
      weight: contribution.weight,
      at: new Date().toISOString()
    });
    state.contributions = state.contributions.concat({
      id: contribution.id,
      ...contribution,
      at: new Date().toISOString()
    });
    state.updatedAt = new Date().toISOString();
    writeTrunkState(state);
    writeTurbulenceState(computeTurbulenceFromTrunk(state));
    writeSerenityState(computeSerenityFromLayers(state, computeTurbulenceFromTrunk(state)));
    return state;
  }

  function clearTrunkState() {
    const state = defaultTrunkState();
    writeTrunkState(state);
    writeTurbulenceState(computeTurbulenceFromTrunk(state));
    writeSerenityState(computeSerenityFromLayers(state, computeTurbulenceFromTrunk(state)));
    return state;
  }

  function resolveRoomName(targetBody) {
    const body = targetBody || global.document && global.document.body;
    if (!body) {
      return null;
    }

    const direct = body.dataset && body.dataset.vaultRoom;
    if (direct && manifest.rooms[direct]) {
      return direct;
    }

    const classList = body.classList ? Array.from(body.classList) : [];
    const inferred = classList.find((value) => value.endsWith("-page"));
    if (!inferred) {
      return null;
    }

    const normalized = inferred.replace(/-page$/, "");
    if (manifest.rooms[normalized]) {
      return normalized;
    }

    if (normalized === "home") {
      return "home";
    }

    return null;
  }

  function resolvePaletteTokens(roomName) {
    const currentRoom = room(roomName);
    if (!currentRoom) {
      return [];
    }

    return currentRoom.palette.map((token) => manifest.palette[token] ?? token);
  }

  function resolveChamberName(roomName) {
    const currentRoom = room(roomName);
    if (!currentRoom) {
      return null;
    }

    const chamberName = currentRoom.chamber;
    if (chamberName && manifest.chambers[chamberName]) {
      return chamberName;
    }

    return "breath";
  }

  function resolveChamberIdentity(roomName) {
    const chamberName = resolveChamberName(roomName);
    if (!chamberName) {
      return null;
    }

    return manifest.chambers[chamberName] || null;
  }

  function colorToRgb(value) {
    if (!value || typeof value !== "string") {
      return null;
    }

    const rgbMatch = value.match(/rgba?\(([^)]+)\)/i);
    if (rgbMatch) {
      const channels = rgbMatch[1].split(",").map((item) => Number(item.trim()));
      if (channels.length >= 3 && channels.every((channel, index) => index < 3 ? Number.isFinite(channel) : true)) {
        return {
          r: Math.max(0, Math.min(255, channels[0])),
          g: Math.max(0, Math.min(255, channels[1])),
          b: Math.max(0, Math.min(255, channels[2]))
        };
      }
    }

    const hex = value.trim().toLowerCase();
    const shortHex = hex.match(/^#([0-9a-f]{3})$/i);
    if (shortHex) {
      const normalized = shortHex[1].split("").map((ch) => ch + ch).join("");
      return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16)
      };
    }

    const fullHex = hex.match(/^#([0-9a-f]{6})$/i);
    if (fullHex) {
      return {
        r: parseInt(fullHex[1].slice(0, 2), 16),
        g: parseInt(fullHex[1].slice(2, 4), 16),
        b: parseInt(fullHex[1].slice(4, 6), 16)
      };
    }

    return null;
  }

  function colorDistance(a, b) {
    if (!a || !b) {
      return Infinity;
    }

    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return Math.sqrt((dr * dr) + (dg * dg) + (db * db));
  }

  function hasDirectText(element) {
    if (!element || !element.childNodes) {
      return false;
    }

    return Array.from(element.childNodes).some((node) => node.nodeType === 3 && node.textContent && node.textContent.trim().length > 0);
  }

  function isStructuralElement(element) {
    if (!element || !element.matches) {
      return false;
    }

    return element.matches("h1, h2, h3, h4, h5, h6, summary, nav a, .vault-law-structural, .structural-line, .soil-band, .return-band");
  }

  function describeElement(element) {
    const tag = (element.tagName || "node").toLowerCase();
    const id = element.id ? `#${element.id}` : "";
    const classes = element.classList ? Array.from(element.classList).slice(0, 2).map((name) => `.${name}`).join("") : "";
    return `${tag}${id}${classes}`;
  }

  function getAuditExpectedColors(chamberIdentity) {
    const fallback = {
      body: "#ffffff",
      structural: "#9ca3a8",
      accent: "#6b7d4a"
    };
    const palette = chamberIdentity && chamberIdentity.palette ? chamberIdentity.palette : fallback;
    return {
      body: colorToRgb(palette.body || fallback.body),
      structural: colorToRgb(palette.structural || fallback.structural),
      accent: colorToRgb(palette.accent || fallback.accent)
    };
  }

  function shouldEnableColorAudit() {
    try {
      if (global.localStorage && global.localStorage.getItem("threshold.vault.audit") === "1") {
        return true;
      }
    } catch (_error) {
      // Ignore storage access issues.
    }

    if (!global.location || !global.location.search) {
      return false;
    }

    const params = new URLSearchParams(global.location.search);
    return params.get("vaultAudit") === "1";
  }

  function stopColorAuditOverlay(targetDocument) {
    const doc = targetDocument || global.document;
    if (!doc) {
      return;
    }

    const state = global.__thresholdVaultAudit;
    if (state && state.timerId) {
      global.clearInterval(state.timerId);
    }

    if (state && state.panel && state.panel.parentNode) {
      state.panel.parentNode.removeChild(state.panel);
    }

    Array.from(doc.querySelectorAll(".vault-audit-mismatch")).forEach((element) => {
      element.classList.remove("vault-audit-mismatch");
    });

    global.__thresholdVaultAudit = null;
  }

  function startColorAuditOverlay(options) {
    const config = options || {};
    const doc = config.document || global.document;
    if (!doc || !doc.body) {
      return null;
    }

    stopColorAuditOverlay(doc);

    const panel = doc.createElement("aside");
    panel.className = "vault-audit-overlay";
    panel.setAttribute("aria-live", "polite");
    panel.innerHTML = "<strong>Vault Color Audit</strong><div>Initializing...</div>";
    doc.body.appendChild(panel);

    const state = {
      panel,
      timerId: null
    };

    function scan() {
      const roomName = resolveRoomName(doc.body) || (doc.body.dataset && doc.body.dataset.vaultRoom) || "home";
      const chamberIdentity = resolveChamberIdentity(roomName);
      const expected = getAuditExpectedColors(chamberIdentity);
      const textLaw = doc.body.dataset && doc.body.dataset.vaultTextLaw ? doc.body.dataset.vaultTextLaw : "";

      Array.from(doc.querySelectorAll(".vault-audit-mismatch")).forEach((element) => {
        element.classList.remove("vault-audit-mismatch");
      });

      const candidates = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6, p, a, summary, li, span, div"));
      const mismatches = [];

      candidates.forEach((element) => {
        if (panel.contains(element)) {
          return;
        }

        if (!hasDirectText(element)) {
          return;
        }

        const style = global.getComputedStyle ? global.getComputedStyle(element) : null;
        if (!style) {
          return;
        }

        if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity || "1") === 0) {
          return;
        }

        const actual = colorToRgb(style.color);
        if (!actual) {
          return;
        }

        const structural = isStructuralElement(element);
        let allowed = [];
        if (textLaw === "white-breath-moss-root") {
          allowed = structural ? [expected.structural] : [expected.body];
        } else {
          allowed = structural
            ? [expected.structural, expected.accent]
            : [expected.body, expected.accent];
        }

        const nearest = Math.min.apply(null, allowed.map((color) => colorDistance(actual, color)));
        if (!Number.isFinite(nearest) || nearest > 28) {
          mismatches.push({
            element,
            nearest,
            sample: (element.textContent || "").trim().slice(0, 56),
            label: describeElement(element)
          });
        }
      });

      mismatches.forEach((item) => {
        item.element.classList.add("vault-audit-mismatch");
      });

      const preview = mismatches.slice(0, 10).map((item) => `<li>${item.label}: ${item.sample || "(text)"}</li>`).join("");
      panel.innerHTML = [
        `<strong>Vault Color Audit</strong>`,
        `<div>Room: ${roomName} · Chamber: ${(chamberIdentity && chamberIdentity.label) || "Unknown"}</div>`,
        `<div>Text law: ${textLaw || "default"}</div>`,
        `<div>Mismatches: ${mismatches.length}</div>`,
        preview ? `<ul>${preview}</ul>` : ""
      ].join("");
    }

    scan();
    state.timerId = global.setInterval(scan, 1800);
    global.__thresholdVaultAudit = state;
    return state;
  }

  function applyRoomIdentity(targetBody) {
    const body = targetBody || global.document && global.document.body;
    if (!body) {
      return null;
    }

    const roomName = resolveRoomName(body);
    if (!roomName) {
      return null;
    }

    const currentRoom = room(roomName);
    const chamberIdentity = resolveChamberIdentity(roomName);
    const paletteTokens = resolvePaletteTokens(roomName);
    const trunkState = readTrunkState();
    const turbulenceState = readTurbulenceState(trunkState);
    const serenityState = readSerenityState(trunkState, turbulenceState);

    body.dataset.vaultRoom = roomName;
    body.dataset.vaultTrunk = summarizeTrunk(trunkState);
    body.dataset.vaultTurbulence = summarizeTurbulence(turbulenceState);
    body.dataset.vaultSerenity = summarizeSerenity(serenityState);
    body.dataset.vaultGlyphs = manifest.glyphs.primary.join(" ");
    body.dataset.vaultCycles = manifest.cycles.join(" ");
    body.dataset.vaultSoil = manifest.soil.join(" ");
    body.dataset.vaultMotifs = manifest.motifs.join(" ");
    body.dataset.vaultTextures = manifest.textures.join(" ");
    body.dataset.vaultMotion = currentRoom.motion.join(" ");
    body.dataset.vaultTypography = Object.keys(manifest.typography).join(" ");
    body.dataset.vaultChamber = chamberIdentity ? chamberIdentity.key : "breath";
    body.dataset.vaultTextLaw = chamberIdentity ? chamberIdentity.textLaw : "clarity-return-layer";
    body.classList.add("vault-substrate");

    paletteTokens.forEach((value, index) => {
      body.style.setProperty(`--vault-room-color-${index + 1}`, value);
    });

    if (paletteTokens[0]) {
      body.style.setProperty("--vault-room-color", paletteTokens[0]);
    }

    body.style.setProperty("--vault-room-serif", manifest.typography.serif);
    body.style.setProperty("--vault-room-sans", manifest.typography.sans);
    body.style.setProperty("--vault-room-mono", manifest.typography.mono);
    body.style.setProperty("--vault-trunk-summary", summarizeTrunk(trunkState));
    body.style.setProperty("--vault-turbulence-pressure", String(turbulenceState.pressure));
    body.style.setProperty("--vault-turbulence-band", turbulenceState.band);
    body.style.setProperty("--vault-serenity-coherence", String(serenityState.coherence));
    body.style.setProperty("--vault-serenity-band", serenityState.band);
    if (chamberIdentity) {
      body.style.setProperty("--vault-chamber-bg", chamberIdentity.palette.bg);
      body.style.setProperty("--vault-chamber-surface", chamberIdentity.palette.surface);
      body.style.setProperty("--vault-chamber-accent", chamberIdentity.palette.accent);
      body.style.setProperty("--vault-chamber-structural", chamberIdentity.palette.structural);
      body.style.setProperty("--vault-chamber-body", chamberIdentity.palette.body);
      body.style.setProperty("--vault-chamber-breathe", chamberIdentity.motionLaw.breathe);
      body.style.setProperty("--vault-chamber-drift", chamberIdentity.motionLaw.drift);
      body.style.setProperty("--vault-chamber-pulse", chamberIdentity.motionLaw.pulse);
    }

    return {
      name: roomName,
      room: currentRoom,
      chamber: chamberIdentity,
      trunk: trunkState,
      turbulence: turbulenceState,
      serenity: serenityState,
      palette: paletteTokens,
      glyphs: manifest.glyphs.primary.slice(),
      cycles: manifest.cycles.slice(),
      soil: manifest.soil.slice(),
      motifs: manifest.motifs.slice(),
      textures: manifest.textures.slice(),
      typography: { ...manifest.typography },
      motion: currentRoom.motion.slice(),
      echoes: manifest.echoes.slice()
    };
  }

  function getRoomIdentity(roomName) {
    const currentRoom = room(roomName);
    if (!currentRoom) {
      return null;
    }

    return {
      name: roomName,
      room: currentRoom,
      chamber: resolveChamberIdentity(roomName),
      trunk: readTrunkState(),
      turbulence: readTurbulenceState(),
      serenity: readSerenityState(),
      palette: resolvePaletteTokens(roomName),
      glyphs: manifest.glyphs.primary.slice(),
      cycles: manifest.cycles.slice(),
      soil: manifest.soil.slice(),
      motifs: manifest.motifs.slice(),
      textures: manifest.textures.slice(),
      typography: { ...manifest.typography },
      motion: currentRoom.motion.slice(),
      echoes: manifest.echoes.slice()
    };
  }

  function hydrate(targetDocument) {
    const doc = targetDocument || global.document;
    if (!doc || !doc.body) {
      return null;
    }

    return applyRoomIdentity(doc.body);
  }

  let searchIndexPromise = null;
  let searchIndexCache = null;
  let pngIndexPromise = null;
  let pngIndexCache = null;

  function normalizeSearchToken(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9:_-]+/g, "");
  }

  function normalizeFileToken(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "");
  }

  function nodeText(node) {
    if (!node || typeof node !== "object") {
      return "";
    }
    const parts = [
      node.id,
      node.title,
      node.path,
      node.excerpt,
      Array.isArray(node.tags) ? node.tags.join(" ") : "",
      Array.isArray(node.links) ? node.links.join(" ") : "",
      Array.isArray(node.backlinks) ? node.backlinks.join(" ") : "",
      Array.isArray(node.tokens) ? node.tokens.join(" ") : ""
    ];
    return parts.join(" ").toLowerCase();
  }

  function parseSearchQuery(query) {
    const source = String(query || "").trim();
    if (!source) {
      return { terms: [], fields: [] };
    }

    const terms = [];
    const fields = [];
    source.split(/\s+/).forEach((part) => {
      if (!part) {
        return;
      }
      const idx = part.indexOf(":");
      if (idx > 0) {
        const field = normalizeSearchToken(part.slice(0, idx));
        const value = normalizeSearchToken(part.slice(idx + 1));
        if (field && value) {
          fields.push({ field, value });
          return;
        }
      }
      const term = normalizeSearchToken(part);
      if (term) {
        terms.push(term);
      }
    });

    return { terms, fields };
  }

  function nodeMatchesField(node, field, value, text) {
    const tags = Array.isArray(node && node.tags) ? node.tags.map((item) => String(item).toLowerCase()) : [];
    const tokens = Array.isArray(node && node.tokens) ? node.tokens.map((item) => String(item).toLowerCase()) : [];
    const links = Array.isArray(node && node.links) ? node.links.map((item) => String(item).toLowerCase()) : [];
    const backlinks = Array.isArray(node && node.backlinks) ? node.backlinks.map((item) => String(item).toLowerCase()) : [];
    const path = String(node && node.path ? node.path : "").toLowerCase();
    const title = String(node && node.title ? node.title : "").toLowerCase();

    if (field === "tag" || field === "tags") {
      return tags.some((item) => item.includes(value) || item.replace(/^#/, "") === value);
    }
    if (field === "path") {
      return path.includes(value);
    }
    if (field === "title") {
      return title.includes(value);
    }
    if (field === "token" || field === "tokens") {
      return tokens.some((item) => item === value || item.includes(value));
    }
    if (field === "link" || field === "links") {
      return links.some((item) => item.includes(value));
    }
    if (field === "backlink" || field === "backlinks") {
      return backlinks.some((item) => item.includes(value));
    }
    if (field === "species" || field === "element" || field === "ethos") {
      return text.includes(value);
    }

    return text.includes(value);
  }

  function scoreNode(node, parsed) {
    const text = nodeText(node);
    const title = String(node && node.title ? node.title : "").toLowerCase();
    const path = String(node && node.path ? node.path : "").toLowerCase();

    for (const condition of parsed.fields) {
      if (!nodeMatchesField(node, condition.field, condition.value, text)) {
        return -1;
      }
    }

    for (const term of parsed.terms) {
      if (!text.includes(term)) {
        return -1;
      }
    }

    let score = 0;
    parsed.fields.forEach((condition) => {
      score += 6;
      if (title.includes(condition.value)) score += 2;
      if (path.includes(condition.value)) score += 1;
    });

    parsed.terms.forEach((term) => {
      score += 4;
      if (title.includes(term)) score += 3;
      if (path.includes(term)) score += 2;
    });

    return score;
  }

  async function loadSearchIndex() {
    if (searchIndexCache) {
      return searchIndexCache;
    }

    if (!searchIndexPromise) {
      searchIndexPromise = fetch("vault-search-index.json", { cache: "no-store" })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`vault search index unavailable (${response.status})`);
          }
          return response.json();
        })
        .then((payload) => {
          searchIndexCache = payload;
          return payload;
        })
        .catch((_error) => ({ nodes: [] }));
    }

    return searchIndexPromise;
  }

  async function loadPngIndex() {
    if (pngIndexCache) {
      return pngIndexCache;
    }

    if (!pngIndexPromise) {
      pngIndexPromise = fetch("data/all-png-images.json", { cache: "no-store" })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`png index unavailable (${response.status})`);
          }
          return response.json();
        })
        .then((payload) => {
          pngIndexCache = Array.isArray(payload) ? payload : [];
          return pngIndexCache;
        })
        .catch((_error) => []);
    }

    return pngIndexPromise;
  }

  function extractAssetMentions(node) {
    const matches = [];
    const text = [node && node.excerpt ? node.excerpt : "", node && node.title ? node.title : "", node && node.path ? node.path : ""].join("\n");
    const regex = /([a-z0-9 _\-]+\.png)/gi;
    let match = regex.exec(text);
    while (match) {
      const file = String(match[1] || "").trim();
      if (file) {
        matches.push(file);
      }
      match = regex.exec(text);
    }
    return Array.from(new Set(matches.map((item) => item.toLowerCase())));
  }

  async function resolveAssets(node, options = {}) {
    const pngList = await loadPngIndex();
    const mentions = extractAssetMentions(node);
    if (!mentions.length || !Array.isArray(pngList) || !pngList.length) {
      return [];
    }

    const maxItems = Math.max(1, Number(options.maxItems || 6));
    const results = [];
    const seen = new Set();

    mentions.forEach((mention) => {
      if (results.length >= maxItems) {
        return;
      }

      const match = pngList.find((item) => {
        const normalized = String(item || "").replace(/\\/g, "/").toLowerCase();
        const base = normalized.split("/").pop() || "";
        return normalizeFileToken(base) === normalizeFileToken(mention);
      });

      if (!match) {
        return;
      }

      const pathValue = String(match).replace(/\\/g, "/");
      if (seen.has(pathValue)) {
        return;
      }

      seen.add(pathValue);
      results.push(pathValue);
    });

    return results;
  }

  async function search(query, options = {}) {
    const payload = await loadSearchIndex();
    const nodes = payload && Array.isArray(payload.nodes) ? payload.nodes : [];
    const parsed = parseSearchQuery(query);
    const limit = Math.max(1, Number(options.limit || 120));

    const matches = nodes
      .map((node) => {
        const score = scoreNode(node, parsed);
        if (score < 0) {
          return null;
        }
        return {
          ...node,
          score
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return String(a.title || "").localeCompare(String(b.title || ""));
      })
      .slice(0, limit);

    if (options.withAssets) {
      const enriched = [];
      for (const node of matches) {
        const assets = await resolveAssets(node, { maxItems: options.assetLimit || 6 });
        enriched.push({ ...node, assets });
      }
      return enriched;
    }

    return matches;
  }

  const vault = {
    manifest,
    pick,
    room,
    hydrate,
    applyRoomIdentity,
    getRoomIdentity,
    contributeToTrunk,
    getTrunkState,
    clearTrunkState,
    summarizeTrunk,
    getTurbulenceState,
    summarizeTurbulence,
    setTurbulenceState,
    computeTurbulenceFromTrunk,
    getSerenityState,
    summarizeSerenity,
    setSerenityState,
    computeSerenityFromLayers,
    resolveRoomName,
    resolvePaletteTokens,
    resolveChamberName,
    resolveChamberIdentity,
    rooms: manifest.rooms,
    chambers: manifest.chambers,
    loadSearchIndex,
    loadPngIndex,
    resolveAssets,
    search,
    find: search,
    startColorAuditOverlay,
    stopColorAuditOverlay,
    turbulence: manifest.turbulence,
    serenity: manifest.serenity,
    trunk: manifest.trunk,
    palette: manifest.palette,
    typography: manifest.typography,
    motion: manifest.motion,
    list(section) {
      const value = manifest[section];
      return Array.isArray(value) ? value.slice() : [];
    }
  };

  global.vault = vault;
  global.ThresholdVault = vault;

  if (global.document && global.document.body) {
    hydrate(global.document);
    if (shouldEnableColorAudit()) {
      startColorAuditOverlay({ document: global.document });
    }
  } else if (global.document) {
    global.document.addEventListener("DOMContentLoaded", () => {
      hydrate(global.document);
      if (shouldEnableColorAudit()) {
        startColorAuditOverlay({ document: global.document });
      }
    }, { once: true });
  }
})(window);