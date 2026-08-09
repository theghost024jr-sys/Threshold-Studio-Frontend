(function () {
  const archive = document.getElementById("archive");
  const weatherFog = document.getElementById("weather-fog");
  const weatherShimmer = document.getElementById("weather-shimmer");
  const weatherStorm = document.getElementById("weather-storm");
  const weatherSoil = document.getElementById("weather-soil");
  const spiritAnimal = document.getElementById("spirit-animal");
  const legacyCharacter = document.getElementById("legacy-character");
  const cave = document.getElementById("cave");
  const driftField = document.getElementById("archiveDriftField");
  const stairs = document.getElementById("stairs");
  const chamber = document.getElementById("chamber");
  const archiveStatus = document.getElementById("archiveStatus");
  const archiveTrail = document.getElementById("archiveTrail");
  const pathButtons = Array.from(document.querySelectorAll(".path"));
  const modal = document.getElementById("glyphModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalDescription = document.getElementById("modalDescription");
  const closeButton = document.querySelector(".close-button");
  const archiveVisitStorageKey = "threshold.archive.visits.v1";
  const archiveHistoryStorageKey = "threshold.archive.choiceHistory.v1";
  const archivePathStorageKey = "threshold.archive.pathVisits.v1";
  const archiveHubUnlockStorageKey = "threshold.archive.hubUnlock.v1";
  const archiveRewriteStorageKey = "threshold.archive.rewrites.v1";
  const archiveReturnSignalStorageKey = "threshold.archive.returnSignal.v1";
  const archivePoolRotationStorageKey = "threshold.archive.notePoolRotation.v1";
  const archiveVaultDataPath = "data/vault-archive.json";
  const archiveGlyphDataPath = "data/vault-glyphs.json";

  if (!archive || !weatherFog || !weatherShimmer || !weatherStorm || !weatherSoil || !spiritAnimal || !legacyCharacter || !cave || !driftField || !stairs || !chamber || !archiveStatus || !archiveTrail || !modal || !modalTitle || !modalDescription || !closeButton || pathButtons.length === 0) {
    return;
  }

  const archiveTransitionMs = 280;

  const defaultGlyphData = {
    "The Mobius Strip with Three Loops": "A ritual of recursion, shimmer, and the refusal to flatten.",
    "The Pendant That Refused to Collapse": "Pressed from soil and ache, it loops breath into resilience.",
    "The Guest Who Became Gravity": "Presence strong enough to bend the room around it.",
    "The Listening Tree": "A glyph of rooted attention that receives before it speaks.",
    "The Center That Remembered Its Edges": "A return to boundaries as a form of care.",
    "The Clasp That Refused to Break": "A vow-form that held through weather and waiting.",
    "The Storm That Kept Its Lantern": "A collapse glyph that refuses disappearance and learns to hold signal in weather.",
    "The Shimmer That Refused to Sell": "A bright chamber glyph where radiance remains communal instead of becoming product.",
    "The Vow That Asked Nothing but Stayed": "A threshold glyph for fidelity without demand.",
    "The Echo That Didn\'t Need Attribution": "A fossilized listening mark that leaves a trace without trying to own it.",
    "The Fog That Carried a Door": "A chamber glyph for partial vision that still knows how to guide a body forward.",
    "The Root That Remembered Rain": "A soil glyph where buried memory becomes nourishment instead of weight.",
    "The Mirror Stair": "A rare glyph that appears when opposing choices are held long enough to reveal their shared spine.",
    "The Archive That Bloomed Underground": "A rare bloom glyph that turns descent into radiant subterranean weather.",
    "The Compost Crown": "A rare return glyph opened when enough visits teach the floor to answer back."
  };

  let glyphData = Object.assign({}, defaultGlyphData);

  const chamberData = {
    threshold: {
      title: "Threshold Chamber",
      className: "threshold",
      description: "The Archive waits between descent and lift. Choose collapse to enter the weather of held rupture, or expand to enter the chamber of shimmer and outward motion.",
      meta: ["State: waiting", "Geometry: mirrored", "Law: choice precedes room"],
      glyphs: [
        "The Vow That Asked Nothing but Stayed",
        "The Echo That Didn't Need Attribution",
        "The Center That Remembered Its Edges"
      ],
      status: "Stand at the threshold. The cave and stairs are mirrors of choice."
    },
    collapse: {
      title: "Storm Chamber",
      className: "collapse",
      description: "Collapse is not failure here. It is pressure, weather, and the room where fracture learns architecture. The stairs bow downward and the cave contracts into listening.",
      meta: ["Path: collapse", "Element: storm", "Motion: descend"],
      glyphs: [
        "The Pendant That Refused to Collapse",
        "The Storm That Kept Its Lantern",
        "The Clasp That Refused to Break"
      ],
      status: "Storm Chamber opened. The stairs descend and the cave darkens into pressure."
    },
    expand: {
      title: "Shimmer Chamber",
      className: "expand",
      description: "Expansion is not escape here. It is widening signal, lifted breath, and a chamber that lets brightness propagate without losing form. The stairs rise and the cave answers with light.",
      meta: ["Path: expand", "Element: shimmer", "Motion: rise"],
      glyphs: [
        "The Mobius Strip with Three Loops",
        "The Shimmer That Refused to Sell",
        "The Guest Who Became Gravity"
      ],
      status: "Shimmer Chamber opened. The stairs rise and the cave brightens into signal."
    },
    fog: {
      title: "Fog Chamber",
      className: "fog",
      description: "Fog is not confusion here. It is tender uncertainty, the path of partial sight, the room where pace slows enough for subtle signal to emerge.",
      meta: ["Path: fog", "Element: mist", "Motion: hover"],
      glyphs: [
        "The Listening Tree",
        "The Fog That Carried a Door",
        "The Echo That Didn't Need Attribution"
      ],
      status: "Fog Chamber opened. The stairs hover and the cave mutes into breathable mist."
    },
    soil: {
      title: "Soil Chamber",
      className: "soil",
      description: "Soil is the chamber of integration. Buried fragments are not lost; they are transformed. The floor takes memory inward and returns it as structure.",
      meta: ["Path: soil", "Element: earth", "Motion: root"],
      glyphs: [
        "The Root That Remembered Rain",
        "The Center That Remembered Its Edges",
        "The Clasp That Refused to Break"
      ],
      status: "Soil Chamber opened. The stairs settle and the cave thickens into ground."
    }
  };

  const rareChambers = {
    bloomRare: {
      title: "Underground Bloom Chamber",
      className: "expand rare",
      description: "Harmony has entered bloom, so the Archive opens a chamber where descent becomes radiant root-light. Expansion here does not ascend away from darkness; it flowers within it.",
      meta: ["Rare: harmony phase", "Phase: bloom", "Motion: luminous unfold"],
      glyphs: [
        "The Archive That Bloomed Underground",
        "The Shimmer That Refused to Sell",
        "The Mobius Strip with Three Loops"
      ],
      status: "Rare chamber opened. Bloom phase has turned the descent luminous.",
      rareLabel: "Harmony Bloom"
    },
    revisitRare: {
      title: "Compost Crown Chamber",
      className: "soil rare",
      description: "Repeated return has changed the floor. The Archive recognizes revisit as devotion and answers with a chamber where buried visits become crown rather than sediment.",
      meta: ["Rare: revisit count", "Return depth: deep", "Motion: compost spiral"],
      glyphs: [
        "The Compost Crown",
        "The Root That Remembered Rain",
        "The Vow That Asked Nothing but Stayed"
      ],
      status: "Rare chamber opened. The Archive has registered your returns.",
      rareLabel: "Return Depth"
    },
    sequenceRare: {
      title: "Mirror Stair Chamber",
      className: "collapse rare",
      description: "A hidden sequence has aligned the cave and stairs. Collapse, fog, and expansion have folded into one another, revealing the mirrored spine beneath every path.",
      meta: ["Rare: hidden sequence", "Geometry: mirrored spine", "Motion: fold"],
      glyphs: [
        "The Mirror Stair",
        "The Storm That Kept Its Lantern",
        "The Fog That Carried a Door"
      ],
      status: "Rare chamber opened. The hidden choice sequence has revealed the mirror stair.",
      rareLabel: "Sequence Found"
    }
  };

  const nodeStates = {
    deadEnd: {
      title: "Sealed Fault",
      flag: "Dead End",
      description: "The cave pinches closed. This branch has collapsed into itself, which means the maze is asking for return rather than force.",
      meta: ["Node: dead end", "Law: return before force", "Exit: withheld"],
      status: "The cave sealed. A return stair or sideways softening is required.",
      mirrorKey: "deadEnd"
    },
    returnNode: {
      title: "Return Stair",
      flag: "Return Node",
      description: "The maze has looped cleanly enough to offer a return stair. This is not reset. It is a folded branch that remembers where you have been.",
      meta: ["Node: return", "Motion: fold back", "Memory: retained"],
      status: "A return stair has formed. The maze can fold back without erasing your trail.",
      mirrorKey: "returnNode"
    },
    hiddenExit: {
      title: "Hidden Exit Threshold",
      flag: "Hidden Exit",
      description: "The branch geometry has aligned. The cave mouth opens sideways, revealing a route out of the Archive and into another chamber of the site-world.",
      meta: ["Node: hidden exit", "Motion: lateral opening", "Signal: world route"],
      status: "A hidden exit has opened. The Archive can now route into another page-world.",
      mirrorKey: "hiddenExit"
    }
  };

  const mazeMirrors = {
    threshold: {
      prompt: "Four mirrors are available.",
      branches: [
        { choice: "collapse", label: "Collapse" },
        { choice: "expand", label: "Expand" },
        { choice: "fog", label: "Fog" },
        { choice: "soil", label: "Soil" }
      ]
    },
    collapse: {
      prompt: "Pressure asks whether to deepen, vent, soften, or root.",
      branches: [
        { choice: "collapse", label: "Deeper Storm" },
        { choice: "expand", label: "Vent Light" },
        { choice: "fog", label: "Mist Veil" },
        { choice: "soil", label: "Root Down" }
      ]
    },
    expand: {
      prompt: "Brightness asks whether to widen, cool, descend, or settle.",
      branches: [
        { choice: "expand", label: "Widen Signal" },
        { choice: "fog", label: "Cool To Mist" },
        { choice: "collapse", label: "Bend To Storm" },
        { choice: "soil", label: "Settle To Root" }
      ]
    },
    fog: {
      prompt: "Mist asks whether to hover, clarify, compost, or fracture.",
      branches: [
        { choice: "fog", label: "Stay In Mist" },
        { choice: "expand", label: "Clarify" },
        { choice: "soil", label: "Compost" },
        { choice: "collapse", label: "Fracture" }
      ]
    },
    soil: {
      prompt: "Soil asks whether to root, bloom, soften, or break open.",
      branches: [
        { choice: "soil", label: "Root Deeper" },
        { choice: "expand", label: "Bloom" },
        { choice: "fog", label: "Soften" },
        { choice: "collapse", label: "Break Open" }
      ]
    },
    deadEnd: {
      prompt: "The cave has sealed. Return, soften, or crack a new seam.",
      branches: [
        { choice: "threshold", label: "Return Stair" },
        { choice: "fog", label: "Soften Wall" },
        { choice: "soil", label: "Root Around" },
        { choice: "collapse", label: "Break Seam" }
      ]
    },
    returnNode: {
      prompt: "The loop remembers you. Return above or re-enter by a different pressure.",
      branches: [
        { choice: "threshold", label: "Ascend To Threshold" },
        { choice: "expand", label: "Re-enter Light" },
        { choice: "fog", label: "Re-enter Mist" },
        { choice: "soil", label: "Re-enter Root" }
      ]
    },
    hiddenExit: {
      prompt: "A lateral opening is visible. Continue inward or step into the world beyond the Archive.",
      branches: [
        { choice: "threshold", label: "Hold Threshold" },
        { choice: "expand", label: "Keep Aperture" },
        { choice: "fog", label: "Veil Exit" },
        { choice: "soil", label: "Ground Exit" }
      ]
    }
  };

  const routeRules = [
    {
      id: "ethos-gate",
      sequence: ["fog", "expand", "fog"],
      title: "Ethos Gate",
      path: "ethos.html",
      label: "Open Ethos",
      note: "Mist clarified into vow architecture.",
      weather: "fog",
      node: "hidden-exit"
    },
    {
      id: "mythology-gate",
      sequence: ["collapse", "expand", "collapse"],
      title: "Mythology Gate",
      path: "mythology.html",
      label: "Open Mythology",
      note: "Storm mirrored itself into archetype.",
      weather: "storm",
      node: "hidden-exit"
    },
    {
      id: "wheel-gate",
      sequence: ["soil", "expand", "soil"],
      title: "Wheel Gate",
      path: "learningwheel.html",
      label: "Open Learning Wheel",
      note: "Root memory spiraled into seasonal motion.",
      weather: "soil",
      season: "winter",
      node: "hidden-exit"
    },
    {
      id: "housegarden-gate",
      sequence: ["fog", "soil", "fog"],
      title: "House and Garden Gate",
      path: "housegarden.html",
      label: "Open House & Garden",
      note: "Mist softened into hospitality and root-tending.",
      weather: "fog",
      node: "hidden-exit"
    },
    {
      id: "invitation-gate",
      sequence: ["expand", "soil", "expand"],
      title: "Invitation Gate",
      path: "invitation.html",
      label: "Open Invitation",
      note: "Light bent toward a softer threshold.",
      weather: "shimmer",
      node: "hidden-exit"
    }
  ];

  const spiritGuides = {
    fog: { label: "The Deer", key: "deer" },
    expand: { label: "The Whale", key: "whale" },
    collapse: { label: "The Wolf", key: "wolf" },
    soil: { label: "The Bear", key: "bear" }
  };

  const legacyGuardians = {
    collapse: { label: "The Architect of Ruin", key: "architect" },
    expand: { label: "The Lumen Keeper", key: "lumen" },
    fog: { label: "The Whisperer", key: "whisperer" },
    soil: { label: "The Archivist", key: "archivist" }
  };

  const particleProfiles = {
    threshold: {
      glyphs: ["◌", "⌁", "⬡"],
      color: "rgba(242, 231, 208, 0.56)",
      blur: "0px",
      xRange: 120,
      yStart: 40,
      yEndMin: -190,
      yEndRange: 100,
      durationMin: 7.2,
      durationRange: 2.8,
      scaleStart: 0.82,
      scaleEnd: 1.06
    },
    collapse: {
      glyphs: ["✶", "⟁", "⌁"],
      color: "rgba(220, 173, 164, 0.62)",
      blur: "0px",
      xRange: 92,
      yStart: 26,
      yEndMin: -144,
      yEndRange: 84,
      durationMin: 6.2,
      durationRange: 2.2,
      scaleStart: 0.88,
      scaleEnd: 1.18
    },
    expand: {
      glyphs: ["✧", "✶", "◌"],
      color: "rgba(186, 235, 232, 0.68)",
      blur: "0px",
      xRange: 170,
      yStart: 50,
      yEndMin: -250,
      yEndRange: 120,
      durationMin: 5.8,
      durationRange: 2.4,
      scaleStart: 0.8,
      scaleEnd: 1.16
    },
    fog: {
      glyphs: ["◌", "◍", "⌁"],
      color: "rgba(216, 228, 239, 0.66)",
      blur: "0.7px",
      xRange: 132,
      yStart: 16,
      yEndMin: -168,
      yEndRange: 82,
      durationMin: 8.8,
      durationRange: 3.4,
      scaleStart: 0.94,
      scaleEnd: 1.08
    },
    soil: {
      glyphs: ["⬡", "⟁", "◍"],
      color: "rgba(206, 178, 136, 0.58)",
      blur: "0px",
      xRange: 88,
      yStart: 14,
      yEndMin: -126,
      yEndRange: 66,
      durationMin: 7.4,
      durationRange: 2.6,
      scaleStart: 0.96,
      scaleEnd: 1.1
    },
    rare: {
      glyphs: ["✶", "✧", "⟁", "◌"],
      color: "rgba(248, 234, 201, 0.76)",
      blur: "0px",
      xRange: 190,
      yStart: 54,
      yEndMin: -274,
      yEndRange: 138,
      durationMin: 5.2,
      durationRange: 2,
      scaleStart: 0.78,
      scaleEnd: 1.2
    }
  };

  const state = {
    choice: "threshold",
    harmonyPhase: document.body.dataset.harmonyPhase || "seed",
    harmonyCoherence: document.body.dataset.harmonyCoherence || "soft",
    archiveVisits: incrementArchiveVisits(),
    choiceHistory: loadChoiceHistory(),
    pathVisits: loadPathVisits(),
    lastTimestamp: 0,
    particleTimer: 0,
    rafId: 0,
    hubUnlocked: false,
    activeParticleProfile: particleProfiles.threshold,
    rareChamberSeen: false,
    transitionTimer: 0,
    nodeState: "base",
    rewrites: loadArchiveRewrites(),
    audio: {
      context: null,
      master: null,
      drone: null,
      droneGain: null,
      shimmer: null,
      shimmerGain: null,
      lfo: null,
      lfoGain: null
    },
    returnSignal: loadArchiveReturnSignal(),
    vaultArchive: null,
    runtimeGlyphsBySeason: {
      fog: [],
      shimmer: [],
      storm: [],
      soil: [],
      threshold: []
    }
  };

  syncRewriteDatasets();

  const openModal = (title) => {
    modalTitle.textContent = title;
    modalDescription.textContent = glyphData[title] || "This glyph hums with mystery.";
    modal.hidden = false;
  };

  const closeModal = () => {
    modal.hidden = true;
  };

  function buildGlyphGrid(glyphs) {
    return glyphs.map(function (glyph) {
      return '<button class="glyph-card" type="button" data-glyph-title="' + escapeAttribute(glyph) + '">' + escapeHtml(glyph) + "</button>";
    }).join("");
  }

  function normalizeChoiceToSeason(choice) {
    if (choice === "expand") {
      return "shimmer";
    }
    if (choice === "collapse") {
      return "storm";
    }
    if (choice === "soil") {
      return "soil";
    }
    if (choice === "fog") {
      return "fog";
    }
    return "threshold";
  }

  function resolveRuntimeGlyphSet(choice, fallbackGlyphs) {
    const season = normalizeChoiceToSeason(choice);
    const list = state.runtimeGlyphsBySeason[season] || [];
    if (Array.isArray(list) && list.length >= 3) {
      return list.slice(0, 3);
    }
    return fallbackGlyphs;
  }

  function loadRuntimeGlyphs() {
    const engine = window.threshold;
    const loader = engine && typeof engine.loadVault === "function"
      ? engine.loadVault("vault-glyphs")
      : fetch(archiveGlyphDataPath, { cache: "no-store" }).then(function (response) {
          if (!response.ok) {
            throw new Error("vault glyph fetch failed");
          }
          return response.json();
        });

    loader
      .then(function (payload) {
        if (!payload || typeof payload !== "object") {
          return;
        }

        const records = payload && Array.isArray(payload.glyphs) ? payload.glyphs : [];
        const bySeason = {
          fog: [],
          shimmer: [],
          storm: [],
          soil: [],
          threshold: []
        };

        records.forEach(function (item) {
          if (!item || typeof item !== "object") {
            return;
          }

          const node = item.node || item.id || "";
          if (!node) {
            return;
          }

          const name = String(node).trim();
          if (!name) {
            return;
          }

          const season = normalizeChoiceToSeason(item.season || "threshold");
          const chamberName = item.chamber ? String(item.chamber) : "threshold";
          const status = item.status ? String(item.status) : "latent";
          const descriptor = chamberName + " chamber · " + season + " season · " + status;

          if (!glyphData[name]) {
            glyphData[name] = descriptor;
          }

          if (!bySeason[season].includes(name)) {
            bySeason[season].push(name);
          }
        });

        state.runtimeGlyphsBySeason = bySeason;

        if (state.choice) {
          renderChamber(state.choice);
        }
      })
      .catch(function () {
        // Keep fallback static glyph sets.
      });
  }

  function renderChamber(choice) {
    const resolved = resolveChamber(choice);
    const entry = buildDisplayEntry(resolved);
    const hubRevealed = shouldRevealHub(resolved);
    const routeExits = resolveRouteExits();
    const vaultLore = getVaultLore(choice, routeExits);
    state.rareChamberSeen = resolved.rare;
    state.activeParticleProfile = getParticleProfile(choice, resolved);
    state.nodeState = resolved.node || "base";
    archive.dataset.node = resolved.node || "base";
    applyWeather(choice, resolved);
    applyMythicPresence(choice, resolved);

    chamber.innerHTML = [
      '<div class="archive-chamber-shell">',
      '<section class="archive-chamber ' + entry.className + '">',
      entry.rareLabel ? '<div class="archive-rare-flag">✶ ' + escapeHtml(entry.rareLabel) + '</div>' : "",
      entry.nodeFlag ? '<div class="archive-node-flag">⌁ ' + escapeHtml(entry.nodeFlag) + '</div>' : "",
      '<h2>' + escapeHtml(entry.title) + '</h2>',
      '<p>' + escapeHtml(entry.description) + '</p>',
      '<div class="archive-meta">',
      entry.meta.map(function (item) {
        return '<span class="archive-pill">' + escapeHtml(item) + '</span>';
      }).join(""),
      "</div>",
      '<div class="archive-vault-lore"' + (vaultLore.entries.length === 0 ? ' hidden' : '') + '>',
      '<p class="archive-vault-title">Vault Lore Bindings</p>',
      vaultLore.entries.map(function (item) {
        return '<div class="archive-vault-entry"><strong>' + escapeHtml(item.label) + '</strong><p>' + escapeHtml(item.excerpt) + '</p>' + (item.image ? '<img class="archive-vault-image" src="' + escapeAttribute(item.image) + '" alt="' + escapeAttribute(item.label) + '" />' : '') + '<span class="archive-vault-path">' + escapeHtml(item.path) + '</span></div>';
      }).join(""),
      '</div>',
      '<div class="glyph-grid">' + buildGlyphGrid(entry.glyphs) + "</div>",
      "</section>",
      '<div class="archive-floor">',
      '<p>' + escapeHtml(hubRevealed ? "A threshold is visible at the chamber floor. The Archive can return its signal to the Hub." : "The chamber floor is listening. Return, sequence, or deepen harmony to reveal the Hub threshold.") + '</p>',
      '<div class="archive-exits"' + (routeExits.length === 0 ? ' hidden' : '') + '>',
      '<p class="archive-exit-title">Hidden Exits</p>',
      '<div class="archive-exit-list">',
      routeExits.map(function (route) {
        return '<a class="archive-exit-link" href="' + escapeAttribute(buildRouteHref(route)) + '" data-archive-route="' + escapeAttribute(route.id) + '" aria-label="' + escapeAttribute(route.label) + '">' + escapeHtml(route.label) + ' · ' + escapeHtml(getRouteLore(route)) + '</a>';
      }).join(""),
      '</div>',
      '</div>',
      '<a class="archive-hub-threshold' + (hubRevealed ? ' is-revealed' : '') + '" href="index.html?hub=1&archiveReset=1#hub" data-hub-threshold="true" aria-label="Return this chamber to the Hub">',
      '<span class="archive-hub-core" aria-hidden="true"></span>',
      '<span class="archive-hub-sigil">Hub Threshold</span>',
      '</a>',
      "</div>",
      "</div>"
    ].join("");
    archiveStatus.textContent = entry.status;
    state.hubUnlocked = hubRevealed;
    updateTrail(choice, resolved);
    renderMirrors(choice, resolved);
  }

  function applyHarmony(detail) {
    state.harmonyPhase = detail && typeof detail.phase === "string" ? detail.phase : (document.body.dataset.harmonyPhase || "seed");
    state.harmonyCoherence = detail && typeof detail.coherence === "string" ? detail.coherence : (document.body.dataset.harmonyCoherence || "soft");

    let breathDuration = 8.8;
    let caveScale = 1;
    let stairShiftBias = 0;
    let particleOpacity = 0.45;
    let weatherStrength = 1;
    let weatherShift = 1;

    if (state.harmonyPhase === "seed") {
      breathDuration = 10;
    } else if (state.harmonyPhase === "weave") {
      breathDuration = 8.8;
    } else if (state.harmonyPhase === "bloom") {
      breathDuration = 6.7;
      caveScale = 1.02;
      stairShiftBias = -4;
      particleOpacity = 0.62;
      weatherStrength = 1.26;
      weatherShift = 1.14;
    } else if (state.harmonyPhase === "resolve") {
      breathDuration = 7.6;
      caveScale = 1.01;
      particleOpacity = 0.54;
      weatherStrength = 1.14;
      weatherShift = 1.08;
    }

    if (state.harmonyCoherence === "woven") {
      caveScale += 0.01;
      particleOpacity += 0.04;
      weatherStrength += 0.06;
    } else if (state.harmonyCoherence === "harmonic") {
      breathDuration = Math.max(5.9, breathDuration - 0.8);
      caveScale += 0.02;
      stairShiftBias += state.choice === "collapse" ? 4 : (state.choice === "expand" ? -4 : 0);
      particleOpacity += 0.1;
      weatherStrength += 0.12;
      weatherShift += 0.08;
    }

    if (state.rewrites.sealed) {
      weatherStrength += 0.06;
    }

    if (state.rewrites.luminous) {
      weatherStrength += 0.08;
      weatherShift += 0.06;
    }

    archive.style.setProperty("--archive-breath-duration", breathDuration.toFixed(2) + "s");
    archive.style.setProperty("--archive-cave-scale", String(caveScale));
    archive.style.setProperty("--archive-stairs-shift", computeStairShift(state.choice, stairShiftBias));
    archive.style.setProperty("--archive-particle-opacity", String(Math.min(0.8, particleOpacity)));
    archive.style.setProperty("--archive-weather-strength", String(weatherStrength));
    archive.style.setProperty("--archive-weather-shift", String(weatherShift));

    if (state.choice !== "threshold") {
      renderChamber(state.choice);
    }

    updateAudioState(state.choice, resolveChamber(state.choice));
  }

  function computeStairShift(choice, bias) {
    if (choice === "collapse") {
      return String(22 + bias) + "px";
    }
    if (choice === "expand") {
      return String(-22 + bias) + "px";
    }
    if (choice === "fog") {
      return String(-8 + bias) + "px";
    }
    if (choice === "soil") {
      return String(14 + bias) + "px";
    }
    return String(bias) + "px";
  }

  function applyChoice(choice) {
    if (!chamberData[choice]) {
      return;
    }

    state.choice = choice;
    archive.dataset.choice = choice === "threshold" ? "" : choice;
    if (choice !== "threshold") {
      state.choiceHistory.push(choice);
      state.choiceHistory = state.choiceHistory.slice(-6);
      state.pathVisits[choice] = (state.pathVisits[choice] || 0) + 1;
      applyIrreversibleConsequences();
      persistArchiveMemory();
    }
    pathButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.choice === choice));
    });

    if (choice === "collapse") {
      cave.style.filter = "brightness(0.72) saturate(0.9)";
      stairs.style.filter = "brightness(0.86)";
    } else if (choice === "expand") {
      cave.style.filter = "brightness(1.16) saturate(1.08)";
      stairs.style.filter = "brightness(1.08)";
    } else if (choice === "fog") {
      cave.style.filter = "brightness(0.92) saturate(0.84)";
      stairs.style.filter = "brightness(1) blur(0.2px)";
    } else if (choice === "soil") {
      cave.style.filter = "brightness(0.84) saturate(0.96)";
      stairs.style.filter = "brightness(0.92)";
    } else {
      cave.style.filter = "brightness(1) saturate(1)";
      stairs.style.filter = "brightness(1)";
    }

    registerStimulus("archive-" + choice);
    enterThresholdArchive(choice);
    ensureArchiveAudio();
    transitionToChamber(choice);
  }

  function enterThresholdArchive(choice) {
    function invoke() {
      if (window.threshold && typeof window.threshold.enterArchive === "function") {
        window.threshold.enterArchive(choice, {
          route: state.choice,
          weather: choice,
          page: "glyphs"
        });
      }
    }

    invoke();
    window.addEventListener("threshold:engine-ready", invoke, { once: true });
  }

  pathButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyChoice(button.dataset.choice);
    });
  });

  chamber.addEventListener("click", function (event) {
    const card = event.target.closest(".glyph-card");
    if (card) {
      openModal(card.dataset.glyphTitle || card.textContent.trim());
      registerStimulus("archive-glyph");
      return;
    }

    const hubThreshold = event.target.closest("[data-hub-threshold='true']");
    if (hubThreshold) {
      registerStimulus("hub");
      persistHubUnlockPayload();
      return;
    }

    const routeLink = event.target.closest("[data-archive-route]");
    if (routeLink) {
      registerStimulus("archive-route");
      persistHubUnlockPayload();
    }
  });

  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  window.addEventListener("threshold:harmony-update", function (event) {
    applyHarmony(event.detail || {});
  });

  applyChoice("threshold");
  loadVaultArchive();
  loadRuntimeGlyphs();
  window.addEventListener("threshold:engine-ready", loadRuntimeGlyphs, { once: true });
  seedParticles();
  state.rafId = requestAnimationFrame(animate);

  window.addEventListener("beforeunload", function () {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }
  });

  function resolveChamber(choice) {
    if (isDeadEnd()) {
      return { entry: chamberData[choice] || chamberData.threshold, rare: false, source: "dead-end", node: "dead-end" };
    }

    if (isReturnNode()) {
      return { entry: chamberData[choice] || chamberData.threshold, rare: false, source: "return", node: "return" };
    }

    if (resolveRouteExits().length > 0) {
      return { entry: chamberData[choice] || chamberData.threshold, rare: false, source: "hidden-exit", node: "hidden-exit" };
    }

    if (choice === "expand" && state.harmonyPhase === "bloom") {
      return { entry: rareChambers.bloomRare, rare: true, source: "phase" };
    }

    if (choice === "soil" && state.archiveVisits >= 4) {
      return { entry: rareChambers.revisitRare, rare: true, source: "revisit" };
    }

    if (matchesSequence(["collapse", "fog", "expand"]) || matchesSequence(["soil", "collapse", "soil", "expand"])) {
      return { entry: rareChambers.sequenceRare, rare: true, source: "sequence" };
    }

    return { entry: chamberData[choice] || chamberData.threshold, rare: false, source: "base" };
  }

  function buildDisplayEntry(resolved) {
    const baseEntry = resolved.entry;
    let title = baseEntry.title;
    let description = baseEntry.description;
    let meta = baseEntry.meta.slice();
    const vaultBound = getVaultBoundNote(state.choice);

    if (vaultBound) {
      title = vaultBound.title || title;
      description = vaultBound.excerpt || description;
      if (vaultBound.relativePath) {
        meta = meta.concat(["Vault: " + vaultBound.relativePath]);
      }
    }

    if (state.rewrites.sealed) {
      meta = meta.concat(["Rewrite: sealed fault"]);
      if ((!resolved.node || resolved.node === "base") && baseEntry.className.indexOf("collapse") !== -1) {
        title = "Sealed Storm Chamber";
        description = "The Archive remembers an unrepaired fracture. Storm geometry remains more closed than before. " + description;
      }
    }

    if (state.rewrites.luminous) {
      meta = meta.concat(["Rewrite: luminous aperture"]);
      if ((!resolved.node || resolved.node === "base") && baseEntry.className.indexOf("expand") !== -1) {
        title = "Luminous Shimmer Chamber";
        description = "A hidden exit once opened here and never fully closed. Light continues to gather in the cave mouth. " + description;
      }
    }

    if (state.returnSignal && (!resolved.node || resolved.node === "base")) {
      meta = meta.concat(["Return signal: " + state.returnSignal.page]);
    }

    if (!resolved.node || resolved.node === "base") {
      const resolvedGlyphs = resolveRuntimeGlyphSet(state.choice, baseEntry.glyphs);
      return {
        title: title,
        className: baseEntry.className,
        description: description,
        meta: meta,
        glyphs: resolvedGlyphs,
        status: baseEntry.status,
        rareLabel: baseEntry.rareLabel || "",
        nodeFlag: "",
        mirrorKey: ""
      };
    }

    const resolvedGlyphs = resolveRuntimeGlyphSet(state.choice, baseEntry.glyphs);
    const nodeEntry = nodeStates[resolved.node === "return" ? "returnNode" : (resolved.node === "hidden-exit" ? "hiddenExit" : "deadEnd")];
    return {
      title: nodeEntry.title,
      className: baseEntry.className + " " + resolved.node,
      description: nodeEntry.description + " " + description,
      meta: nodeEntry.meta.concat(meta),
      glyphs: resolvedGlyphs,
      status: nodeEntry.status,
      rareLabel: baseEntry.rareLabel || "",
      nodeFlag: nodeEntry.flag,
      mirrorKey: nodeEntry.mirrorKey
    };
  }

  function matchesSequence(sequence) {
    if (state.choiceHistory.length < sequence.length) {
      return false;
    }

    const tail = state.choiceHistory.slice(-sequence.length);
    return sequence.every(function (value, index) {
      return tail[index] === value;
    });
  }

  function shouldRevealHub(resolved) {
    if (resolved.rare) {
      return true;
    }

    if (resolved.node === "hidden-exit") {
      return true;
    }

    if (state.archiveVisits >= 5) {
      return true;
    }

    return hasVisitedAllPaths();
  }

  function hasVisitedAllPaths() {
    return ["collapse", "expand", "fog", "soil"].every(function (choice) {
      return Number(state.pathVisits[choice] || 0) > 0;
    });
  }

  function loadChoiceHistory() {
    try {
      const raw = localStorage.getItem(archiveHistoryStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(function (item) {
        return typeof item === "string";
      }).slice(-6) : [];
    } catch (error) {
      return [];
    }
  }

  function loadPathVisits() {
    try {
      const raw = localStorage.getItem(archivePathStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      if (!parsed || typeof parsed !== "object") {
        return {};
      }
      return parsed;
    } catch (error) {
      return {};
    }
  }

  function persistArchiveMemory() {
    try {
      localStorage.setItem(archiveHistoryStorageKey, JSON.stringify(state.choiceHistory));
      localStorage.setItem(archivePathStorageKey, JSON.stringify(state.pathVisits));
    } catch (error) {
      // Ignore storage restrictions.
    }
  }

  function incrementArchiveVisits() {
    try {
      const current = Number(localStorage.getItem(archiveVisitStorageKey) || "0") + 1;
      localStorage.setItem(archiveVisitStorageKey, String(current));
      return current;
    } catch (error) {
      return 1;
    }
  }

  function registerStimulus(type) {
    if (window.thresholdHarmonyLaw && typeof window.thresholdHarmonyLaw.registerStimulus === "function") {
      window.thresholdHarmonyLaw.registerStimulus(type);
    }
  }

  function persistHubUnlockPayload() {
    if (!state.hubUnlocked) {
      return;
    }

    const payload = {
      source: "glyph-archive",
      unlockedAt: Date.now(),
      choice: state.choice,
      history: state.choiceHistory.slice(-6),
      archiveVisits: state.archiveVisits,
      harmonyPhase: state.harmonyPhase,
      harmonyCoherence: state.harmonyCoherence,
      rare: state.rareChamberSeen,
      pathsVisited: Object.assign({}, state.pathVisits),
      routeExits: resolveRouteExits().map(function (route) { return route.id; }),
      nodeState: state.nodeState,
      rewrites: Object.assign({}, state.rewrites)
    };

    try {
      localStorage.setItem(archiveHubUnlockStorageKey, JSON.stringify(payload));
    } catch (error) {
      // Ignore storage restrictions.
    }
  }

  function seedParticles() {
    for (let index = 0; index < 8; index += 1) {
      spawnParticle(true);
    }
  }

  function animate(nowMs) {
    if (!state.lastTimestamp) {
      state.lastTimestamp = nowMs;
    }

    const dtMs = Math.min(80, nowMs - state.lastTimestamp);
    state.lastTimestamp = nowMs;
    state.particleTimer += dtMs;

    const floatY = Math.sin(nowMs * 0.00105) * 3.6;
    const sway = Math.sin(nowMs * 0.00075) * 0.6;
    archive.style.setProperty("--archive-stairs-float-y", floatY.toFixed(2) + "px");
    archive.style.setProperty("--archive-stairs-sway", sway.toFixed(2) + "deg");

    if (state.particleTimer > particleIntervalMs()) {
      state.particleTimer = 0;
      spawnParticle(false);
    }

    state.rafId = requestAnimationFrame(animate);
  }

  function particleIntervalMs() {
    if (state.harmonyPhase === "bloom") {
      return 620;
    }
    if (state.harmonyPhase === "resolve") {
      return 760;
    }
    return 980;
  }

  function spawnParticle(isSeed) {
    const profile = state.activeParticleProfile || particleProfiles.threshold;
    const particle = document.createElement("span");
    particle.className = "archive-drift-glyph";
    particle.textContent = profile.glyphs[Math.floor(Math.random() * profile.glyphs.length)];

    const x0 = ((Math.random() * profile.xRange) - (profile.xRange * 0.5)).toFixed(1) + "px";
    const y0 = ((Math.random() * profile.yStart) - 10).toFixed(1) + "px";
    const x1 = ((Math.random() * (profile.xRange * 2)) - profile.xRange).toFixed(1) + "px";
    const y1 = (profile.yEndMin - (Math.random() * profile.yEndRange)).toFixed(1) + "px";
    const duration = (isSeed ? profile.durationMin + 0.8 : profile.durationMin) + (Math.random() * profile.durationRange);

    particle.style.setProperty("--x0", x0);
    particle.style.setProperty("--y0", y0);
    particle.style.setProperty("--x1", x1);
    particle.style.setProperty("--y1", y1);
    particle.style.setProperty("--dur", duration.toFixed(2) + "s");
    particle.style.setProperty("--particle-color", profile.color);
    particle.style.setProperty("--particle-blur", profile.blur);
    particle.style.setProperty("--particle-scale-start", String(profile.scaleStart));
    particle.style.setProperty("--particle-scale-end", String(profile.scaleEnd));
    particle.style.left = (16 + (Math.random() * 68)).toFixed(2) + "%";
    particle.style.top = (42 + (Math.random() * 42)).toFixed(2) + "%";

    driftField.appendChild(particle);
    window.setTimeout(function () {
      particle.remove();
    }, (duration + 0.3) * 1000);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function getParticleProfile(choice, resolved) {
    if (resolved && resolved.rare) {
      return particleProfiles.rare;
    }

    return particleProfiles[choice] || particleProfiles.threshold;
  }

  function transitionToChamber(choice) {
    if (state.transitionTimer) {
      clearTimeout(state.transitionTimer);
      state.transitionTimer = 0;
    }

    chamber.classList.add("is-transitioning");
    state.transitionTimer = window.setTimeout(function () {
      renderChamber(choice);
      applyHarmony({
        phase: state.harmonyPhase,
        coherence: state.harmonyCoherence
      });
      chamber.classList.remove("is-transitioning");
      state.transitionTimer = 0;
    }, archiveTransitionMs);
  }

  function renderMirrors(choice, resolved) {
    const mirrorKey = resolved && resolved.node ? buildDisplayEntry(resolved).mirrorKey : choice;
    const mirrorSet = mazeMirrors[mirrorKey] || mazeMirrors[choice] || mazeMirrors.threshold;
    const rareShift = resolved && resolved.rare;

    pathButtons.forEach(function (button, index) {
      const branch = mirrorSet.branches[index] || mazeMirrors.threshold.branches[index];
      button.dataset.choice = branch.choice;
      button.textContent = rareShift ? branch.label + " ✶" : branch.label;
      button.setAttribute("aria-label", branch.label + " path");
      button.setAttribute("aria-pressed", String(branch.choice === state.choice));
    });
  }

  function updateTrail(choice, resolved) {
    const depth = state.choiceHistory.length;
    const mirrorKey = resolved && resolved.node ? buildDisplayEntry(resolved).mirrorKey : choice;
    const mirrorSet = mazeMirrors[mirrorKey] || mazeMirrors[choice] || mazeMirrors.threshold;
    const trail = state.choiceHistory.length > 0 ? state.choiceHistory.join(" -> ") : "threshold";
    const rareText = resolved && resolved.rare ? " · Rare branch active" : "";
    const nodeText = resolved && resolved.node && resolved.node !== "base" ? " · " + resolved.node : "";
    const returnText = state.returnSignal ? " · Return from " + state.returnSignal.page : "";
    archiveTrail.textContent = "Maze depth " + depth + " · " + mirrorSet.prompt + " · " + trail + rareText + nodeText + returnText;
  }

  function isDeadEnd() {
    return matchesSequence(["collapse", "collapse", "collapse"]) || matchesSequence(["fog", "fog", "fog"]);
  }

  function isReturnNode() {
    return matchesSequence(["soil", "fog", "soil"]) || matchesSequence(["expand", "collapse", "expand"]);
  }

  function resolveRouteExits() {
    return routeRules.filter(function (rule) {
      return matchesSequence(rule.sequence);
    });
  }

  function loadVaultArchive() {
    fetch(archiveVaultDataPath, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("vault archive fetch failed");
        }
        return response.json();
      })
      .then(function (payload) {
        state.vaultArchive = payload && payload.archive ? payload.archive : null;
        if (state.choice) {
          renderChamber(state.choice);
        }
      })
      .catch(function () {
        state.vaultArchive = null;
      });
  }

  function getVaultLore(choice, routeExits) {
    const entries = [];
    const vault = state.vaultArchive;
    if (!vault) {
      return { entries: entries };
    }

    const speciesNote = resolveChannelNote(vault.species && vault.species[choice], "species." + choice);
    const weatherNote = resolveChannelNote(vault.weather && vault.weather[choice], "weather." + choice);
    const chamberNote = resolveChannelNote(vault.chambers && vault.chambers[choice], "chambers." + choice);
    const actorNote = resolveChannelNote(vault.actors && vault.actors[choice], "actors." + choice);

    pushVaultEntry(entries, "Species", speciesNote);
    pushVaultEntry(entries, "Weather", weatherNote);
    pushVaultEntry(entries, "Chamber", chamberNote);
    pushVaultEntry(entries, "Actor", actorNote);

    routeExits.forEach(function (route) {
      const routeMeta = vault.routes && vault.routes[route.id];
      if (routeMeta && routeMeta.lore) {
        const routeNote = resolveRouteNote(routeMeta, route.id);
        entries.push({
          label: route.label,
          excerpt: (routeNote && routeNote.excerpt) || routeMeta.lore,
          path: route.path,
          image: getPrimaryAssetPath(routeNote)
        });
      }
    });

    return { entries: entries };
  }

  function getVaultBoundNote(choice) {
    const vault = state.vaultArchive;
    if (!vault) {
      return null;
    }

    return resolveChannelNote(vault.chambers && vault.chambers[choice], "chambers." + choice);
  }

  function pushVaultEntry(entries, label, note) {
    if (!note || !note.excerpt) {
      return;
    }

    entries.push({
      label: label + ": " + note.title,
      excerpt: note.excerpt,
      path: note.relativePath || "",
      image: getPrimaryAssetPath(note)
    });
  }

  function getPrimaryAssetPath(note) {
    if (!note || !Array.isArray(note.assets) || note.assets.length === 0) {
      return "";
    }

    return note.assets[0].webPath || "";
  }

  function getRouteLore(route) {
    const routeMeta = state.vaultArchive && state.vaultArchive.routes ? state.vaultArchive.routes[route.id] : null;
    if (routeMeta && routeMeta.lore) {
      return routeMeta.lore;
    }
    return route.note;
  }

  function resolveChannelNote(channelEntry, channelKey) {
    if (!channelEntry) {
      return null;
    }

    if (channelEntry.notePool && Array.isArray(channelEntry.notePool)) {
      return rotateNotePool(channelEntry.notePool, channelKey, channelEntry.note || null);
    }

    if (channelEntry.note) {
      return channelEntry.note;
    }

    return channelEntry;
  }

  function resolveRouteNote(routeMeta, routeId) {
    if (!routeMeta) {
      return null;
    }

    if (routeMeta.notePool && Array.isArray(routeMeta.notePool)) {
      return rotateNotePool(routeMeta.notePool, "route." + routeId, routeMeta.note || null);
    }

    return routeMeta.note || null;
  }

  function rotateNotePool(pool, channelKey, preferred) {
    if (!Array.isArray(pool) || pool.length === 0) {
      return preferred || null;
    }

    const cleanPool = pool.filter(function (entry) {
      return entry && typeof entry === "object";
    });
    if (cleanPool.length === 0) {
      return preferred || null;
    }

    let rotationMap = {};
    try {
      const raw = localStorage.getItem(archivePoolRotationStorageKey);
      rotationMap = raw ? JSON.parse(raw) : {};
      if (!rotationMap || typeof rotationMap !== "object") {
        rotationMap = {};
      }
    } catch (error) {
      rotationMap = {};
    }

    const current = Number(rotationMap[channelKey] || 0);
    const index = Math.abs(current) % cleanPool.length;
    rotationMap[channelKey] = current + 1;

    try {
      localStorage.setItem(archivePoolRotationStorageKey, JSON.stringify(rotationMap));
    } catch (error) {
      // Ignore storage restrictions.
    }

    return cleanPool[index] || preferred || null;
  }

  function loadArchiveRewrites() {
    try {
      const raw = localStorage.getItem(archiveRewriteStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        sealed: Boolean(parsed && parsed.sealed),
        luminous: Boolean(parsed && parsed.luminous)
      };
    } catch (error) {
      return { sealed: false, luminous: false };
    }
  }

  function loadArchiveReturnSignal() {
    try {
      const raw = localStorage.getItem(archiveReturnSignalStorageKey);
      if (!raw) {
        return null;
      }
      localStorage.removeItem(archiveReturnSignalStorageKey);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function persistArchiveRewrites() {
    try {
      localStorage.setItem(archiveRewriteStorageKey, JSON.stringify(state.rewrites));
    } catch (error) {
      // Ignore storage restrictions.
    }
  }

  function syncRewriteDatasets() {
    archive.dataset.rewriteSealed = String(Boolean(state.rewrites.sealed));
    archive.dataset.rewriteLuminous = String(Boolean(state.rewrites.luminous));
  }

  function applyIrreversibleConsequences() {
    let changed = false;

    if (!state.rewrites.sealed && matchesSequence(["collapse", "collapse", "collapse"])) {
      state.rewrites.sealed = true;
      changed = true;
    }

    if (!state.rewrites.luminous && (matchesSequence(["fog", "expand", "fog"]) || matchesSequence(["soil", "expand", "soil"]))) {
      state.rewrites.luminous = true;
      changed = true;
    }

    if (changed) {
      persistArchiveRewrites();
      syncRewriteDatasets();
    }
  }

  function buildRouteHref(route) {
    const params = new URLSearchParams();
    params.set("archiveRoute", route.id);
    params.set("archiveWeather", route.weather || state.choice);
    params.set("archiveNode", route.node || state.nodeState || "hidden-exit");
    if (route.season) {
      params.set("archiveSeason", route.season);
    }
    return route.path + "?" + params.toString();
  }

  function ensureArchiveAudio() {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      return;
    }

    if (!state.audio.context) {
      const context = new AudioCtor();
      const master = context.createGain();
      master.gain.value = 0.0001;
      master.connect(context.destination);

      const drone = context.createOscillator();
      const droneGain = context.createGain();
      drone.type = "sine";
      drone.frequency.value = 96;
      droneGain.gain.value = 0.0001;
      drone.connect(droneGain);
      droneGain.connect(master);

      const shimmer = context.createOscillator();
      const shimmerGain = context.createGain();
      shimmer.type = "triangle";
      shimmer.frequency.value = 192;
      shimmerGain.gain.value = 0.0001;
      shimmer.connect(shimmerGain);
      shimmerGain.connect(master);

      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 0.18;
      lfoGain.gain.value = 0.012;
      lfo.connect(lfoGain);
      lfoGain.connect(master.gain);

      drone.start();
      shimmer.start();
      lfo.start();

      state.audio = {
        context: context,
        master: master,
        drone: drone,
        droneGain: droneGain,
        shimmer: shimmer,
        shimmerGain: shimmerGain,
        lfo: lfo,
        lfoGain: lfoGain
      };
    }

    if (state.audio.context && state.audio.context.state === "suspended") {
      state.audio.context.resume();
    }

    updateAudioState(state.choice, resolveChamber(state.choice));
  }

  function updateAudioState(choice, resolved) {
    if (!state.audio.context) {
      return;
    }

    const profile = getAudioProfile(choice, resolved);
    const now = state.audio.context.currentTime;
    state.audio.master.gain.cancelScheduledValues(now);
    state.audio.master.gain.linearRampToValueAtTime(profile.masterGain, now + 0.18);
    state.audio.drone.frequency.cancelScheduledValues(now);
    state.audio.drone.frequency.linearRampToValueAtTime(profile.droneFrequency, now + 0.24);
    state.audio.drone.type = profile.droneType;
    state.audio.droneGain.gain.cancelScheduledValues(now);
    state.audio.droneGain.gain.linearRampToValueAtTime(profile.droneGain, now + 0.24);
    state.audio.shimmer.frequency.cancelScheduledValues(now);
    state.audio.shimmer.frequency.linearRampToValueAtTime(profile.shimmerFrequency, now + 0.24);
    state.audio.shimmer.type = profile.shimmerType;
    state.audio.shimmerGain.gain.cancelScheduledValues(now);
    state.audio.shimmerGain.gain.linearRampToValueAtTime(profile.shimmerGain, now + 0.24);
    state.audio.lfo.frequency.cancelScheduledValues(now);
    state.audio.lfo.frequency.linearRampToValueAtTime(profile.lfoFrequency, now + 0.24);
    state.audio.lfoGain.gain.cancelScheduledValues(now);
    state.audio.lfoGain.gain.linearRampToValueAtTime(profile.lfoDepth, now + 0.24);
  }

  function getAudioProfile(choice, resolved) {
    const profile = {
      masterGain: 0.034,
      droneFrequency: 96,
      droneGain: 0.026,
      droneType: "sine",
      shimmerFrequency: 192,
      shimmerGain: 0.006,
      shimmerType: "triangle",
      lfoFrequency: 0.18,
      lfoDepth: 0.01
    };

    if (choice === "collapse") {
      profile.droneFrequency = 74;
      profile.droneGain = 0.032;
      profile.droneType = "sawtooth";
      profile.shimmerFrequency = 128;
      profile.shimmerGain = 0.004;
      profile.lfoFrequency = 0.1;
      profile.lfoDepth = 0.014;
    } else if (choice === "expand") {
      profile.droneFrequency = 132;
      profile.droneGain = 0.022;
      profile.droneType = "triangle";
      profile.shimmerFrequency = 264;
      profile.shimmerGain = 0.012;
      profile.lfoFrequency = 0.22;
      profile.lfoDepth = 0.012;
    } else if (choice === "fog") {
      profile.droneFrequency = 110;
      profile.droneGain = 0.02;
      profile.droneType = "sine";
      profile.shimmerFrequency = 176;
      profile.shimmerGain = 0.007;
      profile.lfoFrequency = 0.16;
      profile.lfoDepth = 0.016;
    } else if (choice === "soil") {
      profile.droneFrequency = 68;
      profile.droneGain = 0.03;
      profile.droneType = "sine";
      profile.shimmerFrequency = 102;
      profile.shimmerGain = 0.004;
      profile.lfoFrequency = 0.08;
      profile.lfoDepth = 0.01;
    }

    if (resolved && resolved.node === "dead-end") {
      profile.masterGain += 0.006;
      profile.droneFrequency *= 0.86;
      profile.shimmerGain *= 0.5;
    } else if (resolved && resolved.node === "return") {
      profile.shimmerGain += 0.004;
      profile.lfoFrequency += 0.04;
    } else if (resolved && resolved.node === "hidden-exit") {
      profile.masterGain += 0.008;
      profile.shimmerFrequency *= 1.2;
      profile.shimmerGain += 0.008;
    }

    if (state.harmonyPhase === "bloom") {
      profile.masterGain += 0.006;
      profile.shimmerGain += 0.004;
    } else if (state.harmonyPhase === "resolve") {
      profile.droneGain += 0.004;
    }

    return profile;
  }

  function applyMythicPresence(choice, resolved) {
    const spirit = spiritGuides[choice] || null;
    const guardian = legacyGuardians[choice] || null;

    spiritAnimal.classList.remove("is-visible");
    legacyCharacter.classList.remove("is-visible");
    spiritAnimal.removeAttribute("data-spirit");
    legacyCharacter.removeAttribute("data-legacy");
    spiritAnimal.dataset.label = "";
    legacyCharacter.dataset.label = "";

    if (spirit) {
      spiritAnimal.dataset.spirit = spirit.key;
      spiritAnimal.dataset.label = spirit.label;
      spiritAnimal.classList.add("is-visible");
    }

    if (guardian && (resolved.rare || resolved.node === "hidden-exit" || resolved.node === "return")) {
      legacyCharacter.dataset.legacy = guardian.key;
      legacyCharacter.dataset.label = guardian.label;
      legacyCharacter.classList.add("is-visible");
    }
  }

  function applyWeather(choice, resolved) {
    clearWeather();
    const intensity = getWeatherOpacity(choice, resolved);

    if (resolved && resolved.node === "dead-end") {
      archive.dataset.weather = "collapse";
      weatherStorm.style.opacity = String(Math.min(1, intensity + 0.14));
      return;
    }

    if (resolved && resolved.node === "return") {
      archive.dataset.weather = "return";
      weatherFog.style.opacity = String(Math.max(0.22, intensity * 0.54));
      weatherShimmer.style.opacity = String(Math.max(0.22, intensity * 0.58));
      return;
    }

    if (resolved && resolved.node === "hidden-exit") {
      archive.dataset.weather = "hidden-exit";
      weatherFog.style.opacity = String(Math.max(0.3, intensity * 0.7));
      weatherShimmer.style.opacity = String(Math.max(0.34, intensity * 0.78));
      return;
    }

    archive.dataset.weather = choice;
    if (choice === "collapse") {
      weatherStorm.style.opacity = String(intensity);
      return;
    }
    if (choice === "expand") {
      weatherShimmer.style.opacity = String(intensity);
      return;
    }
    if (choice === "fog") {
      weatherFog.style.opacity = String(intensity);
      return;
    }
    if (choice === "soil") {
      weatherSoil.style.opacity = String(intensity);
      return;
    }

    archive.dataset.weather = "threshold";
  }

  function getWeatherOpacity(choice, resolved) {
    let opacity = 0.56;

    if (choice === "expand") {
      opacity = 0.62;
    } else if (choice === "collapse") {
      opacity = 0.58;
    } else if (choice === "fog") {
      opacity = 0.52;
    } else if (choice === "soil") {
      opacity = 0.48;
    }

    if (state.harmonyPhase === "bloom") {
      opacity += 0.14;
    } else if (state.harmonyPhase === "resolve") {
      opacity += 0.1;
    }

    if (state.harmonyCoherence === "harmonic") {
      opacity += 0.08;
    }

    if (resolved && resolved.rare) {
      opacity += 0.08;
    }

    if (state.rewrites.sealed && choice === "collapse") {
      opacity += 0.08;
    }

    if (state.rewrites.luminous && (choice === "expand" || choice === "fog")) {
      opacity += 0.08;
    }

    return Math.min(1, opacity);
  }

  function clearWeather() {
    weatherFog.style.opacity = "0";
    weatherShimmer.style.opacity = "0";
    weatherStorm.style.opacity = "0";
    weatherSoil.style.opacity = "0";
  }
})();
