(function () {
  const page = document.body;
  const wheel = document.getElementById("learningWheel");
  const disc = document.getElementById("wheelDisc");
  const driftField = document.getElementById("driftField");
  const status = document.getElementById("wheelStatus");
  const hiddenHub = document.getElementById("hiddenHub");
  const sectors = Array.from(document.querySelectorAll(".season-sector"));
  const cards = Array.from(document.querySelectorAll("[data-season-card]"));
  const eggs = Array.from(document.querySelectorAll("[data-egg]"));
  const stars = Array.from(document.querySelectorAll(".star"));
  const seasonGallery = document.getElementById("seasonGallery");
  const seasonGalleryClose = document.getElementById("seasonGalleryClose");
  const seasonGalleryImage = document.getElementById("seasonGalleryImage");
  const seasonGalleryTitle = document.getElementById("seasonGalleryTitle");
  const seasonGalleryCaption = document.getElementById("seasonGalleryCaption");

  if (!wheel || !disc || !driftField || !status) {
    return;
  }

  const loreBySeason = {
    spring: "Spring/Fog: soft, tender, forming. Learning begins in mist.",
    summer: "Summer/Ocean: expansive and shimmering. Growth arrives like tide.",
    autumn: "Autumn/Storm: electric and aching. Collapse is weather.",
    winter: "Winter/Soil: quiet, grounded, composting. Integration is compost."
  };

  const eggLore = {
    spring: "Sprout Gallery opened: mist glyphs and first-voice fragments.",
    summer: "Shimmer Chamber opened: wave glyphs and radiant tide notes.",
    autumn: "Collapse Lore opened: storm myths and fracture maps.",
    winter: "Soil Archive opened: root glyphs and integration lines."
  };

  const chamberTitles = {
    spring: "Sprout Gallery",
    summer: "Shimmer Chamber",
    autumn: "Collapse Lore",
    winter: "Soil Archive"
  };

  const flowerProfiles = {
    spring: {
      character: "Tender mist flower",
      defaultStimulus: "hover"
    },
    summer: {
      character: "Expansive tide flower",
      defaultStimulus: "near"
    },
    autumn: {
      character: "Electric fracture flower",
      defaultStimulus: "doubleClick"
    },
    winter: {
      character: "Quiet root flower",
      defaultStimulus: "longHover"
    }
  };

  const fallbackJewelryBySeason = {
    spring: [
      "assets/sketches/jewelery/fiddlehead.png",
      "assets/sketches/jewelery/beginagain.png",
      "assets/sketches/jewelery/a nature-inspired pe.png",
      "assets/sketches/jewelery/A symbolic glyph spi.png",
      "assets/sketches/jewelery/a stylized tree call.png"
    ],
    summer: [
      "assets/sketches/jewelery/ocean.png",
      "assets/sketches/jewelery/a delicate ocean-ins.png",
      "assets/sketches/jewelery/a hybrid jewelry and.png",
      "assets/sketches/jewelery/signalmarkpendant.png",
      "assets/sketches/jewelery/stars.png"
    ],
    autumn: [
      "assets/sketches/jewelery/firepiece.png",
      "assets/sketches/jewelery/firering.png",
      "assets/sketches/jewelery/weight.png",
      "assets/sketches/jewelery/weird.png",
      "assets/sketches/jewelery/a ritual ring inspir.png"
    ],
    winter: [
      "assets/sketches/jewelery/obsidian.png",
      "assets/sketches/jewelery/soilparticle.png",
      "assets/sketches/jewelery/softwood.png",
      "assets/sketches/jewelery/moonstone.png",
      "assets/sketches/jewelery/a pendant made of wo.png"
    ]
  };

  const seasonKeywords = {
    spring: ["nature", "fiddlehead", "myrtle", "sprout", "leaf", "tranquil", "begin"],
    summer: ["ocean", "star", "sun", "cosmic", "shimmer", "wave", "light"],
    autumn: ["fire", "storm", "ritual", "fracture", "weight", "weird", "snake"],
    winter: ["soil", "root", "wood", "obsidian", "moon", "stone", "compost", "earth"]
  };

  const pageKey = "learningwheel";

  let jewelryBySeason = cloneSeasonMap(fallbackJewelryBySeason);
  let allJewelryImages = flattenSeasonMap(jewelryBySeason);
  let orbitPools = {
    page: [],
    stimulus: {},
    season: {}
  };

  const glyphSets = {
    spring: ["◌", "❋", "⟡"],
    summer: ["✧", "☼", "≈"],
    autumn: ["✶", "⚡", "⟁"],
    winter: ["◍", "⬡", "⌁"]
  };

  const seasonAngles = {
    spring: 225,
    summer: 315,
    autumn: 45,
    winter: 135
  };

  const seasonSpeedMultiplier = {
    spring: 0.85,
    summer: 1.25,
    autumn: 1.08,
    winter: 0.7
  };

  const rotationBaseDegPerSec = 0.02;
  const archiveEntry = getArchiveEntry();
  const currentSeason = getSeason();
  const timeBand = getTimeBand();
  const revealedEggs = loadSet("threshold.wheelRevealedEggs");
  const visits = incrementVisitCounter();
  let activeSeason = currentSeason;
  let rotationDeg = 0;
  let harmonyMotionScale = 1;
  let harmonyNearScale = 1;
  let harmonyBurstScale = 1;
  let pointerX = window.innerWidth * 0.5;
  let pointerY = window.innerHeight * 0.5;
  let lastTimestamp = 0;
  let rafId = 0;

  page.dataset.season = currentSeason;
  page.dataset.timeband = timeBand;
  if (visits >= 4) {
    page.dataset.returnDepth = "deep";
  }

  wheel.setAttribute("data-initialized", "true");
  updateDepthVars();
  setStatus(loreBySeason[currentSeason]);
  highlightSeason(currentSeason);
  seedDriftGlyphs();
  loadJewelryManifest();
  applyHarmonySignal({
    phase: page.dataset.harmonyPhase,
    coherence: page.dataset.harmonyCoherence
  });
  applyArchiveRoute();

  sectors.forEach(function (sector) {
    const season = sector.dataset.season;
    sector.addEventListener("mouseenter", function () {
      activeSeason = season;
      highlightSeason(season);
      setStatus(loreBySeason[season] + " Character: " + flowerProfiles[season].character + ".");
    });

    sector.addEventListener("focus", function () {
      activeSeason = season;
      highlightSeason(season);
      setStatus(loreBySeason[season] + " Character: " + flowerProfiles[season].character + ".");
    });

    sector.addEventListener("click", function () {
      setStatus(loreBySeason[season] + " Seasonal fragments are drifting outward.");
      bumpSeasonGlyphs(season);
    });
  });

  eggs.forEach(function (eggButton) {
    const season = eggButton.dataset.egg;
    eggButton.addEventListener("click", function () {
      const stimulus = flowerProfiles[season].defaultStimulus;
      revealedEggs.add(season);
      persistSet("threshold.wheelRevealedEggs", revealedEggs);
      eggButton.setAttribute("aria-pressed", "true");
      setStatus(eggLore[season]);
      bumpSeasonGlyphs(season);
      openSeasonGallery(season, stimulus);
    });

    if (revealedEggs.has(season)) {
      eggButton.setAttribute("aria-pressed", "true");
    }
  });

  document.addEventListener("pointermove", function (event) {
    pointerX = event.clientX;
    pointerY = event.clientY;
  }, { passive: true });

  window.addEventListener("scroll", updateDepthVars, { passive: true });
  window.addEventListener("resize", updateDepthVars);

  if (seasonGalleryClose) {
    seasonGalleryClose.addEventListener("click", closeSeasonGallery);
  }

  if (seasonGallery) {
    seasonGallery.addEventListener("click", function (event) {
      if (event.target === seasonGallery) {
        closeSeasonGallery();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeSeasonGallery();
    }
  });

  window.addEventListener("threshold:harmony-update", function (event) {
    applyHarmonySignal(event.detail || {});
  });

  function animate(nowMs) {
    if (!lastTimestamp) {
      lastTimestamp = nowMs;
    }

    const dtMs = Math.min(80, nowMs - lastTimestamp);
    lastTimestamp = nowMs;
    const speed = rotationBaseDegPerSec * seasonSpeedMultiplier[activeSeason] * harmonyMotionScale;
    rotationDeg += speed * (dtMs / 1000);
    page.style.setProperty("--wheel-rotation", rotationDeg.toFixed(6) + "deg");

    updateStarProximity();
    updateHiddenHub(nowMs);
    rafId = requestAnimationFrame(animate);
  }

  rafId = requestAnimationFrame(animate);

  window.addEventListener("beforeunload", function () {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  });

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

  function getTimeBand() {
    const hour = new Date().getHours();
    return (hour >= 18 || hour <= 5) ? "night" : "day";
  }

  function updateDepthVars() {
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, window.scrollY / scrollable);
    page.style.setProperty("--soil-depth", String(progress));
    page.style.setProperty("--cosmos-rise", String(1 - progress));
  }

  function highlightSeason(season) {
    sectors.forEach(function (sector) {
      sector.classList.toggle("active", sector.dataset.season === season);
    });

    cards.forEach(function (card) {
      card.classList.toggle("active", card.dataset.seasonCard === season);
    });
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function updateStarProximity() {
    stars.forEach(function (star) {
      const rect = star.getBoundingClientRect();
      const cx = rect.left + (rect.width * 0.5);
      const cy = rect.top + (rect.height * 0.5);
      const dist = Math.hypot(pointerX - cx, pointerY - cy);
      star.classList.toggle("is-near", dist < (120 * harmonyNearScale));
    });
  }

  function updateHiddenHub(nowMs) {
    if (!hiddenHub) {
      return;
    }

    const rect = hiddenHub.getBoundingClientRect();
    const cx = rect.left + (rect.width * 0.5);
    const cy = rect.top + (rect.height * 0.5);
    const dist = Math.hypot(pointerX - cx, pointerY - cy);
    const winterBand = pointerY > (window.innerHeight * 0.5);
    hiddenHub.classList.toggle("is-near", winterBand && dist < 180);

    const drift = Math.sin(nowMs * 0.0012) * 3;
    hiddenHub.style.setProperty("--hub-drift", drift.toFixed(2) + "px");
  }

  function seedDriftGlyphs() {
    const allSeasons = ["spring", "summer", "autumn", "winter"];
    allSeasons.forEach(function (season) {
      for (let i = 0; i < 6; i += 1) {
        driftField.appendChild(createDriftGlyph(season, i));
      }
    });
  }

  function bumpSeasonGlyphs(season) {
    const burstCount = Math.max(2, Math.round(4 * harmonyBurstScale));
    for (let i = 0; i < burstCount; i += 1) {
      driftField.appendChild(createDriftGlyph(season, i + 10));
    }
  }

  function applyHarmonySignal(detail) {
    const phase = detail && typeof detail.phase === "string" ? detail.phase : (page.dataset.harmonyPhase || "seed");
    const coherence = detail && typeof detail.coherence === "string" ? detail.coherence : (page.dataset.harmonyCoherence || "soft");

    harmonyMotionScale = 1;
    harmonyNearScale = 1;
    harmonyBurstScale = 1;

    if (phase === "seed") {
      harmonyMotionScale = 0.88;
      harmonyNearScale = 0.92;
      harmonyBurstScale = 0.85;
    } else if (phase === "weave") {
      harmonyMotionScale = 1;
      harmonyNearScale = 1;
      harmonyBurstScale = 1;
    } else if (phase === "bloom") {
      harmonyMotionScale = 1.18;
      harmonyNearScale = 1.08;
      harmonyBurstScale = 1.25;
    } else if (phase === "resolve") {
      harmonyMotionScale = 0.96;
      harmonyNearScale = 1.02;
      harmonyBurstScale = 1.1;
    }

    if (coherence === "woven") {
      harmonyNearScale += 0.05;
    } else if (coherence === "harmonic") {
      harmonyMotionScale += 0.08;
      harmonyNearScale += 0.12;
      harmonyBurstScale += 0.14;
    }

    setStatus(loreBySeason[activeSeason] + " Harmony phase: " + phase + " / " + coherence + ".");
  }

  function getArchiveEntry() {
    const params = new URLSearchParams(window.location.search);
    return {
      route: params.get("archiveRoute") || "",
      weather: params.get("archiveWeather") || "",
      season: params.get("archiveSeason") || ""
    };
  }

  function applyArchiveRoute() {
    if (!archiveEntry.route) {
      return;
    }

    enterThresholdArchive(archiveEntry.route, archiveEntry.weather || "soil");

    writeArchiveReturnSignal("learningwheel", archiveEntry.route, archiveEntry.weather || "soil");

    const seasonFromWeather = archiveEntry.weather === "fog" ? "spring"
      : archiveEntry.weather === "storm" ? "autumn"
      : archiveEntry.weather === "soil" ? "winter"
      : archiveEntry.weather === "shimmer" ? "summer"
      : currentSeason;
    const routedSeason = archiveEntry.season || seasonFromWeather;

    page.dataset.archiveRoute = archiveEntry.route;
    page.dataset.archiveWeather = archiveEntry.weather || routedSeason;
    page.dataset.season = routedSeason;
    activeSeason = routedSeason;
    highlightSeason(routedSeason);
    setStatus(chamberTitles[routedSeason] + " opened from the Archive route.");
    bumpSeasonGlyphs(routedSeason);
    wheel.style.boxShadow = "0 0 0 1px rgba(244, 231, 208, 0.14), 0 0 54px -28px rgba(194, 184, 163, 0.4)";
    injectArchiveBanner(chamberTitles[routedSeason], "Archive route " + archiveEntry.route + " entered through " + (archiveEntry.weather || routedSeason) + ". Return path remembered.");
    hydrateArchiveBanner(archiveEntry.route, chamberTitles[routedSeason]);

    if (hiddenHub) {
      hiddenHub.classList.add("is-near");
    }
  }

  function enterThresholdArchive(route, weather) {
    function invoke() {
      if (window.threshold && typeof window.threshold.enterArchive === "function") {
        window.threshold.enterArchive(route || weather || "soil", {
          route: route || "",
          weather: weather || "soil",
          page: "learningwheel"
        });
      }
    }

    invoke();
    window.addEventListener("threshold:engine-ready", invoke, { once: true });
  }

  function injectArchiveBanner(title, detail) {
    const banner = document.createElement("div");
    banner.id = "archiveRouteBanner";
    banner.style.maxWidth = "820px";
    banner.style.margin = "0 auto 1.2rem";
    banner.style.padding = "0.8rem 1rem";
    banner.style.border = "1px solid rgba(236, 223, 199, 0.22)";
    banner.style.borderRadius = "999px";
    banner.style.background = "rgba(248, 242, 231, 0.08)";
    banner.style.color = "rgba(246, 236, 220, 0.92)";
    banner.style.textAlign = "center";
    banner.style.fontFamily = "'Source Code Pro', monospace";
    banner.textContent = title + " · " + detail;
    const shell = document.querySelector(".wheel-shell");
    if (shell) {
      shell.insertAdjacentElement("afterbegin", banner);
    }
  }

  function hydrateArchiveBanner(route, title) {
    fetch("data/vault-archive.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("vault archive fetch failed");
        }
        return response.json();
      })
      .then(function (payload) {
        const routeMeta = payload && payload.archive && payload.archive.routes ? payload.archive.routes[route] : null;
        const banner = document.getElementById("archiveRouteBanner");
        if (!routeMeta || !banner) {
          return;
        }
        const selectedNote = selectRouteNote(routeMeta, "wheel:" + route);
        const lore = selectedNote && selectedNote.excerpt ? selectedNote.excerpt : (routeMeta.lore || "Archive route arrived in seasonal motion.");
        banner.textContent = title + " · " + lore;
        const image = selectedNote && Array.isArray(selectedNote.assets) && selectedNote.assets[0] ? selectedNote.assets[0].webPath : "";
        const panel = document.createElement("div");
        panel.style.maxWidth = "820px";
        panel.style.margin = "0.9rem auto 0";
        panel.style.padding = "1rem";
        panel.style.border = "1px solid rgba(236, 223, 199, 0.18)";
        panel.style.borderRadius = "22px";
        panel.style.background = "rgba(248, 242, 231, 0.08)";
        panel.style.color = "rgba(246, 236, 220, 0.88)";
        panel.textContent = lore;
        banner.insertAdjacentElement("afterend", panel);
        if (image) {
          const img = document.createElement("img");
          img.src = image;
          img.alt = title;
          img.style.display = "block";
          img.style.width = "min(420px, 100%)";
          img.style.margin = "0.9rem auto 0";
          img.style.borderRadius = "18px";
          panel.appendChild(img);
        }
      })
      .catch(function () {
        // Keep fallback banner text.
      });
  }

  function selectRouteNote(routeMeta, key) {
    if (!routeMeta) {
      return null;
    }

    if (Array.isArray(routeMeta.notePool) && routeMeta.notePool.length > 0) {
      return rotateNotePool(routeMeta.notePool, key, routeMeta.note || null);
    }

    return routeMeta.note || null;
  }

  function rotateNotePool(pool, key, fallback) {
    const entries = Array.isArray(pool) ? pool.filter(function (entry) {
      return entry && typeof entry === "object";
    }) : [];
    if (entries.length === 0) {
      return fallback || null;
    }

    const storageKey = "threshold.route.notePoolRotation.v1";
    let map = {};
    try {
      const raw = localStorage.getItem(storageKey);
      map = raw ? JSON.parse(raw) : {};
      if (!map || typeof map !== "object") {
        map = {};
      }
    } catch (error) {
      map = {};
    }

    const current = Number(map[key] || 0);
    const index = Math.abs(current) % entries.length;
    map[key] = current + 1;

    try {
      localStorage.setItem(storageKey, JSON.stringify(map));
    } catch (error) {
      // Ignore storage restrictions.
    }

    return entries[index] || fallback || null;
  }

  function writeArchiveReturnSignal(pageKey, route, weather) {
    try {
      localStorage.setItem("threshold.archive.returnSignal.v1", JSON.stringify({
        page: pageKey,
        route: route,
        weather: weather,
        at: Date.now()
      }));
    } catch (error) {
      // Ignore storage restrictions.
    }
  }

  function createDriftGlyph(season, seedIndex) {
    const glyphNode = document.createElement("span");
    glyphNode.className = "drift-glyph";
    const set = glyphSets[season];
    glyphNode.textContent = set[Math.floor(Math.random() * set.length)];

    const angleBase = seasonAngles[season];
    const angle = angleBase + ((Math.random() * 70) - 35);
    const radiusStart = 78 + (Math.random() * 45);
    const radiusEnd = 170 + (Math.random() * 110);
    const duration = 6 + (Math.random() * 5);
    const delay = (Math.random() * 2) + ((seedIndex % 3) * 0.2);

    glyphNode.style.setProperty("--ang", angle.toFixed(2) + "deg");
    glyphNode.style.setProperty("--r0", radiusStart.toFixed(1) + "px");
    glyphNode.style.setProperty("--r1", radiusEnd.toFixed(1) + "px");
    glyphNode.style.setProperty("--dur", duration.toFixed(2) + "s");
    glyphNode.style.setProperty("--delay", delay.toFixed(2) + "s");

    setTimeout(function () {
      glyphNode.remove();
    }, (duration + delay + 0.4) * 1000);

    return glyphNode;
  }

  function incrementVisitCounter() {
    try {
      const current = Number(localStorage.getItem("threshold.wheelVisits") || "0") + 1;
      localStorage.setItem("threshold.wheelVisits", String(current));
      return current;
    } catch (error) {
      return 1;
    }
  }

  function loadSet(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return new Set();
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return new Set();
      }
      return new Set(parsed);
    } catch (error) {
      return new Set();
    }
  }

  function persistSet(key, values) {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(values)));
    } catch (error) {
      // Ignore storage restrictions.
    }
  }

  function openSeasonGallery(season) {
    if (!seasonGallery || !seasonGalleryImage || !seasonGalleryTitle || !seasonGalleryCaption) {
      return;
    }

    const stimulus = arguments[1] || flowerProfiles[season].defaultStimulus || "click";
    const list = pickFlowerPool(season, stimulus);
    if (list.length === 0) {
      setStatus(chamberTitles[season] + " is waiting for image seeds.");
      return;
    }

    const imagePath = choose(list);
    seasonGalleryTitle.textContent = chamberTitles[season] + " · " + flowerProfiles[season].character;
    seasonGalleryImage.src = encodeURI(imagePath);
    seasonGalleryImage.alt = chamberTitles[season] + " image";
    seasonGalleryCaption.textContent = "Node response: " + stimulus + " · Random chamber image: " + basename(imagePath) + " · Flower pool size: " + list.length;
    seasonGallery.hidden = false;
  }

  function closeSeasonGallery() {
    if (!seasonGallery) {
      return;
    }
    seasonGallery.hidden = true;
  }

  function choose(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function basename(path) {
    const slash = path.lastIndexOf("/");
    if (slash === -1) {
      return path;
    }
    return path.slice(slash + 1);
  }

  function loadJewelryManifest() {
    fetch("data/image-orbit-map.json", { cache: "no-store" })
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }
        return fetch("data/all-png-images.json", { cache: "no-store" }).then(function (fallbackResponse) {
          if (fallbackResponse.ok) {
            return fallbackResponse.json();
          }
          return fetch("data/jewelry-images.json", { cache: "no-store" }).then(function (legacyResponse) {
            if (!legacyResponse.ok) {
              throw new Error("manifest fetch failed");
            }
            return legacyResponse.json();
          });
        });
      })
      .then(function (payload) {
        if (payload && typeof payload === "object" && !Array.isArray(payload) && payload.pageOrbits) {
          applyOrbitMap(payload);
          return;
        }

        const list = payload;
        if (!Array.isArray(list) || list.length === 0) {
          return;
        }

        const cleanList = list
          .filter(function (item) {
            return typeof item === "string" && item.toLowerCase().endsWith(".png");
          })
          .map(function (item) {
            return item.replace(/\\/g, "/");
          });

        if (cleanList.length === 0) {
          return;
        }

        allJewelryImages = dedupeList(cleanList);
        jewelryBySeason = distributeBySeason(allJewelryImages);
        orbitPools.page = allJewelryImages.slice();
        orbitPools.season = cloneSeasonMap(jewelryBySeason);
        orbitPools.stimulus = {};
        setStatus("Loaded " + allJewelryImages.length + " jewelry image seeds for seasonal chambers.");
      })
      .catch(function () {
        // Keep fallback pools silently.
      });
  }

  function applyOrbitMap(mapData) {
    const pageOrbits = mapData.pageOrbits || {};
    const seasonOrbits = mapData.seasonOrbits || {};
    const stimulusOrbits = mapData.stimulusOrbits || {};

    orbitPools.page = dedupeList((pageOrbits[pageKey] || []).map(normalizePath));
    orbitPools.season = {
      spring: dedupeList((seasonOrbits.spring || []).map(normalizePath)),
      summer: dedupeList((seasonOrbits.summer || []).map(normalizePath)),
      autumn: dedupeList((seasonOrbits.autumn || []).map(normalizePath)),
      winter: dedupeList((seasonOrbits.winter || []).map(normalizePath))
    };
    orbitPools.stimulus = {
      hover: dedupeList((stimulusOrbits.hover || []).map(normalizePath)),
      click: dedupeList((stimulusOrbits.click || []).map(normalizePath)),
      longHover: dedupeList((stimulusOrbits.longHover || []).map(normalizePath)),
      doubleClick: dedupeList((stimulusOrbits.doubleClick || []).map(normalizePath)),
      revisit: dedupeList((stimulusOrbits.revisit || []).map(normalizePath)),
      near: dedupeList((stimulusOrbits.near || []).map(normalizePath)),
      rare: dedupeList((stimulusOrbits.rare || []).map(normalizePath))
    };

    const allFromMap = dedupeList([
      ...orbitPools.page,
      ...flattenSeasonMap(orbitPools.season),
      ...flattenObjectArrays(orbitPools.stimulus),
      ...((mapData.unassigned || []).map(normalizePath))
    ]);

    allJewelryImages = allFromMap.length > 0 ? allFromMap : allJewelryImages;
    jewelryBySeason = {
      spring: orbitPools.season.spring.length > 0 ? orbitPools.season.spring : fallbackJewelryBySeason.spring.slice(),
      summer: orbitPools.season.summer.length > 0 ? orbitPools.season.summer : fallbackJewelryBySeason.summer.slice(),
      autumn: orbitPools.season.autumn.length > 0 ? orbitPools.season.autumn : fallbackJewelryBySeason.autumn.slice(),
      winter: orbitPools.season.winter.length > 0 ? orbitPools.season.winter : fallbackJewelryBySeason.winter.slice()
    };

    setStatus("Orbit map loaded: " + allJewelryImages.length + " images organized by page and stimulus.");
  }

  function pickFlowerPool(season, stimulus) {
    const seasonPool = (orbitPools.season && orbitPools.season[season]) || jewelryBySeason[season] || [];
    const stimulusPool = (orbitPools.stimulus && orbitPools.stimulus[stimulus]) || [];

    const seasonAndStimulus = intersectMany([seasonPool, stimulusPool]);
    if (seasonAndStimulus.length > 0) {
      return seasonAndStimulus;
    }

    if (seasonPool.length > 0) {
      return seasonPool;
    }

    return fallbackJewelryBySeason[season] ? fallbackJewelryBySeason[season].slice() : [];
  }

  function distributeBySeason(list) {
    const distributed = {
      spring: [],
      summer: [],
      autumn: [],
      winter: []
    };

    const unassigned = [];

    list.forEach(function (path) {
      const lower = basename(path).toLowerCase();
      let assignedSeason = "";

      Object.keys(seasonKeywords).some(function (season) {
        const matched = seasonKeywords[season].some(function (token) {
          return lower.includes(token);
        });
        if (matched) {
          assignedSeason = season;
          return true;
        }
        return false;
      });

      if (assignedSeason) {
        distributed[assignedSeason].push(path);
      } else {
        unassigned.push(path);
      }
    });

    const seasons = ["spring", "summer", "autumn", "winter"];
    unassigned.forEach(function (path, index) {
      distributed[seasons[index % seasons.length]].push(path);
    });

    seasons.forEach(function (season) {
      if (distributed[season].length === 0) {
        distributed[season] = fallbackJewelryBySeason[season].slice();
      }
    });

    return distributed;
  }

  function flattenSeasonMap(map) {
    const merged = [];
    Object.keys(map).forEach(function (season) {
      merged.push.apply(merged, map[season]);
    });
    return dedupeList(merged);
  }

  function cloneSeasonMap(map) {
    return {
      spring: map.spring.slice(),
      summer: map.summer.slice(),
      autumn: map.autumn.slice(),
      winter: map.winter.slice()
    };
  }

  function flattenObjectArrays(obj) {
    const merged = [];
    Object.keys(obj).forEach(function (key) {
      if (Array.isArray(obj[key])) {
        merged.push.apply(merged, obj[key]);
      }
    });
    return merged;
  }

  function intersectMany(lists) {
    const valid = lists.filter(function (list) {
      return Array.isArray(list) && list.length > 0;
    });

    if (valid.length === 0) {
      return [];
    }

    return valid.reduce(function (acc, list) {
      const set = new Set(list);
      return acc.filter(function (item) {
        return set.has(item);
      });
    });
  }

  function normalizePath(path) {
    return String(path).replace(/\\/g, "/");
  }

  function dedupeList(list) {
    return Array.from(new Set(list));
  }
})();
