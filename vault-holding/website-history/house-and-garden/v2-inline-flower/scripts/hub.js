(function () {
  const body = document.body;
  const hubA = document.getElementById("hubA") || document.getElementById("hub");
  const hubB = document.getElementById("hubB");
  const field = document.getElementById("particle-field") || document.getElementById("hubField");
  const lore = document.getElementById("hubLore");
  const loreText = document.getElementById("hubLoreText");
  const worldStateSeason = document.getElementById("worldStateSeason");
  const worldStateVisits = document.getElementById("worldStateVisits");
  const worldStatePedals = document.getElementById("worldStatePedals");
  const worldStateGalleries = document.getElementById("worldStateGalleries");
  const worldStateCounters = document.getElementById("worldStateCounters");

  if (!hubA || !field) {
    return;
  }

  const baseGlyphs = ["✶", "✷", "✦", "✧", "⟡", "◌", "✹", "✺", "◍", "⬡"];
  const unlockGlyphs = ["☽", "☼", "✵", "✸", "❋"];
  const rareGlyphs = ["✺", "❂", "✹", "✵", "⌘"];
  const nodeColors = {
    drift: "#7a8085",
    collapse: "#8b6f6a",
    anchor: "#a89c7a",
    pressure: "#9a7f6b",
    resonance: "#7f6d8a",
    orbit: "#6f8a82",
    capture: "#748a6f",
    threshold: "#d8d8d8"
  };
  const nodeColorKeys = Object.keys(nodeColors);
  const particleBehaviors = ["fall", "driftSide", "driftLeftFast", "wobbleFall", "spiralFall"];
  const forbiddenNodes = ["collapse", "drift"];
  const archiveHubUnlockStorageKey = "threshold.archive.hubUnlock.v1";
  const archiveRewriteStorageKey = "threshold.archive.rewrites.v1";

  const loreFragments = [
    "The lantern learns your name by how long you linger.",
    "A vow is not loud. It is repeated when no one watches.",
    "This constellation favors patience over speed.",
    "Unfinishedness is not a flaw here. It is a room.",
    "Every return redraws the sky by one degree."
  ];

  const hiddenFragments = [
    "Long-hover unlock: The garden keeps the softest maps in shadow.",
    "Long-hover unlock: Rare glyphs appear when attention is unhurried.",
    "Long-hover unlock: The portal opens wider for gentle hands."
  ];

  const poemFragments = [
    "Poem fragment: We stay where the dark can still breathe.",
    "Poem fragment: A soft orbit keeps what force would break.",
    "Poem fragment: The sky remembers each unfinished vow."
  ];

  const seasonalLore = {
    spring: "Spring/Fog: trust partial vision. Drift is slower, gentler, cooler.",
    summer: "Summer/Ocean: reach into overhead silence. Shimmer rises.",
    autumn: "Autumn/Storm: refuse collapse. Direction shifts and flicker deepens.",
    winter: "Winter/Soil: hold still. Fade cycles lengthen in dark loam."
  };

  const seasonalProfiles = {
    spring: { speed: 0.72, wobble: 0.16, decay: 0.996, shimmer: 1.05, fadeSlow: 1.1, depth: 0.95 },
    summer: { speed: 1.15, wobble: 0.22, decay: 0.994, shimmer: 1.25, fadeSlow: 0.9, depth: 0.85 },
    autumn: { speed: 1.02, wobble: 0.32, decay: 0.992, shimmer: 1.1, fadeSlow: 0.95, depth: 1.1 },
    winter: { speed: 0.66, wobble: 0.12, decay: 0.997, shimmer: 0.92, fadeSlow: 1.28, depth: 1.2 }
  };

  const fallbackWorldConfig = {
    pedals: [
      { id: "threshold", tone: "entry", primaryInteraction: "hover", reward: "branch_hints" },
      { id: "breath", tone: "stillness", primaryInteraction: "long_hover", reward: "seasonal_lore" },
      { id: "fracture", tone: "reframe", primaryInteraction: "click_chain", reward: "rare_channel" },
      { id: "echo", tone: "memory", primaryInteraction: "revisit", reward: "poem_fragments" },
      { id: "lantern", tone: "hospitality", primaryInteraction: "proximity_hold", reward: "lantern_vault_access" },
      { id: "compost", tone: "transformation", primaryInteraction: "multi_step", reward: "branch_rewrites" }
    ],
    galleries: [
      { id: "root_archive", unlock: { hoverUnique: 5, revisits: 1 } },
      { id: "lantern_vault", unlock: { longHover: 3 } },
      { id: "storm_cabinet", unlock: { doubleClick: 2, rareEvents: 1 } },
      { id: "seasonal_alcove", unlock: { seasonalReveals: 4 } }
    ],
    branches: [
      { from: "index", to: "hub", condition: "hub_active" },
      { from: "hub", to: "pedals", condition: "exploration" },
      { from: "ethos", to: "root_archive", condition: "hover_path" },
      { from: "housegarden", to: "lantern_vault", condition: "long_hover_path" },
      { from: "mythology", to: "storm_cabinet", condition: "double_click_path" }
    ],
    returns: {
      visit2: "guide_glyph",
      visit3: "rare_pool_persistent",
      visit5: "secret_branch",
      antiRepeatLore: true
    }
  };

  const season = getSeason();
  const seasonProfile = seasonalProfiles[season];
  const palette = getPaletteForSeason(season);

  const state = {
    active: false,
    rafId: null,
    pointer: { x: -1000, y: -1000 },
    deactivateTimer: null,
    hoverTimer: null,
    nextReconfigureAt: 0,
    glyphs: [],
    maxGlyphs: 12,
    world: fallbackWorldConfig,
    pedalsById: {},
    currentPedalIndex: -1,
    unlockedPedals: new Set(),
    unlockedGalleries: new Set(),
    branchMessagesSeen: new Set(),
    stats: {
      hoveredIds: new Set(),
      clicks: 0,
      dblClicks: 0,
      longHovers: 0,
      nearDurationMs: 0,
      rareEvents: 0,
      seasonalReveals: new Set(),
      hoverUnlockShown: false,
      clickUnlockShown: false,
      dblUnlockShown: false,
      seasonUnlockShown: false,
      unlockedRare: false
    },
    pool: [...baseGlyphs],
    harmony: {
      phase: "seed",
      coherence: "soft",
      speedScale: 0.9,
      shimmerScale: 0.9,
      rareScale: 0.85,
      depthScale: 1.05
    },
    glyphImagePool: [],
    rainTimer: null,
    collisionTimer: null,
    collisionDriftTimer: null,
    collisionPockets: [],
    nodeFieldEnabled: true,
    rainMode: "glyph",
    rainIndex: 0,
    visits: 0,
    lastPedalEvalAt: 0,
    lastHudUpdateAt: 0,
    seenLore: new Set()
  };

  body.setAttribute("data-season", season);

  function getSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) {
      return "spring";
    }
    if (month >= 5 && month <= 7) {
      return "summer";
    }
    if (month >= 8 && month <= 10) {
      return "autumn";
    }
    return "winter";
  }

  function getPaletteForSeason(currentSeason) {
    const base = [
      "rgba(46,42,38,0.78)",
      "rgba(194,184,163,0.88)",
      "rgba(140,123,106,0.82)",
      "rgba(245,241,235,0.9)"
    ];

    if (currentSeason === "spring") {
      return ["rgba(117,128,145,0.85)", "rgba(194,184,163,0.86)", "rgba(221,228,235,0.82)", ...base];
    }
    if (currentSeason === "summer") {
      return ["rgba(235,214,156,0.92)", "rgba(214,242,242,0.85)", "rgba(255,241,204,0.9)", ...base];
    }
    if (currentSeason === "autumn") {
      return ["rgba(122,82,63,0.9)", "rgba(188,145,97,0.88)", "rgba(225,182,129,0.85)", ...base];
    }
    return ["rgba(32,27,23,0.9)", "rgba(119,104,92,0.85)", "rgba(179,167,152,0.82)", ...base];
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function choose(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function toVaultGlyphPath(fileName) {
    if (!fileName) {
      return "";
    }

    const clean = String(fileName).trim();
    if (!clean) {
      return "";
    }

    if (clean.startsWith("assets/") || clean.startsWith("data/") || clean.startsWith("http://") || clean.startsWith("https://")) {
      return clean;
    }

    return "data/theghost-vault/glyphs/" + encodeURI(clean);
  }

  async function loadGlyphImagePool() {
    const pool = [];
    const seen = new Set();

    function addPath(pathValue) {
      const path = toVaultGlyphPath(pathValue);
      if (!path || seen.has(path)) {
        return;
      }
      seen.add(path);
      pool.push(path);
    }

    try {
      const jewelry = await fetch("data/jewelry-images.json", { cache: "no-store" }).then(function (res) {
        if (!res.ok) {
          return [];
        }
        return res.json();
      });

      if (Array.isArray(jewelry)) {
        jewelry.forEach(addPath);
      }
    } catch (err) {
      // Keep fallback behavior.
    }

    try {
      const vaultGlyphs = await fetch("data/vault-glyphs.json", { cache: "no-store" }).then(function (res) {
        if (!res.ok) {
          return null;
        }
        return res.json();
      });

      function collectFromArray(items) {
        if (!Array.isArray(items)) {
          return;
        }
        items.forEach(function (item) {
          if (!item) {
            return;
          }

          if (typeof item === "string") {
            addPath(item);
            return;
          }

          if (typeof item === "object") {
            addPath(item.file || item.path || item.image || item.src || "");
          }
        });
      }

      if (vaultGlyphs) {
        collectFromArray(vaultGlyphs.glyphs);

        if (vaultGlyphs.seasonal && typeof vaultGlyphs.seasonal === "object") {
          Object.keys(vaultGlyphs.seasonal).forEach(function (key) {
            collectFromArray(vaultGlyphs.seasonal[key]);
          });
        }
      }
    } catch (err) {
      // Keep fallback behavior.
    }

    state.glyphImagePool = pool;
  }

  function chooseLore(source) {
    if (source.length === 0) {
      return "";
    }

    if (!state.world.returns || !state.world.returns.antiRepeatLore) {
      return choose(source);
    }

    const options = source.filter(function (line) {
      return !state.seenLore.has(line);
    });
    const picked = options.length > 0 ? choose(options) : choose(source);
    state.seenLore.add(picked);
    return picked;
  }

  function showLore(text) {
    if (!lore || !loreText) {
      return;
    }
    loreText.textContent = text;
    lore.hidden = false;
  }

  function isHubStateActivated() {
    return Boolean(
      window.threshold
      && window.threshold.state
      && (window.threshold.state.hubActivated || window.threshold.state.hubActivating)
    );
  }

  function hideLore() {
    if (!lore) {
      return;
    }
    lore.hidden = true;
  }

  function initializeCollisionPockets() {
    if (state.collisionPockets.length > 0) {
      return;
    }

    state.collisionPockets = [
      { nodeId: "drift", r: 58, x: 0, y: 0, offsetX: -26, offsetY: 14, phase: 0.0, amp: 9 },
      { nodeId: "collapse", r: 52, x: 0, y: 0, offsetX: 22, offsetY: -18, phase: 1.4, amp: 8 },
      { nodeId: "anchor", r: 64, x: 0, y: 0, offsetX: -12, offsetY: 28, phase: 2.3, amp: 7 },
      { nodeId: "resonance", r: 56, x: 0, y: 0, offsetX: 26, offsetY: 18, phase: 3.5, amp: 8 }
    ];

    updateCollisionPocketsFromNodes();
  }

  function getNodeCenter(nodeId) {
    const byData = document.querySelector(".node[data-id='" + nodeId + "']");
    const byId = document.getElementById(nodeId);
    const nodeEl = byData || byId;

    if (!nodeEl) {
      return null;
    }

    const rect = nodeEl.getBoundingClientRect();
    return {
      x: rect.left + (rect.width / 2),
      y: rect.top + (rect.height / 2)
    };
  }

  function updateCollisionPocketsFromNodes() {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    const t = performance.now() * 0.001;

    state.collisionPockets.forEach(function (pocket) {
      const center = getNodeCenter(pocket.nodeId || "");

      const anchorX = center ? center.x : (pocket.x || (w * 0.5));
      const anchorY = center ? center.y : (pocket.y || (h * 0.5));

      const driftX = Math.sin((t * 0.75) + pocket.phase) * pocket.amp;
      const driftY = Math.cos((t * 0.68) + (pocket.phase * 0.9)) * pocket.amp;

      const targetX = anchorX + pocket.offsetX + driftX;
      const targetY = anchorY + pocket.offsetY + driftY;

      if (!Number.isFinite(pocket.x) || !Number.isFinite(pocket.y) || (pocket.x === 0 && pocket.y === 0)) {
        pocket.x = targetX;
        pocket.y = targetY;
      } else {
        pocket.x += (targetX - pocket.x) * 0.28;
        pocket.y += (targetY - pocket.y) * 0.28;
      }

      pocket.x = Math.max(24, Math.min(w - 24, pocket.x));
      pocket.y = Math.max(24, Math.min(h - 24, pocket.y));
    });
  }

  function checkShapeCollision(el, nowMs) {
    if (!el || !el.isConnected) {
      return;
    }

    const rect = el.getBoundingClientRect();
    const cx = rect.left + (rect.width / 2);
    const cy = rect.top + (rect.height / 2);

    let pocketStrength = 0;
    let pocketNudge = 0;

    state.collisionPockets.forEach(function (pocket) {
      const dx = cx - pocket.x;
      const dy = cy - pocket.y;
      const dist = Math.sqrt((dx * dx) + (dy * dy));
      if (dist >= pocket.r) {
        return;
      }

      const ratio = 1 - (dist / pocket.r);
      pocketStrength = Math.max(pocketStrength, ratio);
      pocketNudge += (dx >= 0 ? 1 : -1) * 12 * ratio;
    });

    let nodeStrength = 0;
    if (state.nodeFieldEnabled) {
      const nodeEls = document.querySelectorAll(".node[data-id]");
      nodeEls.forEach(function (nodeEl) {
        const nodeId = String(nodeEl.getAttribute("data-id") || "").toLowerCase();
        if (!nodeId) {
          return;
        }

        const nRect = nodeEl.getBoundingClientRect();
        const nx = nRect.left + (nRect.width / 2);
        const ny = nRect.top + (nRect.height / 2);
        const dx = cx - nx;
        const dy = cy - ny;
        const dist = Math.sqrt((dx * dx) + (dy * dy));
        const radius = 90;

        if (dist >= radius) {
          return;
        }

        const ratio = 1 - (dist / radius);
        nodeStrength = Math.max(nodeStrength, ratio);

        if (nodeId === "capture") {
          pocketNudge += (dx >= 0 ? -1 : 1) * 7 * ratio;
        } else if (nodeId === "drift") {
          pocketNudge += 5 * ratio;
        } else if (nodeId === "collapse") {
          pocketNudge += (Math.random() - 0.5) * 6 * ratio;
        }
      });
    }

    const totalStrength = Math.max(pocketStrength, nodeStrength);
    const baseLeft = Number(el.dataset.baseLeft || "0");
    const phase = Number(el.dataset.collisionPhase || "0");
    const wave = Math.sin((nowMs * 0.004) + phase) * 3 * totalStrength;
    const nudge = Math.max(-20, Math.min(20, pocketNudge + wave));

    if (Number.isFinite(baseLeft)) {
      const targetLeft = Math.max(-30, Math.min(window.innerWidth + 30, baseLeft + nudge));
      el.style.left = targetLeft.toFixed(1) + "px";
    }

    if (totalStrength > 0.02) {
      el.classList.add("shape-pocket-react");
      el.style.opacity = Math.max(0.55, 0.9 - (totalStrength * 0.2)).toFixed(3);
      el.style.filter = "brightness(" + (1.02 + totalStrength * 0.2).toFixed(3) + ")";
    } else {
      el.classList.remove("shape-pocket-react");
      el.style.removeProperty("opacity");
      el.style.removeProperty("filter");
      if (Number.isFinite(baseLeft)) {
        el.style.left = baseLeft.toFixed(1) + "px";
      }
    }

    el.classList.toggle("shape-node-react", nodeStrength > 0.05);
  }

  function startCollisionField() {
    initializeCollisionPockets();
    updateCollisionPocketsFromNodes();

    if (state.collisionDriftTimer) {
      window.clearInterval(state.collisionDriftTimer);
    }
    state.collisionDriftTimer = window.setInterval(updateCollisionPocketsFromNodes, 120);

    if (state.collisionTimer) {
      window.clearInterval(state.collisionTimer);
    }

    state.collisionTimer = window.setInterval(function () {
      const now = performance.now();
      const shapes = document.querySelectorAll(".shape");
      shapes.forEach(function (shape) {
        checkShapeCollision(shape, now);
      });
    }, 60);
  }

  function stopCollisionField() {
    if (state.collisionTimer) {
      window.clearInterval(state.collisionTimer);
      state.collisionTimer = null;
    }
    if (state.collisionDriftTimer) {
      window.clearInterval(state.collisionDriftTimer);
      state.collisionDriftTimer = null;
    }
  }

  const hubDebug = {
    storageKey: "threshold.debug.hub.v1",
    enabled: false,
    overlay: null,
    log: null,
    timer: null,
    clickHandler: null,
    maxLogLines: 16,
    hoverRulesRemoved: 0,
    hoverPoliceApplied: false
  };

  function isHubDebugEnabled() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("hubDebug") === "1" || params.get("thresholdDebug") === "1") {
        return true;
      }
      return localStorage.getItem(hubDebug.storageKey) === "1";
    } catch (err) {
      return false;
    }
  }

  function setHubDebugEnabled(enabled) {
    hubDebug.enabled = Boolean(enabled);
    try {
      localStorage.setItem(hubDebug.storageKey, hubDebug.enabled ? "1" : "0");
    } catch (err) {
      // Ignore storage restrictions.
    }
  }

  function getThresholdActivatedFlag() {
    return Boolean(window.threshold && window.threshold.state && window.threshold.state.hubActivated);
  }

  function ensureHubDebugNodes() {
    if (!hubDebug.overlay) {
      hubDebug.overlay = document.getElementById("hub-debug-overlay");
      if (!hubDebug.overlay) {
        hubDebug.overlay = document.createElement("div");
        hubDebug.overlay.id = "hub-debug-overlay";
        document.body.appendChild(hubDebug.overlay);
      }
    }

    if (!hubDebug.log) {
      hubDebug.log = document.getElementById("hub-log");
      if (!hubDebug.log) {
        hubDebug.log = document.createElement("div");
        hubDebug.log.id = "hub-log";
        document.body.appendChild(hubDebug.log);
      }
    }
  }

  function addHubLogLine(msg) {
    if (!hubDebug.enabled || !hubDebug.log) {
      return;
    }

    const line = document.createElement("div");
    line.className = "line";
    line.textContent = "[" + new Date().toLocaleTimeString() + "] " + msg;
    hubDebug.log.appendChild(line);

    while (hubDebug.log.children.length > hubDebug.maxLogLines) {
      hubDebug.log.removeChild(hubDebug.log.firstChild);
    }
  }

  function inspectHubState(hubId) {
    const hub = document.getElementById(hubId);
    if (!hub) {
      return {
        exists: false,
        activated: false,
        zIndex: "n/a",
        pointerEvents: "n/a",
        hover: false,
        topElement: "none"
      };
    }

    const rect = hub.getBoundingClientRect();
    const probeX = Math.max(0, Math.min(window.innerWidth - 1, rect.left + 5));
    const probeY = Math.max(0, Math.min(window.innerHeight - 1, rect.top + 5));
    const topElement = document.elementFromPoint(probeX, probeY);

    return {
      exists: true,
      activated: hub.classList.contains("activated"),
      zIndex: window.getComputedStyle(hub).zIndex,
      pointerEvents: window.getComputedStyle(hub).pointerEvents,
      hover: hub.matches(":hover"),
      topElement: topElement ? (topElement.id || topElement.className || topElement.tagName) : "none"
    };
  }

  function updateHubDebugOverlay() {
    if (!hubDebug.enabled || !hubDebug.overlay) {
      return;
    }

    const a = inspectHubState("hubA");
    const b = inspectHubState("hubB");

    hubDebug.overlay.textContent = [
      "HUB DEBUG",
      "A: active=" + a.activated + " z=" + a.zIndex + " pe=" + a.pointerEvents + " top=" + a.topElement,
      "B: active=" + b.activated + " z=" + b.zIndex + " pe=" + b.pointerEvents + " top=" + b.topElement,
      "thresholdActivated=" + getThresholdActivatedFlag(),
      "hubActivating=" + Boolean(window.threshold && window.threshold.state && window.threshold.state.hubActivating),
      "hoverRulesRemoved=" + hubDebug.hoverRulesRemoved
    ].join("\n");
  }

  function addClickDot(event) {
    const dot = document.createElement("div");
    dot.className = "click-dot";
    dot.style.left = event.clientX + "px";
    dot.style.top = event.clientY + "px";
    document.body.appendChild(dot);
    window.setTimeout(function () {
      dot.remove();
    }, 1000);
  }

  function enableClickHeatmap() {
    if (hubDebug.clickHandler) {
      return;
    }

    hubDebug.clickHandler = function (event) {
      addClickDot(event);
    };
    document.addEventListener("click", hubDebug.clickHandler, true);
  }

  function disableClickHeatmap() {
    if (!hubDebug.clickHandler) {
      return;
    }

    document.removeEventListener("click", hubDebug.clickHandler, true);
    hubDebug.clickHandler = null;
  }

  function runHoverPolice() {
    let removed = 0;

    Array.from(document.styleSheets).forEach(function (sheet) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch (err) {
        return;
      }

      if (!rules) {
        return;
      }

      for (let i = rules.length - 1; i >= 0; i -= 1) {
        const rule = rules[i];
        if (rule && rule.selectorText && rule.selectorText.indexOf(":hover") !== -1) {
          try {
            sheet.deleteRule(i);
            removed += 1;
          } catch (err) {
            // Ignore non-deletable rules.
          }
        }
      }
    });

    hubDebug.hoverPoliceApplied = true;
    hubDebug.hoverRulesRemoved += removed;
    addHubLogLine("Hover Police removed " + removed + " :hover rules");
    updateHubDebugOverlay();
    return removed;
  }

  function startHubDebugConsole() {
    if (hubDebug.enabled) {
      return;
    }

    setHubDebugEnabled(true);
    ensureHubDebugNodes();
    enableClickHeatmap();
    updateHubDebugOverlay();

    if (hubDebug.timer) {
      window.clearInterval(hubDebug.timer);
    }

    hubDebug.timer = window.setInterval(updateHubDebugOverlay, 200);
    addHubLogLine("Debug console enabled");
  }

  function stopHubDebugConsole() {
    if (!hubDebug.enabled) {
      return;
    }

    setHubDebugEnabled(false);
    disableClickHeatmap();

    if (hubDebug.timer) {
      window.clearInterval(hubDebug.timer);
      hubDebug.timer = null;
    }

    if (hubDebug.overlay) {
      hubDebug.overlay.remove();
      hubDebug.overlay = null;
    }

    if (hubDebug.log) {
      hubDebug.log.remove();
      hubDebug.log = null;
    }
  }

  function exposeHubDebugApi() {
    window.debugHub = function (hubId) {
      const snapshot = inspectHubState(hubId);
      console.log("----- HUB DEBUG -----");
      console.log("Hub ID:", hubId);
      console.log("Exists:", snapshot.exists);
      console.log("Z-index:", snapshot.zIndex);
      console.log("Pointer Events:", snapshot.pointerEvents);
      console.log("Activated:", snapshot.activated);
      console.log("Hover State:", snapshot.hover);
      console.log("Top Element Under Probe:", snapshot.topElement);
      console.log("thresholdActivated:", getThresholdActivatedFlag());
      console.log("---------------------");
      return snapshot;
    };

    window.thresholdDebug = {
      enable: startHubDebugConsole,
      disable: stopHubDebugConsole,
      log: addHubLogLine,
      hoverPolice: runHoverPolice,
      debugHub: window.debugHub
    };
  }

  const rainGlyphs = ["✦", "✧", "✸", "✹", "✺", "✶", "✷"];
  const rainShapes = ["○", "◇", "□", "△", "⬤", "◆"];

  function clearParticleRain() {
    if (state.rainTimer) {
      window.clearInterval(state.rainTimer);
      state.rainTimer = null;
    }

    const active = field.querySelectorAll(".activation-rain-particle");
    active.forEach(function (node) {
      node.remove();
    });

    stopCollisionField();
  }

  function behaviorForNode(nodeName) {
    switch (nodeName) {
      case "pressure":
        return "fastFall";
      case "anchor":
        return "slowFall";
      case "collapse":
        return "jitterFall";
      case "drift":
        return "sideDrift";
      case "resonance":
        return "wobbleFall";
      case "orbit":
        return "spiralFall";
      case "capture":
        return "inwardFall";
      case "threshold":
        return "calmFall";
      default:
        return particleBehaviors[0];
    }
  }

  function spawnRainParticle(mode) {
    const el = document.createElement("div");
    el.className = "particle activation-rain-particle";
    const source = mode === "shape" ? rainShapes : rainGlyphs;
    const index = state.rainIndex;
    el.innerText = source[index % source.length];

    if (index % 4 === 0) {
      el.classList.add("vapor");
    }

    const left = ((index * 137) % 1000) / 1000 * window.innerWidth;
    const speed = 3 + ((index % 8));
    const size = 18 + ((index % 8) * 4);

    el.style.left = left.toFixed(1) + "px";
    el.dataset.baseLeft = left.toFixed(2);
    el.dataset.collisionPhase = (Math.PI * 2 * ((index % 31) / 31)).toFixed(4);
    el.style.top = "-40px";
    el.style.fontSize = size.toFixed(1) + "px";

    let behavior = particleBehaviors[index % particleBehaviors.length];

    if (mode === "shape") {
      el.classList.add("shape");
      const key = nodeColorKeys[index % nodeColorKeys.length];
      el.style.color = nodeColors[key];
      behavior = behaviorForNode(key);

      if (behavior === "fastFall") {
        el.style.animationDuration = "2.8s";
      } else if (behavior === "slowFall") {
        el.style.animationDuration = "8.4s";
      } else if (behavior === "calmFall") {
        el.style.animationDuration = "7.2s";
      }
    } else {
      el.style.color = "#cfd2d6";
    }

    el.style.animationName = behavior;
    el.style.animationDuration = speed.toFixed(2) + "s";
    el.style.animationTimingFunction = "linear";
    el.style.animationFillMode = "forwards";

    field.appendChild(el);
    state.rainIndex += 1;

    window.setTimeout(function () {
      el.remove();
    }, Math.ceil(speed * 1000));
  }

  function startRain(mode) {
    clearParticleRain();
    state.rainMode = mode === "shape" ? "shape" : "glyph";
    startCollisionField();
    const cadence = state.rainMode === "shape" ? 250 : 200;
    state.rainTimer = window.setInterval(function () {
      spawnRainParticle(state.rainMode);
    }, cadence);
  }

  function emitGlyphInteraction(glyph, reason) {
    window.dispatchEvent(new CustomEvent("threshold:glyph-interaction", {
      detail: {
        id: glyph && glyph.id ? glyph.id : "",
        x: glyph && Number.isFinite(glyph.x) ? glyph.x : 0,
        y: glyph && Number.isFinite(glyph.y) ? glyph.y : 0,
        glyph: glyph && glyph.glyphChar ? glyph.glyphChar : "",
        season: season,
        reason: reason || "ambient"
      }
    }));
  }

  function updateWorldStateHud(force) {
    if (!worldStateSeason || !worldStateVisits || !worldStatePedals || !worldStateGalleries || !worldStateCounters) {
      return;
    }

    const now = performance.now();
    if (!force && now - state.lastHudUpdateAt < 180) {
      return;
    }

    state.lastHudUpdateAt = now;

    const unlockedPedals = state.world.pedals
      .filter(function (pedal) { return state.unlockedPedals.has(pedal.id); })
      .map(function (pedal) { return pedal.id; });

    const unlockedGalleries = state.world.galleries
      .filter(function (gallery) { return state.unlockedGalleries.has(gallery.id); })
      .map(function (gallery) { return gallery.id; });

    worldStateSeason.textContent = "Season: " + season;
    worldStateVisits.textContent = "Visits: " + state.visits;
    worldStatePedals.textContent = "Pedals: " + (unlockedPedals.length > 0 ? unlockedPedals.join(", ") : "none");
    worldStateGalleries.textContent = "Galleries: " + (unlockedGalleries.length > 0 ? unlockedGalleries.join(", ") : "none");
    worldStateCounters.textContent = "H:" + state.stats.hoveredIds.size +
      " C:" + state.stats.clicks +
      " D:" + state.stats.dblClicks +
      " L:" + state.stats.longHovers +
      " R:" + state.stats.rareEvents;

    worldStateCounters.textContent += " | " + state.harmony.phase + "/" + state.harmony.coherence;
  }

  function applyHarmonySignal(detail) {
    const phase = detail && typeof detail.phase === "string" ? detail.phase : (body.dataset.harmonyPhase || "seed");
    const coherence = detail && typeof detail.coherence === "string" ? detail.coherence : (body.dataset.harmonyCoherence || "soft");

    const harmony = {
      phase: phase,
      coherence: coherence,
      speedScale: 1,
      shimmerScale: 1,
      rareScale: 1,
      depthScale: 1
    };

    if (phase === "seed") {
      harmony.speedScale = 0.86;
      harmony.shimmerScale = 0.9;
      harmony.rareScale = 0.82;
      harmony.depthScale = 1.08;
    } else if (phase === "weave") {
      harmony.speedScale = 1;
      harmony.shimmerScale = 1;
      harmony.rareScale = 1;
      harmony.depthScale = 1;
    } else if (phase === "bloom") {
      harmony.speedScale = 1.16;
      harmony.shimmerScale = 1.24;
      harmony.rareScale = 1.22;
      harmony.depthScale = 0.94;
    } else if (phase === "resolve") {
      harmony.speedScale = 0.95;
      harmony.shimmerScale = 1.08;
      harmony.rareScale = 0.94;
      harmony.depthScale = 1.03;
    }

    if (coherence === "woven") {
      harmony.shimmerScale += 0.06;
    } else if (coherence === "harmonic") {
      harmony.speedScale += 0.08;
      harmony.shimmerScale += 0.12;
      harmony.rareScale += 0.1;
    }

    state.harmony = harmony;
    updateWorldStateHud(true);
  }

  function initPedalRegistry() {
    state.pedalsById = {};
    state.world.pedals.forEach(function (pedal, index) {
      state.pedalsById[pedal.id] = Object.assign({ index: index }, pedal);
    });
  }

  function loadPersistentState() {
    maybeResetArchiveRewritesFromUrl();

    try {
      state.visits = Number(localStorage.getItem("threshold.hubVisits") || "0") + 1;
      localStorage.setItem("threshold.hubVisits", String(state.visits));
      state.stats.unlockedRare = localStorage.getItem("threshold.hubRareUnlocked") === "1";

      const serializedSeasons = localStorage.getItem("threshold.hubSeasonalReveals");
      if (serializedSeasons) {
        JSON.parse(serializedSeasons).forEach(function (s) {
          state.stats.seasonalReveals.add(s);
        });
      }

      const serializedPedals = localStorage.getItem("threshold.hubPedalsUnlocked");
      if (serializedPedals) {
        JSON.parse(serializedPedals).forEach(function (id) {
          state.unlockedPedals.add(id);
        });
      }

      const serializedGalleries = localStorage.getItem("threshold.hubGalleriesUnlocked");
      if (serializedGalleries) {
        JSON.parse(serializedGalleries).forEach(function (id) {
          state.unlockedGalleries.add(id);
        });
      }
    } catch (err) {
      // Ignore storage restrictions.
    }

    if (state.stats.unlockedRare || state.visits >= 3) {
      state.stats.unlockedRare = true;
      rareGlyphs.forEach(function (glyph) {
        if (!state.pool.includes(glyph)) {
          state.pool.push(glyph);
        }
      });
    }
  }

  function persistPedalAndGalleryState() {
    try {
      localStorage.setItem("threshold.hubPedalsUnlocked", JSON.stringify(Array.from(state.unlockedPedals)));
      localStorage.setItem("threshold.hubGalleriesUnlocked", JSON.stringify(Array.from(state.unlockedGalleries)));
      localStorage.setItem("threshold.hubSeasonalReveals", JSON.stringify(Array.from(state.stats.seasonalReveals)));
    } catch (err) {
      // Ignore storage restrictions.
    }
  }

  function persistRareUnlock() {
    try {
      localStorage.setItem("threshold.hubRareUnlocked", "1");
    } catch (err) {
      // Ignore storage restrictions.
    }
  }

  function maybeResetArchiveRewritesFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("archiveReset") !== "1") {
      return;
    }

    try {
      localStorage.removeItem(archiveRewriteStorageKey);
    } catch (err) {
      // Ignore storage restrictions.
    }
  }

  function ensurePedalUnlocked(pedalId) {
    const pedal = state.pedalsById[pedalId];
    if (!pedal || state.unlockedPedals.has(pedalId)) {
      return false;
    }

    state.unlockedPedals.add(pedalId);
    state.currentPedalIndex = Math.max(state.currentPedalIndex, pedal.index);
    return true;
  }

  function ensureGalleryUnlocked(galleryId) {
    const exists = state.world.galleries.some(function (gallery) {
      return gallery.id === galleryId;
    });

    if (!exists || state.unlockedGalleries.has(galleryId)) {
      return false;
    }

    state.unlockedGalleries.add(galleryId);
    return true;
  }

  function consumeArchiveUnlockPayload() {
    let payload = null;

    try {
      const raw = localStorage.getItem(archiveHubUnlockStorageKey);
      if (!raw) {
        return;
      }
      payload = JSON.parse(raw);
      localStorage.removeItem(archiveHubUnlockStorageKey);
    } catch (err) {
      return;
    }

    if (!payload || typeof payload !== "object") {
      return;
    }

    const unlockedMessages = [];
    const pathVisits = payload.pathsVisited && typeof payload.pathsVisited === "object" ? payload.pathsVisited : {};
    const allPathsVisited = ["collapse", "expand", "fog", "soil"].every(function (choice) {
      return Number(pathVisits[choice] || 0) > 0;
    });

    if (ensurePedalUnlocked("threshold")) {
      unlockedMessages.push("Archive threshold aligned with Hub threshold.");
    }

    if (Number(payload.archiveVisits || 0) >= 2 && ensurePedalUnlocked("echo")) {
      unlockedMessages.push("Archive returns fed the Echo pedal.");
    }

    if (Number(pathVisits.fog || 0) > 0 && ensurePedalUnlocked("breath")) {
      unlockedMessages.push("Fog path carried stillness into the Breath pedal.");
    }

    if (Number(pathVisits.collapse || 0) > 0 && ensurePedalUnlocked("fracture")) {
      unlockedMessages.push("Collapse path opened the Fracture pedal.");
    }

    if (Number(pathVisits.soil || 0) > 0 && ensurePedalUnlocked("compost")) {
      unlockedMessages.push("Soil path rooted the Compost pedal.");
    }

    if (allPathsVisited && ensureGalleryUnlocked("root_archive")) {
      unlockedMessages.push("Archive traversal unlocked the Root Archive gallery.");
    }

    if (payload.harmonyPhase === "bloom" && ensureGalleryUnlocked("seasonal_alcove")) {
      state.stats.seasonalReveals.add(season);
      unlockedMessages.push("Bloom phase opened the Seasonal Alcove.");
    }

    if (payload.rare) {
      state.stats.unlockedRare = true;
      persistRareUnlock();
      rareGlyphs.forEach(function (glyph) {
        if (!state.pool.includes(glyph)) {
          state.pool.push(glyph);
        }
      });

      if (ensureGalleryUnlocked("storm_cabinet")) {
        unlockedMessages.push("Rare archive descent unlocked the Storm Cabinet.");
      }
    }

    persistPedalAndGalleryState();
    updateWorldStateHud(true);

    if (unlockedMessages.length > 0) {
      showLore("Archive transfer: " + unlockedMessages.join(" "));
    }
  }

  function getPedalUnlockCondition(pedalId) {
    const stat = state.stats;
    const visits = state.visits;

    if (pedalId === "threshold") {
      return stat.hoveredIds.size >= 1;
    }
    if (pedalId === "breath") {
      return stat.longHovers >= 1;
    }
    if (pedalId === "fracture") {
      return stat.clicks >= 2 && stat.dblClicks >= 1;
    }
    if (pedalId === "echo") {
      return visits >= 2;
    }
    if (pedalId === "lantern") {
      return stat.nearDurationMs >= 3000;
    }
    if (pedalId === "compost") {
      return stat.hoveredIds.size >= 5 && stat.clicks >= 3 && stat.longHovers >= 2 && visits >= 2;
    }
    return false;
  }

  function getPedalRewardLine(rewardId) {
    const map = {
      branch_hints: "Pedal unlocked: Threshold. First branch hints now visible.",
      seasonal_lore: "Pedal unlocked: Breath. Seasonal lore deepens under stillness.",
      rare_channel: "Pedal unlocked: Fracture. Rare channel alignment increased.",
      poem_fragments: "Pedal unlocked: Echo. Return fragments now resonate.",
      lantern_vault_access: "Pedal unlocked: Lantern. Lantern vault path is warming.",
      branch_rewrites: "Pedal unlocked: Compost. Branch rewrites are now possible."
    };

    return map[rewardId] || "A chamber opened.";
  }

  function evaluatePedalProgress() {
    state.world.pedals.forEach(function (pedal) {
      if (state.unlockedPedals.has(pedal.id)) {
        return;
      }

      if (getPedalUnlockCondition(pedal.id)) {
        state.unlockedPedals.add(pedal.id);
        state.currentPedalIndex = Math.max(state.currentPedalIndex, pedal.index);
        showLore(getPedalRewardLine(pedal.reward));
      }
    });

    persistPedalAndGalleryState();
    updateWorldStateHud(true);
  }

  function meetsUnlockRequirements(unlockSpec) {
    if (!unlockSpec) {
      return false;
    }

    if (typeof unlockSpec.hoverUnique === "number" && state.stats.hoveredIds.size < unlockSpec.hoverUnique) {
      return false;
    }
    if (typeof unlockSpec.revisits === "number" && Math.max(0, state.visits - 1) < unlockSpec.revisits) {
      return false;
    }
    if (typeof unlockSpec.longHover === "number" && state.stats.longHovers < unlockSpec.longHover) {
      return false;
    }
    if (typeof unlockSpec.doubleClick === "number" && state.stats.dblClicks < unlockSpec.doubleClick) {
      return false;
    }
    if (typeof unlockSpec.rareEvents === "number" && state.stats.rareEvents < unlockSpec.rareEvents) {
      return false;
    }
    if (typeof unlockSpec.seasonalReveals === "number" && state.stats.seasonalReveals.size < unlockSpec.seasonalReveals) {
      return false;
    }

    return true;
  }

  function evaluateGalleryUnlocks() {
    state.world.galleries.forEach(function (gallery) {
      if (state.unlockedGalleries.has(gallery.id)) {
        return;
      }

      if (meetsUnlockRequirements(gallery.unlock)) {
        state.unlockedGalleries.add(gallery.id);
        showLore("Gallery unlocked: " + gallery.id.replace(/_/g, " ") + ".");
      }
    });

    persistPedalAndGalleryState();
    updateWorldStateHud(true);
  }

  function maybeShowBranchHints() {
    if (state.branchMessagesSeen.has("branch-hints")) {
      return;
    }

    if (state.unlockedPedals.has("threshold") && state.unlockedPedals.has("lantern")) {
      state.branchMessagesSeen.add("branch-hints");
      showLore("Branch hint: House and Garden can now route toward the Lantern Vault.");
    }

    if (!state.branchMessagesSeen.has("storm-hint") && state.unlockedGalleries.has("storm_cabinet")) {
      state.branchMessagesSeen.add("storm-hint");
      showLore("Branch hint: Mythology is now linked to the Storm Cabinet.");
    }
  }

  function applyReturnMilestones() {
    if (state.visits >= 2 && !state.branchMessagesSeen.has("return2")) {
      state.branchMessagesSeen.add("return2");
      showLore("Return loop: Guide glyph behavior is now active.");
    }

    if (state.visits >= 3 && !state.branchMessagesSeen.has("return3")) {
      state.branchMessagesSeen.add("return3");
      state.stats.unlockedRare = true;
      persistRareUnlock();
      rareGlyphs.forEach(function (glyph) {
        if (!state.pool.includes(glyph)) {
          state.pool.push(glyph);
        }
      });
      showLore("Return loop: Rare pool persistence now active.");
    }

    if (state.visits >= 5 && !state.branchMessagesSeen.has("return5")) {
      state.branchMessagesSeen.add("return5");
      showLore("Return loop: Secret branch opened. Follow the quietest glyph.");
    }
  }

  function evaluateWorldProgress() {
    const now = performance.now();
    if (now - state.lastPedalEvalAt < 300) {
      return;
    }

    state.lastPedalEvalAt = now;
    evaluatePedalProgress();
    evaluateGalleryUnlocks();
    maybeShowBranchHints();
    updateWorldStateHud(false);
  }

  function createGlyph() {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "drift-glyph";
    el.setAttribute("aria-label", "Drifting glyph");

    const charNode = document.createElement("span");
    charNode.className = "drift-glyph-char";
    el.appendChild(charNode);

    const imageNode = document.createElement("img");
    imageNode.className = "drift-glyph-image glyph-particle";
    imageNode.alt = "";
    imageNode.decoding = "async";
    imageNode.loading = "lazy";
    imageNode.hidden = true;
    el.appendChild(imageNode);

    const glyph = {
      id: Math.random().toString(36).slice(2),
      el: el,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      rot: 0,
      rotSpeed: 0,
      rotPause: 0,
      wobbleSeed: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.002, 0.01),
      wobbleAmp: rand(0.02, 0.11),
      fadePhase: rand(0, Math.PI * 2),
      fadeSpeed: rand(0.005, 0.014),
      fadeMin: rand(0.08, 0.22),
      fadeMax: rand(0.45, 0.92),
      life: rand(3800, 9800),
      age: 0,
      brightTimer: 0,
      freezeTimer: 0,
      blinkTimer: 0,
      trailTimer: 0,
      nextBurstAt: rand(1200, 6000),
      size: rand(18, 32),
      glyphChar: choose(state.pool),
      colorA: choose(palette),
      colorB: choose(palette),
      charNode: charNode,
      imageNode: imageNode,
      imagePath: "",
      useImage: false,
      driftDistance: 0,
      driftDuration: 0
    };

    setupGlyphHandlers(glyph);
    respawnGlyph(glyph, true);

    field.appendChild(el);
    state.glyphs.push(glyph);
  }

  function setupGlyphHandlers(glyph) {
    glyph.el.addEventListener("mouseenter", function () {
      clearTimeout(state.hoverTimer);
      state.stats.hoveredIds.add(glyph.id);

      state.hoverTimer = setTimeout(function () {
        state.stats.longHovers += 1;
        revealSeasonalUnlock();
        showLore(chooseLore(hiddenFragments));
      }, 950);
    });

    glyph.el.addEventListener("mouseleave", function () {
      clearTimeout(state.hoverTimer);
    });

    glyph.el.addEventListener("click", function () {
      state.stats.clicks += 1;
      emitGlyphInteraction(glyph, "click");
      glyph.freezeTimer = 260;
      glyph.brightTimer = 750;
      glyph.el.classList.add("is-pulsing");
      setTimeout(function () {
        glyph.el.classList.remove("is-pulsing");
      }, 340);

      if (state.stats.clicks >= 3 && !state.stats.clickUnlockShown) {
        state.stats.clickUnlockShown = true;
        showLore(chooseLore(poemFragments));
      }
    });

    glyph.el.addEventListener("dblclick", function () {
      state.stats.dblClicks += 1;
      emitGlyphInteraction(glyph, "dblclick");
      glyph.glyphChar = choose(rareGlyphs);
      glyph.brightTimer = 1500;
      glyph.el.classList.add("is-rare");
      glyph.useImage = false;
      glyph.imagePath = "";
      glyph.imageNode.hidden = true;
      glyph.charNode.hidden = false;
      glyph.charNode.textContent = glyph.glyphChar;
      showLore(chooseLore(loreFragments));

      if (state.stats.dblClicks >= 2 && !state.stats.dblUnlockShown) {
        state.stats.dblUnlockShown = true;
        state.stats.unlockedRare = true;
        persistRareUnlock();
        rareGlyphs.forEach(function (g) {
          if (!state.pool.includes(g)) {
            state.pool.push(g);
          }
        });
        showLore("Unlock: Rare glyph channel opened.");
      }
    });
  }

  function revealSeasonalUnlock() {
    if (!state.stats.seasonUnlockShown) {
      state.stats.seasonUnlockShown = true;
      showLore("Seasonal reveal: " + seasonalLore[season]);
    }

    state.stats.seasonalReveals.add(season);
    persistPedalAndGalleryState();
  }

  function ensureGlyphs() {
    if (state.glyphs.length > 0) {
      return;
    }

    for (let i = 0; i < state.maxGlyphs; i += 1) {
      createGlyph();
    }
  }

  function respawnGlyph(glyph, keepPosition) {
    const margin = 24;
    if (!keepPosition) {
      glyph.x = rand(margin, Math.max(margin + 1, window.innerWidth - margin));
      glyph.y = rand(margin, Math.max(margin + 1, window.innerHeight - margin));
    }

    if (keepPosition) {
      glyph.x = rand(margin, Math.max(margin + 1, window.innerWidth - margin));
      glyph.y = rand(margin + 20, Math.max(margin + 20, window.innerHeight - margin));
    }

    glyph.size = rand(18, 32);
    glyph.dx = rand(-0.3, 0.3) * seasonProfile.speed * state.harmony.speedScale;
    glyph.dy = rand(-0.2, 0.4) * seasonProfile.speed * state.harmony.speedScale;
    glyph.rot = rand(-25, 25);
    glyph.rotSpeed = rand(-0.03, 0.03);
    glyph.rotPause = rand(0, 1400);
    glyph.fadePhase = rand(0, Math.PI * 2);
    glyph.fadeSpeed = rand(0.0045, 0.014) / seasonProfile.fadeSlow;
    glyph.fadeMin = rand(0.1, 0.32);
    glyph.fadeMax = rand(0.45, 0.95);
    glyph.age = 0;
    glyph.life = rand(4200, 10200) * seasonProfile.depth * state.harmony.depthScale;
    glyph.blinkTimer = 0;
    glyph.brightTimer = 0;
    glyph.freezeTimer = 0;
    glyph.trailTimer = 0;
    glyph.nextBurstAt = rand(900, 5400);
    glyph.glyphChar = choose(state.pool);
    glyph.colorA = choose(palette);
    glyph.colorB = choose(palette);
    glyph.imagePath = state.glyphImagePool.length > 0 ? choose(state.glyphImagePool) : "";
    glyph.useImage = Boolean(glyph.imagePath);

    let driftStrength = 100;
    if (season === "spring") {
      driftStrength = 40;
    } else if (season === "summer") {
      driftStrength = 80;
    } else if (season === "autumn") {
      driftStrength = 200;
    } else if (season === "winter") {
      driftStrength = 20;
    }

    glyph.driftDistance = (Math.random() - 0.5) * driftStrength;
    glyph.driftDuration = rand(5.2, 10.8) / Math.max(0.6, seasonProfile.speed);

    if (glyph.useImage) {
      glyph.imageNode.src = glyph.imagePath;
      glyph.imageNode.hidden = false;
      glyph.charNode.hidden = true;
      glyph.imageNode.classList.toggle("glyph-tail", Math.random() < 0.4);
      glyph.imageNode.classList.toggle("glyph-longtail", Math.random() < 0.15);
      glyph.imageNode.style.width = Math.max(20, Math.round(glyph.size + rand(4, 14))) + "px";
      glyph.imageNode.style.height = "auto";
      glyph.imageNode.style.opacity = "0.92";
    } else {
      glyph.imageNode.hidden = true;
      glyph.charNode.hidden = false;
      glyph.charNode.textContent = glyph.glyphChar;
      glyph.imageNode.classList.remove("glyph-tail", "glyph-longtail");
    }

    glyph.el.style.setProperty("--glyph-size", glyph.size.toFixed(2) + "px");
    glyph.el.style.setProperty("--drift-distance", glyph.driftDistance.toFixed(1) + "px");
    glyph.el.style.setProperty("--drift-duration", glyph.driftDuration.toFixed(2) + "s");
    glyph.el.classList.add("has-side-drift");
  }

  function mixRgba(colorA, colorB, t) {
    const a = colorA.match(/[\d.]+/g).map(Number);
    const b = colorB.match(/[\d.]+/g).map(Number);
    const r = a[0] + (b[0] - a[0]) * t;
    const g = a[1] + (b[1] - a[1]) * t;
    const bl = a[2] + (b[2] - a[2]) * t;
    const alphaA = a.length > 3 ? a[3] : 1;
    const alphaB = b.length > 3 ? b[3] : 1;
    const al = alphaA + (alphaB - alphaA) * t;
    return "rgba(" + r.toFixed(1) + "," + g.toFixed(1) + "," + bl.toFixed(1) + "," + al.toFixed(3) + ")";
  }

  function updateGlyph(glyph, dt, nowMs) {
    glyph.age += dt;
    glyph.fadePhase += glyph.fadeSpeed * dt;

    if (glyph.freezeTimer > 0) {
      glyph.freezeTimer -= dt;
    } else {
      glyph.dx *= seasonProfile.decay;
      glyph.dy *= seasonProfile.decay;

      const wobble = Math.sin(nowMs * glyph.wobbleSpeed + glyph.wobbleSeed) * glyph.wobbleAmp * seasonProfile.wobble * state.harmony.shimmerScale;
      glyph.dx += wobble * 0.02;
      glyph.dy += Math.cos(nowMs * glyph.wobbleSpeed * 0.8 + glyph.wobbleSeed) * glyph.wobbleAmp * 0.014;

      if (glyph.age > glyph.nextBurstAt && Math.random() < 0.06) {
        glyph.dx += rand(-0.11, 0.11) * seasonProfile.speed * state.harmony.speedScale;
        glyph.dy += rand(-0.08, 0.1) * seasonProfile.speed * state.harmony.speedScale;
        glyph.nextBurstAt = glyph.age + rand(1400, 6200);
      }

      glyph.x += glyph.dx * dt * 0.06;
      glyph.y += glyph.dy * dt * 0.06;
    }

    if (glyph.rotPause <= 0) {
      glyph.rot += glyph.rotSpeed * dt * 0.08;
      if (Math.random() < 0.003) {
        glyph.rotPause = rand(400, 2200);
      }
    } else {
      glyph.rotPause -= dt;
    }

    const dpx = state.pointer.x - glyph.x;
    const dpy = state.pointer.y - glyph.y;
    const dist = Math.sqrt(dpx * dpx + dpy * dpy);
    const nearThreshold = 130;
    const isNear = dist < nearThreshold;

    let nearBoost = 0;
    if (isNear) {
      nearBoost = Math.max(0, (nearThreshold - dist) / nearThreshold) * 0.9;
      glyph.dx += (dpx / Math.max(dist, 1)) * 0.002;
      glyph.dy += (dpy / Math.max(dist, 1)) * 0.002;
      glyph.dx *= 0.988;
      glyph.dy *= 0.988;
      glyph.rot += rand(-0.03, 0.03);
      state.stats.nearDurationMs += dt;
    }

    if (glyph.brightTimer > 0) {
      glyph.brightTimer -= dt;
    }

    if (glyph.blinkTimer > 0) {
      glyph.blinkTimer -= dt;
    }

    if (glyph.trailTimer > 0) {
      glyph.trailTimer -= dt;
    }

    const forbiddenSelector = forbiddenNodes
      .map(function (name) { return ".node[data-id='" + name + "']"; })
      .join(", ");
    const forbiddenNodeElements = forbiddenSelector ? document.querySelectorAll(forbiddenSelector) : [];
    forbiddenNodeElements.forEach(function (nodeEl) {
      const rect = nodeEl.getBoundingClientRect();
      const nearX = glyph.x > rect.left - 14 && glyph.x < rect.right + 14;
      const nearY = glyph.y > rect.top - 14 && glyph.y < rect.bottom + 14;
      if (!nearX || !nearY) {
        return;
      }

      const centerX = rect.left + (rect.width / 2);
      const push = glyph.x >= centerX ? 62 : -62;
      glyph.x += push;
      glyph.dx += push > 0 ? 0.04 : -0.04;
    });

    const fadeWave = (Math.sin(glyph.fadePhase) + 1) / 2;
    const opacityBase = glyph.fadeMin + (glyph.fadeMax - glyph.fadeMin) * fadeWave;
    const shimmerBoost = nearBoost * 0.45 * seasonProfile.shimmer * state.harmony.shimmerScale;
    const brightBoost = glyph.brightTimer > 0 ? 0.32 : 0;
    const opacity = Math.min(1, opacityBase + shimmerBoost + brightBoost);

    const colorMix = (Math.sin(glyph.fadePhase * 0.45 + glyph.wobbleSeed) + 1) / 2;
    const fill = mixRgba(glyph.colorA, glyph.colorB, colorMix);

    glyph.el.style.left = glyph.x.toFixed(2) + "px";
    glyph.el.style.top = glyph.y.toFixed(2) + "px";
    glyph.el.style.opacity = glyph.blinkTimer > 0 ? "0.06" : opacity.toFixed(3);
    glyph.el.style.transform = "translate(-50%, -50%) rotate(" + glyph.rot.toFixed(2) + "deg)";
    glyph.el.style.color = fill;
    glyph.el.style.borderColor = fill;
    glyph.el.style.background = glyph.useImage
      ? "rgba(46, 42, 38, " + Math.min(0.2, 0.04 + opacity * 0.12).toFixed(3) + ")"
      : "rgba(46, 42, 38, " + Math.min(0.42, 0.1 + opacity * 0.24).toFixed(3) + ")";

    if (glyph.useImage && glyph.imageNode) {
      glyph.imageNode.style.opacity = glyph.blinkTimer > 0 ? "0.08" : Math.min(0.96, opacity + 0.18).toFixed(3);
    }
    glyph.el.classList.toggle("is-near", isNear);
    glyph.el.classList.toggle("is-bright", glyph.brightTimer > 0);
    glyph.el.classList.toggle("has-trail", glyph.trailTimer > 0);

    const out = glyph.x < -60 || glyph.x > window.innerWidth + 60 || glyph.y < -60 || glyph.y > window.innerHeight + 60;
    const dead = glyph.age > glyph.life;
    if (out || dead) {
      respawnGlyph(glyph, false);
    }
  }

  function performRareEvent() {
    if (state.glyphs.length === 0) {
      return;
    }

    state.stats.rareEvents += 1;

    const target = choose(state.glyphs);
    const roll = Math.random();

    if (roll < 0.2) {
      target.blinkTimer = rand(180, 500);
      showLore("Rare event: a glyph blinked and returned altered.");
      return;
    }

    if (roll < 0.4) {
      target.trailTimer = rand(1800, 3600);
      showLore("Rare event: a glyph left a faint trail.");
      return;
    }

    if (roll < 0.6) {
      target.glyphChar = choose(rareGlyphs);
      target.useImage = false;
      target.imagePath = "";
      target.imageNode.hidden = true;
      target.charNode.hidden = false;
      target.charNode.textContent = target.glyphChar;
      target.brightTimer = 1700;
      target.el.classList.add("is-rare");
      showLore("Rare event: a glyph shifted into a rare form.");
      return;
    }

    if (roll < 0.8) {
      const split = {
        id: Math.random().toString(36).slice(2),
        el: document.createElement("button"),
        x: target.x + rand(-18, 18),
        y: target.y + rand(-18, 18),
        dx: -target.dx + rand(-0.05, 0.05),
        dy: target.dy + rand(-0.05, 0.05),
        rot: target.rot,
        rotSpeed: rand(-0.03, 0.03),
        rotPause: rand(0, 1200),
        wobbleSeed: rand(0, Math.PI * 2),
        wobbleSpeed: rand(0.002, 0.01),
        wobbleAmp: rand(0.02, 0.11),
        fadePhase: rand(0, Math.PI * 2),
        fadeSpeed: rand(0.005, 0.014),
        fadeMin: rand(0.1, 0.3),
        fadeMax: rand(0.45, 0.95),
        life: rand(1800, 4200),
        age: 0,
        brightTimer: 1000,
        freezeTimer: 0,
        blinkTimer: 0,
        trailTimer: 1200,
        nextBurstAt: rand(900, 5200),
        size: rand(18, 32),
        glyphChar: choose(rareGlyphs),
        colorA: choose(palette),
        colorB: choose(palette)
      };

      split.el.type = "button";
      split.el.className = "drift-glyph is-rare";
      split.el.setAttribute("aria-label", "Drifting glyph");
      split.imageNode = document.createElement("img");
      split.imageNode.className = "drift-glyph-image glyph-particle";
      split.imageNode.alt = "";
      split.imageNode.decoding = "async";
      split.imageNode.loading = "lazy";
      split.imageNode.hidden = true;
      split.el.appendChild(split.imageNode);
      split.charNode = document.createElement("span");
      split.charNode.className = "drift-glyph-char";
      split.charNode.textContent = split.glyphChar;
      split.el.appendChild(split.charNode);
      split.imagePath = state.glyphImagePool.length > 0 ? choose(state.glyphImagePool) : "";
      split.useImage = Boolean(split.imagePath);

      if (split.useImage) {
        split.imageNode.src = split.imagePath;
        split.imageNode.hidden = false;
        split.charNode.hidden = true;
        split.imageNode.classList.toggle("glyph-tail", Math.random() < 0.4);
        split.imageNode.classList.toggle("glyph-longtail", Math.random() < 0.15);
      }

      split.el.style.setProperty("--glyph-size", split.size.toFixed(2) + "px");
      split.el.style.setProperty("--drift-distance", ((Math.random() - 0.5) * 180).toFixed(1) + "px");
      split.el.style.setProperty("--drift-duration", rand(4.8, 9.8).toFixed(2) + "s");
      split.el.classList.add("has-side-drift");
      setupGlyphHandlers(split);
      field.appendChild(split.el);
      state.glyphs.push(split);
      emitGlyphInteraction(split, "split");

      showLore("Rare event: one glyph split into two whispers.");
      return;
    }

    showLore("Secret fragment: the dark opened and handed back a map.");
  }

  function maybeShowHoverUnlock() {
    if (state.stats.hoveredIds.size >= 5 && !state.stats.hoverUnlockShown) {
      state.stats.hoverUnlockShown = true;
      const unlocked = unlockGlyphs.shift();
      if (unlocked && !state.pool.includes(unlocked)) {
        state.pool.push(unlocked);
      }
      showLore("Unlock: a new glyph entered the constellation.");
    }
  }

  function reconfigureConstellation() {
    state.glyphs.forEach(function (glyph) {
      glyph.dx = rand(-0.26, 0.26) * seasonProfile.speed * state.harmony.speedScale;
      glyph.dy = rand(-0.2, 0.35) * seasonProfile.speed * state.harmony.speedScale;
      glyph.wobbleAmp = rand(0.02, 0.11) * seasonProfile.wobble * state.harmony.shimmerScale;
      glyph.colorA = choose(palette);
      glyph.colorB = choose(palette);
      glyph.life = rand(4200, 9800) * state.harmony.depthScale;
    });

    performRareEvent();
    showLore("Constellation reconfigured.");
  }

  function animate(nowMs) {
    if (!state.active) {
      return;
    }

    if (!animate.lastTs) {
      animate.lastTs = nowMs;
    }

    const dt = Math.min(50, nowMs - animate.lastTs);
    animate.lastTs = nowMs;

    state.glyphs.forEach(function (glyph) {
      updateGlyph(glyph, dt, nowMs);
    });

    maybeShowHoverUnlock();
    evaluateWorldProgress();
    updateWorldStateHud(false);

    if (nowMs > state.nextReconfigureAt) {
      reconfigureConstellation();
      state.nextReconfigureAt = nowMs + rand(90000, 180000) / Math.max(0.7, state.harmony.shimmerScale);
    }

    if (Math.random() < 0.0015 * seasonProfile.shimmer * state.harmony.rareScale) {
      performRareEvent();
    }

    state.rafId = requestAnimationFrame(animate);
  }

  function activateHub() {
    clearTimeout(state.deactivateTimer);

    if (state.active) {
      return;
    }

    state.active = true;
    body.classList.add("hub-active");
    ensureGlyphs();

    animate.lastTs = 0;
    state.nextReconfigureAt = performance.now() + rand(90000, 150000);

    if (state.visits > 1) {
      showLore("Return visit detected. The constellation has shifted.");
    } else {
      showLore("Hub active. Hover, click, and double-click glyphs to unlock the garden.");
    }

    applyReturnMilestones();
    evaluateWorldProgress();
    updateWorldStateHud(true);
    state.rafId = requestAnimationFrame(animate);

    if (!state.rainTimer) {
      startRain(state.rainMode || "glyph");
    }
  }

  function deactivateHub() {
    clearTimeout(state.deactivateTimer);

    if (isHubStateActivated()) {
      return;
    }

    if (!state.active) {
      return;
    }

    state.active = false;
    body.classList.remove("hub-active");

    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    state.glyphs.forEach(function (glyph) {
      glyph.el.style.opacity = "0";
      glyph.el.classList.remove("is-near", "is-bright", "is-pulsing", "has-trail", "is-rare");
    });

    clearParticleRain();

    hideLore();
    updateWorldStateHud(true);
  }

  function scheduleDeactivate() {
    if (isHubStateActivated()) {
      return;
    }

    clearTimeout(state.deactivateTimer);
    state.deactivateTimer = setTimeout(deactivateHub, 850);
  }

  function maybeAutoActivateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const wantsHub = params.get("hub") === "1" || window.location.hash === "#hub";

    if (!wantsHub) {
      return;
    }

    setTimeout(function () {
      if (window.threshold && typeof window.threshold.activateHub === "function") {
        window.threshold.activateHub();
        return;
      }
      activateHub();
    }, 120);
  }

  function mergeWorldConfig(raw) {
    if (!raw || typeof raw !== "object") {
      return fallbackWorldConfig;
    }

    return {
      pedals: Array.isArray(raw.pedals) ? raw.pedals : fallbackWorldConfig.pedals,
      galleries: Array.isArray(raw.galleries) ? raw.galleries : fallbackWorldConfig.galleries,
      branches: Array.isArray(raw.branches) ? raw.branches : fallbackWorldConfig.branches,
      returns: raw.returns && typeof raw.returns === "object" ? raw.returns : fallbackWorldConfig.returns
    };
  }

  function loadWorldConfig() {
    return fetch("data/world-structure.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Config fetch failed");
        }
        return res.json();
      })
      .then(function (json) {
        state.world = mergeWorldConfig(json);
      })
      .catch(function () {
        state.world = fallbackWorldConfig;
      });
  }

  function registerEventHandlers() {
    hubA.addEventListener("click", function () {
      addHubLogLine("Hub A click");
      if (window.threshold && typeof window.threshold.activateHub === "function") {
        window.threshold.activateHub({ path: "collapse" });
        return;
      }
      startRain("glyph");
      activateHub();
    });

    if (hubB) {
      hubB.addEventListener("click", function () {
        addHubLogLine("Hub B click");
        if (window.threshold && typeof window.threshold.activateHub === "function") {
          window.threshold.activateHub({ path: "drift" });
          return;
        }
        startRain("shape");
        activateHub();
      });
    }

    window.addEventListener("mousemove", function (event) {
      state.pointer = { x: event.clientX, y: event.clientY };
    });

    window.addEventListener("resize", function () {
      state.glyphs.forEach(function (glyph) {
        if (glyph.x > window.innerWidth - 20 || glyph.y > window.innerHeight - 20) {
          respawnGlyph(glyph, false);
        }
      });
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        deactivateHub();
      }
    });

    window.addEventListener("threshold:harmony-update", function (event) {
      applyHarmonySignal(event.detail || {});
    });

    window.addEventListener("threshold:activation-path", function (event) {
      const detail = event && event.detail ? event.detail : {};
      addHubLogLine("Activation path=" + (detail.path || "collapse") + " rotation=" + (detail.rotation || "cw"));
      if (detail.rain === "shape") {
        startRain("shape");
      } else {
        startRain("glyph");
      }
    });

    window.addEventListener("threshold:hub-entered", function () {
      addHubLogLine("Hub entered");
      activateHub();
    });

    window.addEventListener("threshold:hub-activation-started", function (event) {
      const detail = event && event.detail ? event.detail : {};
      addHubLogLine("Activation started path=" + (detail.path || "collapse"));
    });

    window.addEventListener("threshold:hub-activation-complete", function (event) {
      const detail = event && event.detail ? event.detail : {};
      addHubLogLine("Activation complete path=" + (detail.path || "collapse"));
    });
  }

  loadGlyphImagePool().finally(function () {
    loadWorldConfig().finally(function () {
      initPedalRegistry();
      loadPersistentState();
      consumeArchiveUnlockPayload();
      applyHarmonySignal({});
      updateWorldStateHud(true);
      exposeHubDebugApi();
      registerEventHandlers();

      if (isHubDebugEnabled()) {
        startHubDebugConsole();

        try {
          const params = new URLSearchParams(window.location.search);
          if (params.get("hoverPolice") === "1") {
            runHoverPolice();
          }
        } catch (err) {
          // Ignore URL parsing restrictions.
        }
      }

      maybeAutoActivateFromUrl();
    });
  });
})();
