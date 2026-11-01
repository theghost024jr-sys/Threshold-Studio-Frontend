const page = document.body;
const core = document.getElementById("hub-awaken");
const reading = document.getElementById("hub-return-reading");
const continueRoute = document.getElementById("hub-continue-route");
const continueLabel = document.getElementById("hub-continue-label");
const continueDetail = document.getElementById("hub-continue-detail");
const orbitSystem = document.querySelector(".hub-orbit-system");
const strandLayer = document.querySelector(".hub-strands");
const routeNodes = [...document.querySelectorAll(".hub-route")];
const glyphNodes = [...document.querySelectorAll(".hub-glyph")];
const dragHint = document.querySelector(".hub-drag-hint");
const returnStateKey = "threshold-return-state";
let selectedRoute = null;
let selectedGlyph = null;
let glyphDwellTimer = null;
let oortParticles = [];
let panState = null;
let suppressNextClick = false;
let dragHintShown = false;

const returnStates = [
  "Motion returns as vector. The field begins to turn with you.",
  "Depth returns as pressure. The Hub holds it without a story.",
  "A stance has reached the core. The next seam is visible because you are."
];

function addOortField() {
  const field = document.querySelector(".hub-oort-field");
  if (!field || field.childElementCount > 0) return;

  const particles = Array.from({ length: 180 }, (_, index) => {
    const angle = index * 2.399963229728653;
    const radius = Math.sqrt((index + 0.5) / 180) * 49;
    const depth = ((index * 17) % 29) / 28;
    const particle = document.createElement("i");
    particle.className = "hub-oort";
    particle.dataset.depth = depth > 0.66 ? "near" : depth < 0.33 ? "far" : "middle";
    particle.style.setProperty("--oort-x", `${50 + Math.cos(angle) * radius}%`);
    particle.style.setProperty("--oort-y", `${50 + Math.sin(angle) * radius}%`);
    particle.style.setProperty("--oort-size", `${(1.5 + depth * 4.5).toFixed(2)}px`);
    particle.style.setProperty("--oort-opacity", (0.12 + depth * 0.46).toFixed(2));
    particle.style.setProperty("--oort-delay", `${-(index * 0.43).toFixed(2)}s`);
    particle.dataset.x = String(50 + Math.cos(angle) * radius);
    particle.dataset.y = String(50 + Math.sin(angle) * radius);
    field.appendChild(particle);
    return particle;
  });

  oortParticles = particles;
  return particles;
}

function routeName(route) {
  return route.querySelector("span")?.textContent.trim() || "this route";
}

function renderStrand(route) {
  if (!orbitSystem || !strandLayer || !route) return;

  const systemBounds = orbitSystem.getBoundingClientRect();
  const routeBounds = route.getBoundingClientRect();
  const startX = systemBounds.width / 2;
  const startY = systemBounds.height / 2;
  const endX = routeBounds.left + routeBounds.width / 2 - systemBounds.left;
  const endY = routeBounds.top + routeBounds.height / 2 - systemBounds.top;
  const strand = document.createElement("i");
  strand.className = "hub-strand";
  strand.style.width = `${Math.hypot(endX - startX, endY - startY)}px`;
  strand.style.left = `${startX}px`;
  strand.style.top = `${startY}px`;
  strand.style.transform = `rotate(${Math.atan2(endY - startY, endX - startX)}rad)`;
  strandLayer.replaceChildren(strand);
}

function renderGlyphStrand(glyph) {
  if (!orbitSystem || !strandLayer || !glyph) return;

  const systemBounds = orbitSystem.getBoundingClientRect();
  const glyphBounds = glyph.getBoundingClientRect();
  const startX = systemBounds.width / 2;
  const startY = systemBounds.height / 2;
  const endX = glyphBounds.left + glyphBounds.width / 2 - systemBounds.left;
  const endY = glyphBounds.top + glyphBounds.height / 2 - systemBounds.top;
  const strand = document.createElement("i");
  strand.className = "hub-strand hub-glyph-strand";
  strand.style.width = `${Math.hypot(endX - startX, endY - startY)}px`;
  strand.style.left = `${startX}px`;
  strand.style.top = `${startY}px`;
  strand.style.transform = `rotate(${Math.atan2(endY - startY, endX - startX)}rad)`;
  strandLayer.replaceChildren(strand);
}

function focusRoute(route, held = false) {
  selectedGlyph = null;
  glyphNodes.forEach((glyph) => glyph.classList.remove("is-awake", "is-selected"));
  const name = routeName(route);
  const detail = route.querySelector("small")?.textContent.trim() || "relationship / unresolved";
  document.body.dataset.hubRoute = name.toLowerCase().replaceAll(" ", "-");
  routeNodes.forEach((node) => {
    node.classList.toggle("is-awake", node === route);
    node.classList.toggle("is-selected", held && node === route);
  });
  renderStrand(route);
  reading.textContent = held
    ? `${name} is held in the field. Its relationship has become the nearest seam.`
    : `${name} wakes at the edge of the Hub. Its orbit shifts without becoming a command.`;
  continueRoute.href = route.href;
  continueLabel.textContent = `Enter ${name}`;
  continueDetail.textContent = `Current condition: ${detail}. Enter only when this relation is the one you mean to follow.`;
}

function clearRouteFocus() {
  if (selectedRoute) {
    focusRoute(selectedRoute, true);
    return;
  }
  delete document.body.dataset.hubRoute;
  strandLayer?.replaceChildren();
  routeNodes.forEach((node) => node.classList.remove("is-awake", "is-selected"));
}

function focusGlyph(glyph, held = false) {
  selectedRoute = null;
  routeNodes.forEach((node) => node.classList.remove("is-awake", "is-selected"));
  glyphNodes.forEach((node) => {
    node.classList.toggle("is-awake", node === glyph);
    node.classList.toggle("is-selected", held && node === glyph);
  });
  page.dataset.hubGlyph = "signal";
  renderGlyphStrand(glyph);
  reading.textContent = held
    ? "The signal holds open a small aperture in the field."
    : "A distant glyph changes shape under attention.";
  continueRoute.href = "/glyph-archive-node.html";
  continueLabel.textContent = "Enter the Glyph Archive";
  continueDetail.textContent = "A visible signal has opened a non-authoritative archive seam.";
}

function clearGlyphFocus() {
  if (selectedGlyph) {
    focusGlyph(selectedGlyph, true);
    return;
  }
  delete page.dataset.hubGlyph;
  strandLayer?.replaceChildren();
  glyphNodes.forEach((node) => node.classList.remove("is-awake", "is-selected"));
}

function bindRouteNodes() {
  routeNodes.forEach((route) => {
    route.addEventListener("pointerenter", () => focusRoute(route));
    route.addEventListener("focus", () => focusRoute(route));
    route.addEventListener("pointerleave", clearRouteFocus);
    route.addEventListener("blur", clearRouteFocus);
    route.addEventListener("click", (event) => {
      event.preventDefault();
      selectedRoute = route;
      focusRoute(route, true);
    });
  });

  window.addEventListener("resize", () => {
    if (selectedRoute) renderStrand(selectedRoute);
    if (selectedGlyph) renderGlyphStrand(selectedGlyph);
  });
}

function bindGlyphNodes() {
  glyphNodes.forEach((glyph) => {
    glyph.addEventListener("pointerenter", () => {
      glyphDwellTimer = window.setTimeout(() => focusGlyph(glyph), 620);
      glyph.classList.add("is-near");
    });
    glyph.addEventListener("focus", () => focusGlyph(glyph));
    glyph.addEventListener("pointerleave", () => {
      window.clearTimeout(glyphDwellTimer);
      glyph.classList.remove("is-near");
      clearGlyphFocus();
    });
    glyph.addEventListener("blur", clearGlyphFocus);
    glyph.addEventListener("click", () => {
      selectedGlyph = glyph;
      focusGlyph(glyph, true);
    });
    glyph.addEventListener("dblclick", () => {
      window.location.assign("/glyph-archive-node.html");
    });
  });
}

function updateOortProximity(event) {
  if (!orbitSystem || oortParticles.length === 0) return;
  const bounds = orbitSystem.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * 100;
  const y = ((event.clientY - bounds.top) / bounds.height) * 100;
  const isNear = x > -14 && x < 114 && y > -14 && y < 114;
  page.classList.toggle("hub-is-attended", isNear);
  if (!isNear) return;

  oortParticles.forEach((particle) => {
    const distance = Math.hypot(x - Number(particle.dataset.x), y - Number(particle.dataset.y));
    particle.style.setProperty("--oort-nearness", Math.max(0, 1 - distance / 17).toFixed(2));
  });
}

function updateParallax(event) {
  const horizontal = (event.clientX / window.innerWidth - 0.5) * 2;
  const vertical = (event.clientY / window.innerHeight - 0.5) * 2;
  page.style.setProperty("--hub-pointer-x", horizontal.toFixed(3));
  page.style.setProperty("--hub-pointer-y", vertical.toFixed(3));
  updateOortProximity(event);
}

function bindDepthGesture() {
  if (!orbitSystem) return;
  let depth = 0;
  orbitSystem.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) < 8) return;
    event.preventDefault();
    depth = Math.max(0, Math.min(3, depth + Math.sign(event.deltaY)));
    orbitSystem.dataset.hubDepth = String(depth);
    reading.textContent = depth === 0
      ? "The field settles back into its original orbit."
      : `The orbital field draws ${["nearer", "closer", "through its next layer"][depth - 1]}.`;
  }, { passive: false });
}

function currentReturnState() {
  const rawState = sessionStorage.getItem(returnStateKey);
  if (!rawState) return null;

  try {
    const state = JSON.parse(rawState);
    if (!state?.origin || !state?.value || !state?.detail) return null;
    return state;
  } catch (error) {
    console.warn("Discarding malformed Threshold return state.", error);
    sessionStorage.removeItem(returnStateKey);
    return null;
  }
}

function renderReturnState() {
  const state = currentReturnState();
  if (!state) {
    delete page.dataset.hubReturnOrigin;
    return;
  }
  page.dataset.hubReturnOrigin = state.origin.toLowerCase().replaceAll(" ", "-");
  reading.textContent = `${state.origin} returns as ${state.value}. ${state.detail}`;
  const seam = nextSeamFor(state);
  continueRoute.href = seam.href;
  continueLabel.textContent = seam.label;
  continueDetail.textContent = seam.detail;
}

function nextSeamFor(state) {
  if (state.origin === "Ocean") {
    return {
      href: "/portal/deepwater",
      label: "Continue into Deepwater",
      detail: "The Ocean returned pressure. The next seam is beneath the surface."
    };
  }
  if (state.origin === "Deepwater") {
    return {
      href: "/portal/first-door",
      label: "Let the First Door open",
      detail: "A pressure form has been read. The Hub can return it as stance."
    };
  }
  if (state.origin === "First Door" || state.origin === "Mirage") {
    return {
      href: "/portal/motion",
      label: "Enter the Motion Field",
      detail: "The next seam is motion: a world response to the stance you brought."
    };
  }
  if (state.origin === "Shore") {
    return {
      href: "/portal/ocean",
      label: "Face the Ocean",
      detail: "The shore returned a stance. The Ocean is ready to measure its depth."
    };
  }
  if (state.origin === "Ruins") {
    return {
      href: "/portal/quiet-grove",
      label: "Find the Quiet Grove",
      detail: "The Ruins made the pressure readable. Quiet-Weight can contain fracture without erasing its history."
    };
  }
  if (state.origin === "Quiet Grove") {
    return {
      href: "/portal/motion",
      label: "Resume through Motion",
      detail: "Quiet has re-cohered the field. Motion keeps it from becoming a Quiet-sink."
    };
  }
  if (state.origin === "Spiral Grove") {
    return {
      href: "/portal/quiet-grove",
      label: "Find the Quiet Grove",
      detail: "The Spiral Grove has made the loop readable. Quiet-Weight is its rare stabilizing exit."
    };
  }
  if (state.origin === "Doug") {
    return {
      href: "/portal/motion",
      label: "Follow the cleared vector",
      detail: "Doug handled the quiet fix. The system can move without forcing the loop."
    };
  }
  return {
    href: "/portal/ocean",
    label: "Return to the Ocean",
    detail: "A motion field has resolved. The Ocean can receive its depth."
  };
}

function bindPanGesture() {
  if (!orbitSystem) return;

  const panLimit = 180;
  const panThreshold = 8;
  let hintTimer = null;

  const hideDragHint = () => {
    window.clearTimeout(hintTimer);
    dragHint?.classList.remove("is-visible");
    dragHint?.setAttribute("aria-hidden", "true");
  };

  const renderPan = () => {
    page.style.setProperty("--hub-pan-x", `${panState.x}px`);
    page.style.setProperty("--hub-pan-y", `${panState.y}px`);
    if (selectedRoute) renderStrand(selectedRoute);
    if (selectedGlyph) renderGlyphStrand(selectedGlyph);
  };

  orbitSystem.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    panState = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      originX: Number.parseFloat(getComputedStyle(page).getPropertyValue("--hub-pan-x")) || 0,
      originY: Number.parseFloat(getComputedStyle(page).getPropertyValue("--hub-pan-y")) || 0,
      x: 0,
      y: 0,
      moved: false,
    };
    if (!dragHintShown) {
      hintTimer = window.setTimeout(() => {
        if (panState && !panState.moved) {
          dragHint?.classList.add("is-visible");
          dragHint?.setAttribute("aria-hidden", "false");
        }
      }, 360);
    }
  });

  const movePan = (event) => {
    const isMouseFallback = panState?.pointerType === "mouse" && event.type === "mousemove";
    if (!panState || (!isMouseFallback && event.pointerId !== panState.pointerId)) return;
    const horizontal = event.clientX - panState.startX;
    const vertical = event.clientY - panState.startY;
    if (!panState.moved && Math.hypot(horizontal, vertical) < panThreshold) return;

    if (!panState.moved) {
      panState.moved = true;
      dragHintShown = true;
      hideDragHint();
      page.classList.add("hub-is-panning");
    }
    event.preventDefault();
    panState.x = Math.max(-panLimit, Math.min(panLimit, panState.originX + horizontal));
    panState.y = Math.max(-panLimit, Math.min(panLimit, panState.originY + vertical));
    renderPan();
  };

  const finishPan = (event) => {
    const isMouseFallback = panState?.pointerType === "mouse" && event.type === "mouseup";
    if (!panState || (!isMouseFallback && event.pointerId !== panState.pointerId)) return;
    const moved = panState.moved;
    panState = null;
    page.classList.remove("hub-is-panning");
    hideDragHint();
    if (moved) suppressNextClick = true;
  };

  window.addEventListener("pointermove", movePan);
  window.addEventListener("pointerup", finishPan);
  window.addEventListener("pointercancel", finishPan);
  window.addEventListener("mousemove", movePan);
  window.addEventListener("mouseup", finishPan);
  orbitSystem.addEventListener("click", (event) => {
    if (!suppressNextClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressNextClick = false;
  }, true);
}

core?.addEventListener("click", () => {
  const awakened = page.classList.toggle("hub-is-awake");
  core.setAttribute("aria-pressed", String(awakened));
  core.querySelector(".hub-core-label").textContent = awakened ? "Fib 13 / listening" : "Fib 13 / awaken";
  if (awakened) {
    renderReturnState();
    if (!currentReturnState()) reading.textContent = returnStates[Math.floor(Math.random() * returnStates.length)];
  } else {
    reading.textContent = "Bring a vector to the core. The Hub will hold it without choosing for you.";
  }
});

window.addEventListener("pointermove", updateParallax, { passive: true });
addOortField();
bindRouteNodes();
bindGlyphNodes();
bindDepthGesture();
bindPanGesture();
renderReturnState();
