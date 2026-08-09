(function () {
  const cards = Array.from(document.querySelectorAll(".mythology-entry[data-spirit]"));
  if (!cards.length) {
    return;
  }

  const entityGrid = document.getElementById("entity-grid");
  const entityRefresh = document.getElementById("entity-refresh");
  const pageRoot = document.body;

  const viewer = document.getElementById("myth-viewer");
  const viewerTitle = document.getElementById("viewer-title");
  const viewerMeta = document.getElementById("viewer-meta");
  const viewerImage = document.getElementById("viewer-image");
  const viewerWrap = document.getElementById("viewer-image-wrap");
  const viewerHalo = document.getElementById("viewer-halo");
  const viewerPath = document.getElementById("viewer-path");
  const viewerOrientation = document.getElementById("viewer-orientation");
  const viewerImpact = document.getElementById("viewer-impact");
  const viewerIndex = document.getElementById("viewer-index");
  const viewerNote = document.getElementById("viewer-note");
  const prevBtn = document.getElementById("viewer-prev");
  const nextBtn = document.getElementById("viewer-next");

  const GLYPHS = {
    cindervox: "✶",
    porpoise: "◌",
    whisperhawk: "✧",
    stonecat: "◍",
    lumenstag: "✦"
  };

  const ORIENTATION_LINE = {
    cindervox: "Fire · Ignition · Clarifying Rupture",
    porpoise: "Water · Flow · Emotional Conductivity",
    whisperhawk: "Air · Perspective · Pattern Lift",
    stonecat: "Earth · Grounding · Structural Truth",
    lumenstag: "Light · Alignment · Signal Illumination"
  };

  let manifest = null;
  let entryMap = new Map();
  let activeSpirit = null;
  let activeAmbientEntry = { element: "ethos" };
  let activeIndex = 0;
  let rotateTimer = null;
  let activationPulseTimer = null;
  let ambientPulseTimer = null;
  let touchStartX = null;
  let cardRotationTimer = null;
  const containerStateByElement = new Map();
  const revealTimers = new WeakMap();

  const atmosphericCanvas = document.createElement("canvas");
  atmosphericCanvas.className = "mythic-canvas";
  if (viewer) {
    viewer.appendChild(atmosphericCanvas);
  }

  const atmosphericCtx = atmosphericCanvas.getContext("2d");
  let atmosphericWidth = 0;
  let atmosphericHeight = 0;
  let atmosphericPulse = 0;

  function resizeAtmosphericCanvas() {
    if (!viewer || !atmosphericCanvas) {
      return;
    }
    atmosphericWidth = atmosphericCanvas.width = viewer.clientWidth;
    atmosphericHeight = atmosphericCanvas.height = viewer.clientHeight;
  }

  function drawAtmosphericCanvas() {
    if (!atmosphericCtx) {
      return;
    }
    atmosphericCtx.clearRect(0, 0, atmosphericWidth, atmosphericHeight);
    atmosphericPulse += 0.02;
    const radius = 80 + Math.sin(atmosphericPulse) * 20;
    atmosphericCtx.beginPath();
    atmosphericCtx.arc(atmosphericWidth / 2, atmosphericHeight / 2, radius, 0, Math.PI * 2);
    atmosphericCtx.fillStyle = "rgba(255,255,255,0.08)";
    atmosphericCtx.fill();
    requestAnimationFrame(drawAtmosphericCanvas);
  }

  resizeAtmosphericCanvas();
  window.addEventListener("resize", resizeAtmosphericCanvas);
  drawAtmosphericCanvas();

  const ELEMENT_TONE = {
    earth: { hue: "-14deg", rgb: "120 158 112", pulseClass: "pulse-earth" },
    forest: { hue: "-20deg", rgb: "94 140 92", pulseClass: "pulse-forest" },
    sky: { hue: "-7deg", rgb: "162 193 236", pulseClass: "pulse-sky" },
    water: { hue: "-16deg", rgb: "90 124 206", pulseClass: "pulse-water" },
    fire: { hue: "20deg", rgb: "207 121 77", pulseClass: "pulse-fire" },
    light: { hue: "8deg", rgb: "225 196 112", pulseClass: "pulse-light" },
    ethos: { hue: "24deg", rgb: "156 118 214", pulseClass: "pulse-ethos" },
    air: { hue: "-7deg", rgb: "162 193 236", pulseClass: "pulse-air" }
  };

  const PULSE_CLASSES = [
    "pulse-earth",
    "pulse-forest",
    "pulse-sky",
    "pulse-water",
    "pulse-fire",
    "pulse-light",
    "pulse-ethos",
    "pulse-air"
  ];

  const ELEMENT_VARIANT_KEYWORDS = {
    fire: ["fire", "ember", "ash", "flame", "cinder"],
    water: ["water", "sea", "ocean", "tide", "river", "mist", "aqua"],
    air: ["air", "wind", "sky", "storm", "breath", "aero"],
    earth: ["earth", "stone", "soil", "root", "ground", "dust"],
    light: ["light", "lumen", "aurora", "radiant", "glow", "ether", "ethos"]
  };

  function normalizeSpiritKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function spiritRefToId(value) {
    if (value && typeof value === "object") {
      if (typeof value.id === "string") {
        return value.id;
      }
      if (typeof value.spiritId === "string") {
        return value.spiritId;
      }
      if (typeof value.slug === "string") {
        return value.slug;
      }
      return "";
    }
    return typeof value === "string" ? value : "";
  }

  function normalizeElementName(value) {
    const token = normalizeSpiritKey(value);
    if (token === "ethos" || token === "ether") {
      return "light";
    }
    return token;
  }

  function applyElementalTone(entry) {
    if (!pageRoot) {
      return;
    }
    const key = String(entry && entry.element ? entry.element : "ethos").toLowerCase();
    const tone = ELEMENT_TONE[key] || ELEMENT_TONE.ethos;
    PULSE_CLASSES.forEach(function (pulseClass) {
      pageRoot.classList.remove(pulseClass);
    });
    pageRoot.classList.add(tone.pulseClass);
    pageRoot.style.setProperty("--pulse-hue", tone.hue);
    pageRoot.style.setProperty("--pulse-rgb", tone.rgb);
  }

  function runChamberPulse(type, entry, event) {
    if (!pageRoot) {
      return;
    }

    const pulseClass = type === "ambient" ? "is-ambient-pulsing" : "is-activation-pulsing";
    const duration = type === "ambient" ? 800 : 1200;

    applyElementalTone(entry || activeSpirit || { element: "ethos" });
    pageRoot.classList.remove(pulseClass);
    void pageRoot.offsetWidth;
    pageRoot.classList.add(pulseClass);

    if (type !== "ambient") {
      pulseFromEvent(event);
    }

    if (pulseClass === "is-activation-pulsing") {
      if (activationPulseTimer) {
        clearTimeout(activationPulseTimer);
      }
      activationPulseTimer = setTimeout(function () {
        pageRoot.classList.remove(pulseClass);
      }, duration);
      return;
    }

    setTimeout(function () {
      pageRoot.classList.remove(pulseClass);
    }, duration);
  }

  function scheduleAmbientPulse() {
    if (ambientPulseTimer) {
      clearTimeout(ambientPulseTimer);
    }

    const delay = 12000 + Math.floor(Math.random() * 6001);
    ambientPulseTimer = setTimeout(function () {
      const ambientSource = viewer.classList.contains("is-hidden") ? activeAmbientEntry : activeSpirit || activeAmbientEntry;
      runChamberPulse("ambient", ambientSource || { element: "ethos" });
      scheduleAmbientPulse();
    }, delay);
  }

  function bindSwitchChamberPulse() {
    const links = document.querySelectorAll("nav a[href], a.chamber[href], .return-link[href]");
    links.forEach(function (link) {
      link.addEventListener("click", function () {
        runChamberPulse("activation", activeSpirit || { element: "ethos" });
      });
    });
  }

  function stopRotation() {
    if (rotateTimer) {
      clearInterval(rotateTimer);
      rotateTimer = null;
    }
  }

  function startRotation() {
    stopRotation();
    if (!activeSpirit || !Array.isArray(activeSpirit.variants) || activeSpirit.variants.length <= 1) {
      return;
    }

    rotateTimer = setInterval(function () {
      activeIndex = (activeIndex + 1) % activeSpirit.variants.length;
      renderViewer();
    }, 4200);
  }

  function setNoteLink(spirit) {
    const note = spirit && spirit.note ? spirit.note : null;
    const glyph = GLYPHS[spirit && spirit.id ? spirit.id : ""] || "✶";
    viewerNote.textContent = `[${glyph}]`;
    if (note && note.exists && note.obsidianUrl) {
      viewerNote.href = note.obsidianUrl;
      viewerNote.classList.remove("is-disabled");
      return;
    }

    viewerNote.href = "#";
    viewerNote.classList.add("is-disabled");
  }

  function setHalo(spirit) {
    const glyph = GLYPHS[spirit && spirit.id ? spirit.id : ""] || "✶";
    viewerHalo.textContent = glyph;
    viewer.setAttribute("data-element", String(spirit && spirit.element ? spirit.element : "").toLowerCase());
  }

  window.addEventListener("threshold:chamber-identity", function (event) {
    const identity = event && event.detail ? event.detail : {};
    if (viewerTitle) {
      viewerTitle.textContent = identity.name || "Mythology";
    }
    if (viewerMeta) {
      viewerMeta.textContent = identity.lore || "Atmospheric mythic chamber.";
    }
  });

  function prettyVaultPath(spirit, variant) {
    if (!spirit) {
      return "Vault → unknown";
    }

    const source = variant && variant.sourcePath ? variant.sourcePath : "";
    const normalized = source.replace(/\\/g, "/");
    const marker = "theghost/";
    const idx = normalized.toLowerCase().indexOf(marker);
    if (idx >= 0) {
      const relative = normalized.slice(idx + marker.length);
      return `Vault → ${relative.replace(/\//g, " → ")}`;
    }
    if (normalized) {
      return `Vault → ${normalized}`;
    }
    return "Vault → PNG missing";
  }

  function pulseFromEvent(event) {
    if (!viewerImpact) {
      return;
    }
    const x = event && typeof event.clientX === "number" ? event.clientX : window.innerWidth * 0.5;
    const y = event && typeof event.clientY === "number" ? event.clientY : window.innerHeight * 0.5;
    viewerImpact.style.setProperty("--pulse-x", `${x}px`);
    viewerImpact.style.setProperty("--pulse-y", `${y}px`);
    viewerImpact.classList.remove("is-pulsing");
    void viewerImpact.offsetWidth;
    viewerImpact.classList.add("is-pulsing");
  }

  function renderViewer() {
    if (!activeSpirit) {
      viewerTitle.textContent = "Spirit Viewer";
      viewerMeta.textContent = "Awaiting spirit selection.";
      viewerImage.removeAttribute("src");
      viewerImage.alt = "Spirit variant";
      viewerIndex.textContent = "0 / 0";
      setNoteLink(null);
      return;
    }

    const variants = Array.isArray(activeSpirit.variants) ? activeSpirit.variants : [];
    const count = variants.length;
    const hasVariants = count > 0;

    viewerTitle.textContent = `${activeSpirit.name} Viewer`;
    viewerMeta.textContent = `${activeSpirit.element} orientation | ${count} variant${count === 1 ? "" : "s"}`;

    if (hasVariants) {
      const item = variants[activeIndex % count];
      setViewerImage(activeSpirit, activeIndex % count);
      viewerIndex.textContent = `${activeIndex + 1} / ${count}`;
      viewerPath.textContent = prettyVaultPath(activeSpirit, item);
    } else {
      viewerImage.removeAttribute("src");
      viewerImage.alt = `${activeSpirit.name} variant missing`;
      viewerIndex.textContent = "0 / 0";
      viewerPath.textContent = "Vault → PNG missing";
    }

    viewerOrientation.textContent = ORIENTATION_LINE[activeSpirit.id] || `${activeSpirit.element} orientation`;
    setHalo(activeSpirit);

    prevBtn.disabled = !hasVariants;
    nextBtn.disabled = !hasVariants;
    setNoteLink(activeSpirit);
  }

  function openViewerByEntry(entry, event) {
    if (!entry) {
      return;
    }

    activeSpirit = entry;
    activeIndex = 0;
    renderViewer();

    viewer.classList.remove("is-hidden");
    viewer.setAttribute("aria-hidden", "false");
    runChamberPulse("activation", entry, event);
    startRotation();
  }

  function openViewerBySelection(selection, event) {
    if (!selection || !selection.entry) {
      return;
    }

    activeSpirit = selection.entry;
    activeIndex = Math.max(0, Number(selection.variantIndex) || 0);
    renderViewer();

    viewer.classList.remove("is-hidden");
    viewer.setAttribute("aria-hidden", "false");
    runChamberPulse("activation", selection.entry, event);
    startRotation();
  }

  function variantText(variant) {
    const label = variant && variant.label ? variant.label : "";
    const sourcePath = variant && variant.sourcePath ? variant.sourcePath : "";
    return `${label} ${sourcePath}`.toLowerCase();
  }

  function inferPreferredVariantIndices(entry, element) {
    const keywords = ELEMENT_VARIANT_KEYWORDS[element] || [];
    if (!keywords.length) {
      return [];
    }

    const variants = Array.isArray(entry && entry.variants) ? entry.variants : [];
    const matches = [];
    variants.forEach(function (variant, index) {
      const text = variantText(variant);
      const hit = keywords.some(function (keyword) {
        return text.includes(keyword);
      });
      if (hit) {
        matches.push(index);
      }
    });
    return matches;
  }

  function uniqueEntriesById(list) {
    const out = new Map();
    (Array.isArray(list) ? list : []).forEach(function (entry) {
      if (!entry || !entry.id) {
        return;
      }
      const key = String(entry.id);
      if (!out.has(key)) {
        out.set(key, entry);
        return;
      }
      const current = out.get(key);
      const currentCount = Array.isArray(current && current.variants) ? current.variants.length : 0;
      const nextCount = Array.isArray(entry && entry.variants) ? entry.variants.length : 0;
      if (nextCount > currentCount) {
        out.set(key, entry);
      }
    });
    return Array.from(out.values());
  }

  function collectElementSpecies(element) {
    const normalizedElement = normalizeElementName(element);
    const byId = new Map();
    const rotationByElement = manifest && manifest.rotation && manifest.rotation.byElement
      ? manifest.rotation.byElement
      : null;

    if (rotationByElement && Array.isArray(rotationByElement[normalizedElement])) {
      rotationByElement[normalizedElement].forEach(function (record) {
        if (!record || !record.id) {
          return;
        }
        const entry = resolveEntry(record.id);
        if (!entry) {
          return;
        }
        const preferred = Array.isArray(record.preferredVariants)
          ? record.preferredVariants.filter(function (index) {
            return Number.isInteger(index) && index >= 0 && index < (Array.isArray(entry.variants) ? entry.variants.length : 0);
          })
          : [];
        byId.set(entry.id, {
          entry,
          preferredVariants: preferred.length ? preferred : inferPreferredVariantIndices(entry, normalizedElement)
        });
      });
    }

    if (byId.size === 0) {
      const spirits = Array.isArray(manifest && manifest.spirits) ? manifest.spirits : [];
      const entities = Array.isArray(manifest && manifest.entities) ? manifest.entities : [];
      uniqueEntriesById([...spirits, ...entities]).forEach(function (entry) {
        const realms = Array.isArray(entry.realms) ? entry.realms.map(normalizeElementName) : [];
        const primary = normalizeElementName(entry.element);
        if (realms.includes(normalizedElement) || primary === normalizedElement) {
          byId.set(entry.id, {
            entry,
            preferredVariants: inferPreferredVariantIndices(entry, normalizedElement)
          });
        }
      });
    }

    return Array.from(byId.values()).sort(function (a, b) {
      return a.entry.name.localeCompare(b.entry.name);
    });
  }

  function applyCardSelection(card, selection) {
    if (!card || !selection || !selection.entry) {
      return;
    }

    const entry = selection.entry;
    const variants = Array.isArray(entry.variants) ? entry.variants : [];
    const safeIndex = variants.length ? Math.max(0, Math.min(variants.length - 1, Number(selection.variantIndex) || 0)) : 0;
    const variant = variants[safeIndex] || null;
    const elementLabel = String(selection.element || entry.element || "Ethos");

    card.setAttribute("data-spirit", entry.id);
    card.dataset.activeSpiritId = entry.id;
    card.dataset.activeVariantIndex = String(safeIndex);
    card.dataset.activeElement = normalizeElementName(selection.element || entry.element || "ethos");
    card.dataset.archetype = normalizeElementName(selection.element || entry.element || "ethos");
    card.setAttribute("aria-label", `Open ${entry.name} ${elementLabel} viewer`);

    const title = card.querySelector("h3");
    if (title) {
      title.replaceChildren();
      const glyph = document.createElement("span");
      glyph.className = "glyph-mark";
      glyph.textContent = entry.glyph || GLYPHS[entry.id] || "◌";
      title.appendChild(glyph);
      title.append(document.createTextNode(`${elementLabel} · ${entry.name}`));
    }

    const body = card.querySelector("p");
    if (body) {
      body.textContent = ORIENTATION_LINE[entry.id] || `Vault-driven ${elementLabel.toLowerCase()} form`;
    }

    paintCardPreview(card, {
      name: entry.name,
      preview: variant && variant.webPath ? variant.webPath : entry.preview
    });
  }

  function nextSelectionForElement(element) {
    const normalizedElement = normalizeElementName(element);
    const state = containerStateByElement.get(normalizedElement);
    if (!state || !Array.isArray(state.species) || state.species.length === 0) {
      return null;
    }

    const speciesItem = state.species[state.speciesCursor % state.species.length];
    state.speciesCursor += 1;

    const entry = speciesItem.entry;
    const variants = Array.isArray(entry && entry.variants) ? entry.variants : [];
    if (!variants.length) {
      return {
        entry,
        variantIndex: 0,
        element: normalizedElement
      };
    }

    const preferred = Array.isArray(speciesItem.preferredVariants) ? speciesItem.preferredVariants : [];
    const key = `${normalizedElement}:${entry.id}`;
    const currentPointer = Number(state.variantCursorBySpecies[key] || 0);

    let variantIndex = 0;
    if (preferred.length > 0) {
      variantIndex = preferred[currentPointer % preferred.length];
      state.variantCursorBySpecies[key] = currentPointer + 1;
    } else {
      variantIndex = Math.floor(Math.random() * variants.length);
      state.variantCursorBySpecies[key] = currentPointer + 1;
    }

    return {
      entry,
      variantIndex,
      element: normalizedElement
    };
  }

  function rotateElementalContainers() {
    cards.forEach(function (card) {
      const element = normalizeElementName(card.getAttribute("data-archetype") || "");
      if (!element || !containerStateByElement.has(element)) {
        return;
      }
      const selection = nextSelectionForElement(element);
      if (selection) {
        applyCardSelection(card, selection);
      }
    });
  }

  function setupElementalContainerRotation() {
    containerStateByElement.clear();

    cards.forEach(function (card) {
      const element = normalizeElementName(card.getAttribute("data-archetype") || card.dataset.element || "");
      if (!element) {
        return;
      }
      if (containerStateByElement.has(element)) {
        return;
      }
      containerStateByElement.set(element, {
        species: collectElementSpecies(element),
        speciesCursor: 0,
        variantCursorBySpecies: {}
      });
    });

    rotateElementalContainers();

    if (cardRotationTimer) {
      clearInterval(cardRotationTimer);
      cardRotationTimer = null;
    }

    cardRotationTimer = setInterval(function () {
      rotateElementalContainers();
    }, 9000);
  }

  function buildImageCandidates(spirit, preferredIndex) {
    const variants = Array.isArray(spirit && spirit.variants) ? spirit.variants : [];
    const orderedVariants = [];

    if (variants.length > 0) {
      const safeIndex = Math.max(0, Math.min(variants.length - 1, Number(preferredIndex) || 0));
      orderedVariants.push(variants[safeIndex]);
      variants.forEach(function (item, idx) {
        if (idx !== safeIndex) {
          orderedVariants.push(item);
        }
      });
    }

    const id = spirit && spirit.id ? String(spirit.id).toLowerCase() : "";
    const element = spirit && spirit.element ? String(spirit.element).toLowerCase() : "";
    const candidates = [];

    orderedVariants.forEach(function (item) {
      if (item && item.webPath) {
        candidates.push({
          src: item.webPath,
          label: item.label || "variant",
          sourcePath: item.sourcePath || ""
        });
      }
    });

    if (spirit && spirit.preview) {
      candidates.push({ src: spirit.preview, label: "preview", sourcePath: "" });
    }

    if (id) {
      candidates.push({ src: `assets/mythology/${id}.png`, label: `${id}.png`, sourcePath: "" });
      if (element) {
        candidates.push({ src: `assets/mythology/${element}/${id}.png`, label: `${element}/${id}.png`, sourcePath: "" });
      }
      candidates.push({ src: `assets/vault/spirit-animals/${id}.png`, label: `${id}.png`, sourcePath: "" });
    }

    const seen = new Set();
    return candidates.filter(function (item) {
      if (!item || !item.src) {
        return false;
      }
      const key = String(item.src).toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  function setViewerImage(spirit, preferredIndex) {
    const candidates = buildImageCandidates(spirit, preferredIndex);
    if (!candidates.length) {
      viewerImage.removeAttribute("src");
      viewerImage.alt = `${spirit && spirit.name ? spirit.name : "Spirit"} variant missing`;
      viewerPath.textContent = "Vault -> PNG missing";
      return;
    }

    let pointer = 0;
    const tryNext = function () {
      if (pointer >= candidates.length) {
        viewerImage.onerror = null;
        viewerImage.onload = null;
        viewerImage.removeAttribute("src");
        viewerImage.alt = `${spirit && spirit.name ? spirit.name : "Spirit"} variant missing`;
        viewerPath.textContent = "Vault -> PNG missing";
        return;
      }

      const choice = candidates[pointer];
      pointer += 1;

      viewerImage.onerror = tryNext;
      viewerImage.onload = function () {
        viewerImage.onerror = null;
        viewerImage.onload = null;
        viewerImage.alt = `${spirit.name} variant ${Math.max(1, Number(preferredIndex) + 1)}`;
        if (choice.sourcePath) {
          viewerPath.textContent = prettyVaultPath(spirit, choice);
        } else {
          viewerPath.textContent = `Asset -> ${choice.src}`;
        }
      };

      viewerImage.src = choice.src;
    };

    tryNext();
  }

  function openViewer(spiritId, event) {
    const entry = resolveEntry(spiritId);
    openViewerByEntry(entry, event);
  }

  function resolveEntry(ref) {
    const rawId = spiritRefToId(ref);
    if (!rawId) {
      return null;
    }

    const byRaw = entryMap.get(rawId);
    if (byRaw) {
      return byRaw;
    }

    const normalized = normalizeSpiritKey(rawId);
    const byNormalized = entryMap.get(normalized);
    if (byNormalized) {
      return byNormalized;
    }

    const spirits = Array.isArray(manifest && manifest.spirits) ? manifest.spirits : [];
    return spirits.find(function (entry) {
      const aliases = Array.isArray(entry && entry.aliases) ? entry.aliases : [];
      const keys = [entry && entry.id ? entry.id : "", entry && entry.name ? entry.name : ""].concat(aliases);
      return keys.some(function (token) {
        return normalizeSpiritKey(token) === normalized;
      });
    }) || null;
  }

  function closeViewer() {
    stopRotation();
    viewer.classList.add("is-hidden");
    viewer.setAttribute("aria-hidden", "true");
    activeAmbientEntry = activeSpirit || activeAmbientEntry;
    runChamberPulse("activation", activeSpirit || { element: "ethos" });
  }

  function setEntryImageState(card, visible) {
    const image = card.querySelector(".mythology-image");
    if (!image) {
      return;
    }

    const timer = revealTimers.get(card);
    if (timer) {
      clearTimeout(timer);
      revealTimers.delete(card);
    }

    if (visible) {
      image.style.display = "block";
      requestAnimationFrame(function () {
        image.classList.add("visible");
      });
      card.setAttribute("aria-expanded", "true");
      card.classList.add("is-revealed");
      return;
    }

    image.classList.remove("visible");
    card.setAttribute("aria-expanded", "false");
    card.classList.remove("is-revealed");
    revealTimers.set(card, setTimeout(function () {
      image.style.display = "none";
    }, 400));
  }

  function hydrateMythologyEntry(card) {
    const entry = resolveEntry(card.getAttribute("data-spirit"));
    if (!entry) {
      return;
    }

    const text = card.querySelector(".mythology-text");
    const title = card.querySelector("h3");
    const body = card.querySelector("p");
    const image = card.querySelector(".mythology-image");
    const variants = Array.isArray(entry.variants) ? entry.variants : [];
    const preview = entry.preview || (variants[0] && variants[0].webPath) || "";

    if (title) {
      title.setAttribute("title", entry.name);
    }
    if (body) {
      body.textContent = ORIENTATION_LINE[entry.id] || body.textContent;
    }
    if (image) {
      image.src = preview;
      image.alt = entry.name;
      image.style.display = "none";
      image.classList.remove("visible");
    }
    if (text) {
      text.setAttribute("aria-label", `Reveal ${entry.name}`);
    }
  }

  function bindCard(card) {
    const text = card.querySelector(".mythology-text");
    if (!text) {
      return;
    }

    const toggle = function (event) {
      event.preventDefault();
      event.stopPropagation();
      const expanded = card.getAttribute("aria-expanded") === "true";
      setEntryImageState(card, !expanded);
    };

    text.addEventListener("click", toggle);
    text.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        toggle(event);
      }
    });
  }

  function buildEntryMap() {
    entryMap = new Map();
    const spirits = Array.isArray(manifest && manifest.spirits) ? manifest.spirits : [];
    const entities = Array.isArray(manifest && manifest.entities) ? manifest.entities : [];
    [...spirits, ...entities].forEach(function (entry) {
      if (!entry || !entry.id) {
        return;
      }

      const rawId = String(entry.id);
      const normalizedId = normalizeSpiritKey(rawId);
      entryMap.set(rawId, entry);
      if (normalizedId) {
        entryMap.set(normalizedId, entry);
      }

      const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
      aliases.forEach(function (alias) {
        const normalizedAlias = normalizeSpiritKey(alias);
        if (normalizedAlias) {
          entryMap.set(normalizedAlias, entry);
        }
      });
    });
  }

  function paintCardPreview(card, spirit) {
    const previewEl = card.querySelector(".spirit-preview");
    if (!previewEl) {
      return;
    }

    previewEl.replaceChildren();

    if (spirit && spirit.preview) {
      const img = document.createElement("img");
      img.src = spirit.preview;
      img.alt = `${spirit.name} preview`;
      previewEl.classList.remove("is-missing");
      previewEl.appendChild(img);
      return;
    }

    previewEl.classList.add("is-missing");
    previewEl.textContent = "Vault PNG missing";
  }

  function hydrateCardPreviews() {
    cards.forEach(function (card) {
      const spiritId = card.getAttribute("data-spirit");
      const spirit = manifest && manifest.spirits
        ? manifest.spirits.find(function (entry) { return entry.id === spiritId; })
        : null;
      paintCardPreview(card, spirit);
    });
  }

  function randomSample(items, count) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = copy[i];
      copy[i] = copy[j];
      copy[j] = t;
    }
    return copy.slice(0, count);
  }

  function entityCardElement(entity) {
    const card = document.createElement("article");
    card.className = "chamber spirit-card entity-card";
    card.setAttribute("data-entity-id", entity.id);
    card.setAttribute("data-archetype", String(entity.element || "ethos").toLowerCase());
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open ${entity.name} viewer`);

    const title = document.createElement("h3");
    const glyph = document.createElement("span");
    glyph.className = "glyph-mark";
    glyph.textContent = entity.glyph || "◌";
    title.appendChild(glyph);
    title.append(document.createTextNode(`${entity.element} · ${entity.name}`));

    const body = document.createElement("p");
    body.textContent = "Vault-discovered entity chamber.";

    const preview = document.createElement("div");
    preview.className = "spirit-preview";
    preview.setAttribute("aria-hidden", "true");

    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(preview);

    if (entity.preview) {
      const img = document.createElement("img");
      img.src = entity.preview;
      img.alt = `${entity.name} preview`;
      preview.appendChild(img);
    } else {
      preview.classList.add("is-missing");
      preview.textContent = "Vault PNG missing";
    }

    card.addEventListener("click", function (event) {
      event.preventDefault();
      openViewerByEntry(entity, event);
    });

    card.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openViewerByEntry(entity, event);
      }
    });

    return card;
  }

  function renderEntityConstellation() {
    if (!entityGrid) {
      return;
    }

    const entities = Array.isArray(manifest && manifest.entities) ? manifest.entities : [];
    entityGrid.replaceChildren();

    if (!entities.length) {
      const empty = document.createElement("p");
      empty.className = "vault-law-body";
      empty.textContent = "No non-humanoid vault entities discovered yet.";
      entityGrid.appendChild(empty);
      return;
    }

    const picked = randomSample(entities, Math.min(4, entities.length));
    activeAmbientEntry = picked[0] || { element: "ethos" };
    picked.forEach(function (entity) {
      entityGrid.appendChild(entityCardElement(entity));
    });

    runChamberPulse("activation", activeAmbientEntry);
  }

  function bindViewerControls() {
    viewer.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (target.getAttribute("data-viewer-close") === "true") {
        closeViewer();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (viewer.classList.contains("is-hidden")) {
        return;
      }

      if (event.key === "Escape") {
        closeViewer();
      }
      if (event.key === "ArrowRight") {
        nextBtn.click();
      }
      if (event.key === "ArrowLeft") {
        prevBtn.click();
      }
    });

    prevBtn.addEventListener("click", function () {
      if (!activeSpirit || !activeSpirit.variants || activeSpirit.variants.length === 0) {
        return;
      }
      activeIndex = (activeIndex - 1 + activeSpirit.variants.length) % activeSpirit.variants.length;
      renderViewer();
      startRotation();
    });

    nextBtn.addEventListener("click", function () {
      if (!activeSpirit || !activeSpirit.variants || activeSpirit.variants.length === 0) {
        return;
      }
      activeIndex = (activeIndex + 1) % activeSpirit.variants.length;
      renderViewer();
      startRotation();
    });

    if (viewerWrap) {
      viewerWrap.addEventListener("touchstart", function (event) {
        if (event.touches && event.touches[0]) {
          touchStartX = event.touches[0].clientX;
        }
      }, { passive: true });

      viewerWrap.addEventListener("touchend", function (event) {
        if (touchStartX === null || !event.changedTouches || !event.changedTouches[0]) {
          touchStartX = null;
          return;
        }
        const endX = event.changedTouches[0].clientX;
        const delta = endX - touchStartX;
        touchStartX = null;
        if (Math.abs(delta) < 42) {
          return;
        }
        if (delta < 0) {
          nextBtn.click();
        } else {
          prevBtn.click();
        }
      }, { passive: true });
    }
  }

  function loadManifest() {
    return fetch("data/mythology-assets.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Mythology asset manifest missing");
        }
        return response.json();
      })
      .then(function (payload) {
        manifest = payload;
        buildEntryMap();
      })
      .catch(function () {
        manifest = { spirits: [], entities: [] };
        buildEntryMap();
      });
  }

  cards.forEach(bindCard);
  bindViewerControls();
  bindSwitchChamberPulse();
  scheduleAmbientPulse();

  loadManifest().then(function () {
    cards.forEach(hydrateMythologyEntry);
    renderEntityConstellation();

    if (entityRefresh) {
      entityRefresh.addEventListener("click", function () {
        renderEntityConstellation();
      });
    }

    cards.forEach(function (card) {
      setEntryImageState(card, false);
    });
  });

  window.addEventListener("beforeunload", function () {
    if (cardRotationTimer) {
      clearInterval(cardRotationTimer);
      cardRotationTimer = null;
    }
  });
})();
