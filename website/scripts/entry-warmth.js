const seasonColors = Object.freeze({
  spring: "rgba(198, 232, 178, 0.25)",
  summer: "rgba(255, 200, 150, 0.25)",
  autumn: "rgba(236, 167, 103, 0.25)",
  winter: "rgba(176, 210, 255, 0.25)"
});

const oortNodes = Object.freeze([
  { x: -0.78, y: -0.52, z: -0.88, drift: 0.18, decay: 0.34, anchor: 0.12 },
  { x: -0.46, y: -0.83, z: 0.22, drift: 0.46, decay: 0.16, anchor: 0.32 },
  { x: -0.06, y: -0.7, z: -0.3, drift: 0.3, decay: 0.52, anchor: 0.18 },
  { x: 0.38, y: -0.92, z: 0.74, drift: 0.62, decay: 0.12, anchor: 0.46 },
  { x: 0.86, y: -0.5, z: -0.54, drift: 0.24, decay: 0.64, anchor: 0.16 },
  { x: 0.98, y: -0.08, z: 0.35, drift: 0.48, decay: 0.22, anchor: 0.38, route: "discover" },
  { x: 0.74, y: 0.42, z: 0.86, drift: 0.7, decay: 0.1, anchor: 0.54, route: "mythology" },
  { x: 0.34, y: 0.84, z: -0.14, drift: 0.34, decay: 0.48, anchor: 0.2, route: "glyphs" },
  { x: -0.12, y: 0.96, z: 0.58, drift: 0.56, decay: 0.18, anchor: 0.44, route: "dialogues" },
  { x: -0.56, y: 0.76, z: -0.72, drift: 0.2, decay: 0.68, anchor: 0.1, route: "contact" },
  { x: -0.94, y: 0.26, z: 0.1, drift: 0.4, decay: 0.28, anchor: 0.28, route: "invitation" },
  { x: -0.9, y: -0.2, z: 0.78, drift: 0.66, decay: 0.14, anchor: 0.5, route: "house and garden" },
  { x: -0.52, y: -0.2, z: -0.46, drift: 0.26, decay: 0.58, anchor: 0.14, route: "threshold record" },
  { x: 0.02, y: -0.3, z: 0.42, drift: 0.5, decay: 0.24, anchor: 0.36, route: "ethos" },
  { x: 0.48, y: -0.08, z: -0.64, drift: 0.22, decay: 0.66, anchor: 0.1, route: "learning wheel" },
  { x: 0.24, y: 0.3, z: 0.08, drift: 0.38, decay: 0.3, anchor: 0.3 }
]);

const cometPositions = Object.freeze([
  ["12%", "76%", "-8s"],
  ["56%", "24%", "-21s"]
]);

const glyphSignalPositions = Object.freeze([
  { x: 17, y: 29, delay: "-1.2s" },
  { x: 82, y: 36, delay: "-3.6s" },
  { x: 62, y: 82, delay: "-2.4s" }
]);

const routeDestinations = Object.freeze({
  "house and garden": "housegarden.html",
  "threshold record": "pages/threshold.html",
  ethos: "ethos.html",
  "learning wheel": "learningwheel.html",
  discover: "discover.html",
  invitation: "invitation.html",
  mythology: "mythology.html",
  glyphs: "glyphs.html",
  dialogues: "dialogues.html",
  contact: "contact.html"
});

const routeTopology = Object.freeze({
  "house and garden": {
    title: "House & Garden · tending inward",
    reading: "Rooms lead through Herb Room, Basin, Waterfall, and Old Forest: care becomes orientation before it becomes return.",
    seams: ["Herb Room", "Basin", "Old Forest"]
  },
  "threshold record": {
    title: "Threshold Record · held lineage",
    reading: "The record holds the site’s living traces without replacing the world that produced them.",
    seams: ["Notes", "Posts", "Projects"]
  },
  ethos: {
    title: "Ethos · the circuit mirror",
    reading: "Behavior enters through the slit and returns as pressure, drift, resonance, or anchor.",
    seams: ["Alignment", "Contribution", "Presence"]
  },
  "learning wheel": {
    title: "Learning Wheel · seasonal movement",
    reading: "Seasonal chambers make Collapse, Shimmer, and recurrence navigable rather than abstract.",
    seams: ["Spring", "Summer", "Autumn", "Winter"]
  },
  discover: {
    title: "Discover · outward signal",
    reading: "A broad approach route for seeing which Threshold chamber is asking for attention.",
    seams: ["World Map", "Spokes", "Return"]
  },
  invitation: {
    title: "Invitation · arrival",
    reading: "Belonging is an entrance condition, not a reward. It opens toward the world without collapsing into Contact.",
    seams: ["Arrival", "World", "Return"]
  },
  mythology: {
    title: "Mythology · pressure made visible",
    reading: "Mythic figures and fracture paths reveal force without pretending that every pressure is resolved.",
    seams: ["Fracture Pedal", "Storm Cabinet", "Return"]
  },
  glyphs: {
    title: "Glyphs · walking language",
    reading: "Glyphs are read through movement, position, and return—not as isolated symbols.",
    seams: ["Direction", "Containment", "Resonance"]
  },
  dialogues: {
    title: "Dialogues · signal returned",
    reading: "Arrival becomes language here; a contribution can become a Seed and travel back to the Hub.",
    seams: ["Arrival", "Contribution", "Seed"]
  },
  contact: {
    title: "Contact · operational return",
    reading: "A question, proposal, or signal can leave the visitor’s path and re-enter the studio as a real response.",
    seams: ["Question", "Signal", "Return"]
  }
});

function applySeasonTint(season) {
  document.documentElement.style.setProperty(
    "--season-color",
    seasonColors[season] || seasonColors.spring
  );
}

function addOortCloud() {
  const orbit = document.querySelector(".entry-orbit");
  const oortField = orbit?.querySelector(".hub-oort-field");
  if (!oortField || oortField.querySelector(".hub-oort")) {
    return null;
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const state = {
    anchor: 0,
    approach: null,
    collapse: 0,
    relatedRoute: "",
    pressure: 0.08,
    viewX: 0,
    viewY: 0
  };
  const particles = oortNodes.map((node) => {
    const destination = routeDestinations[node.route];
    const particle = document.createElement(destination ? "a" : "span");
    particle.className = `hub-oort${destination ? " hub-oort--route" : ""}`;
    if (destination) {
      particle.href = destination;
      particle.setAttribute("aria-label", `Approach ${routeTopology[node.route].title}`);
      const approach = () => {
        state.relatedRoute = node.route;
        state.approach = { route: node.route, title: routeTopology[node.route].title };
        render();
      };
      particle.addEventListener("pointerenter", approach);
      particle.addEventListener("focus", approach);
      particle.addEventListener("pointerleave", () => {
        if (state.approach?.route === node.route) {
          state.relatedRoute = "";
          state.approach = null;
          render();
        }
      });
      particle.addEventListener("blur", () => {
        if (state.approach?.route === node.route) {
          state.relatedRoute = "";
          state.approach = null;
          render();
        }
      });
    }
    oortField.appendChild(particle);
    return { node, particle };
  });
  const approachReading = document.createElement("span");
  approachReading.className = "hub-oort-approach";
  approachReading.setAttribute("aria-hidden", "true");
  approachReading.hidden = true;
  oortField.appendChild(approachReading);

  const render = () => {
    oortField.dataset.oortState = state.collapse > 0 ? "collapse" : state.anchor > 0 ? "anchoring" : "drifting";
    const approachNode = state.approach
      ? oortNodes.find((node) => node.route === state.approach.route)
      : null;
    particles.forEach(({ node, particle }) => {
      const depth = (node.z + 1) / 2;
      const relationship = node.route === state.relatedRoute ? 1 : 0;
      const distance = approachNode ? Math.hypot(node.x - approachNode.x, node.y - approachNode.y) : Infinity;
      const approachInfluence = Math.max(0, 1 - distance / 0.88);
      const spread = 1 + state.pressure * node.drift * 0.26 - state.anchor * node.anchor * 0.2;
      const relationshipPull = relationship * 0.22;
      const collapsePull = state.collapse * node.decay * 0.26;
      const parallax = reducedMotion.matches ? 0 : 0.09 + depth * 0.19;
      const x = node.x * (spread - relationshipPull - collapsePull)
        + state.viewX * parallax
        + (node.x - approachNode?.x || 0) * approachInfluence * 0.12;
      const y = node.y * (spread - relationshipPull - collapsePull)
        + state.viewY * parallax
        + (node.y - approachNode?.y || 0) * approachInfluence * 0.12;
      const size = 2.5 + depth * 4.5;
      const opacity = Math.max(0.08, 0.16 + depth * 0.42 - state.collapse * node.decay * 0.2);
      particle.dataset.depth = depth > 0.67 ? "near" : depth < 0.33 ? "far" : "middle";
      particle.classList.toggle("is-related", relationship === 1);
      particle.style.left = `${50 + x * 12}%`;
      particle.style.top = `${50 + y * 12}%`;
      particle.style.setProperty("--hub-oort-size", `${size}px`);
      particle.style.setProperty("--hub-oort-opacity", opacity.toFixed(2));
    });
    const approachParticle = approachNode
      ? particles.find(({ node }) => node.route === approachNode.route)?.particle
      : null;
    if (approachParticle) {
      approachReading.textContent = state.approach.title;
      approachReading.style.left = approachParticle.style.left;
      approachReading.style.top = approachParticle.style.top;
      approachReading.hidden = false;
      orbit.dataset.routeApproach = "true";
      orbit.style.setProperty("--route-approach-x", `${approachNode.x * 18}%`);
      orbit.style.setProperty("--route-approach-y", `${approachNode.y * 18}%`);
    } else {
      approachReading.hidden = true;
      delete orbit.dataset.routeApproach;
      orbit.style.removeProperty("--route-approach-x");
      orbit.style.removeProperty("--route-approach-y");
    }
  };

  const settleCollapse = () => {
    state.collapse = 0;
    render();
  };

  window.addEventListener("threshold:hub-signal", (event) => {
    const type = event.detail?.type;
    const pressure = Number(event.detail?.pressure);
    if (Number.isFinite(pressure)) state.pressure = Math.min(1, Math.max(0, pressure));
    state.anchor = type === "resonance" ? 1 : type === "charge" ? 0.42 : 0;
    render();
  });

  window.addEventListener("threshold:engine-event", (event) => {
    const type = event.detail?.type;
    const pressure = Number(event.detail?.pressure);
    if (Number.isFinite(pressure)) state.pressure = Math.min(1, Math.max(0, pressure));
    if (type === "flicker") {
      state.collapse = 1;
      window.setTimeout(settleCollapse, reducedMotion.matches ? 0 : 900);
    } else if (type === "heartbeat") {
      state.anchor = 0.28;
    } else if (type === "descent") {
      state.pressure = 1;
    }
    render();
  });

  window.addEventListener("threshold:engine-state", (event) => {
    const houseAndGarden = event.detail?.nodes?.housegarden;
    if (!houseAndGarden) {
      return;
    }
    state.anchor = houseAndGarden.active === true ? 1 : 0;
    state.pressure = Math.min(1, Math.max(0.08, Number(houseAndGarden.inputCount || 0) * 0.16));
    render();
  });

  if (!reducedMotion.matches) {
    window.addEventListener("pointermove", (event) => {
      state.viewX = event.clientX / window.innerWidth - 0.5;
      state.viewY = event.clientY / window.innerHeight - 0.5;
      render();
    }, { passive: true });
  }

  render();
  return {
    focusRoute(route, title = "") {
      state.relatedRoute = route;
      state.approach = route && title ? { route, title } : null;
      render();
    },
    relationshipNode(route) {
      return particles.find(({ node }) => node.route === route)?.particle || null;
    }
  };
}

async function addGlyphSignals() {
  const orbit = document.querySelector(".entry-orbit");
  const oortField = document.querySelector(".hub-oort-field");
  const reading = document.querySelector("[data-hub-glyph-reading]");
  const title = document.querySelector("#hub-glyph-title");
  const text = document.querySelector("[data-hub-glyph-text]");
  const link = document.querySelector("[data-hub-glyph-link]");
  if (!orbit || !oortField || !reading || !title || !text || !link || orbit.querySelector(".hub-glyph-signal")) {
    return;
  }

  try {
    const response = await fetch("/config/glyphs.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`glyph index request failed (${response.status})`);
    const data = await response.json();
    const glyphs = Object.values(data?.glyphs || {}).filter((glyph) => glyph?.id && glyph?.name && glyph?.text && glyph?.asset);
    if (glyphs.length === 0) throw new Error("glyph index contains no displayable glyphs");

    const selected = [...glyphs].sort(() => Math.random() - 0.5).slice(0, Math.min(3, glyphs.length));
    const reveal = (glyph, held = false) => {
      title.textContent = glyph.name;
      text.textContent = glyph.text;
      link.href = `glyphs.html#glyph-${encodeURIComponent(glyph.id)}`;
      link.hidden = !held;
      link.textContent = held ? `Follow ${glyph.name}` : "Hold the signal to follow it";
      reading.classList.add("is-visible");
      orbit.querySelectorAll(".hub-glyph-signal").forEach((signal) => {
        signal.classList.toggle("is-held", held && signal.dataset.glyph === glyph.id);
      });
    };

    selected.forEach((glyph, index) => {
      const position = glyphSignalPositions[index];
      const signal = document.createElement("button");
      const image = document.createElement("img");
      signal.className = "hub-glyph-signal";
      signal.type = "button";
      signal.dataset.glyph = glyph.id;
      signal.dataset.glyphOrder = String(index + 1);
      signal.style.left = `${position.x}%`;
      signal.style.top = `${position.y}%`;
      signal.style.setProperty("--hub-glyph-delay", position.delay);
      signal.setAttribute("aria-label", `Encounter ${glyph.name}`);
      image.src = glyph.asset;
      image.alt = "";
      signal.appendChild(image);
      signal.addEventListener("pointerenter", () => reveal(glyph));
      signal.addEventListener("focus", () => reveal(glyph));
      signal.addEventListener("click", () => reveal(glyph, true));
      signal.addEventListener("dblclick", () => window.location.assign(link.href));
      orbit.appendChild(signal);
    });
  } catch (error) {
    console.error("Hub glyph signals could not be loaded.", error);
    text.textContent = "The Oort signals are quiet until the glyph index can be reached.";
    reading.classList.add("is-visible");
  }
}

function addMicroComets() {
  const shell = document.querySelector(".entry-shell");
  if (!shell || shell.querySelector(".hub-comet")) {
    return;
  }
  cometPositions.forEach(([left, top, delay]) => {
    const comet = document.createElement("span");
    comet.className = "hub-comet";
    comet.style.left = left;
    comet.style.top = top;
    comet.style.setProperty("--hub-comet-delay", delay);
    shell.appendChild(comet);
  });
}

function wireRouteConstellations(oortCloud) {
  const panel = document.querySelector(".entry-panel");
  const orbit = document.querySelector(".entry-orbit");
  const routes = document.querySelectorAll(".entry-actions a");
  const topology = document.querySelector("[data-hub-topology]");
  const topologyTitle = document.querySelector("[data-hub-topology-title]");
  const topologyReading = document.querySelector("[data-hub-topology-reading]");
  const topologySeams = document.querySelector("[data-hub-topology-seams]");
  if (!panel || !orbit || routes.length === 0 || panel.querySelector(".hub-constellation")) {
    return;
  }
  const line = document.createElement("span");
  line.className = "hub-constellation";
  panel.appendChild(line);
  let activeRoute = null;

  const updateLine = (route) => {
    const panelBounds = panel.getBoundingClientRect();
    const routeBounds = route.getBoundingClientRect();
    const routeId = route.textContent.trim().toLowerCase();
    const relationshipNode = oortCloud?.relationshipNode(routeId);
    const endpointBounds = relationshipNode?.getBoundingClientRect() || orbit.getBoundingClientRect();
    const startX = routeBounds.left - panelBounds.left;
    const startY = routeBounds.top + routeBounds.height / 2 - panelBounds.top;
    const endX = endpointBounds.left + endpointBounds.width / 2 - panelBounds.left;
    const endY = endpointBounds.top + endpointBounds.height / 2 - panelBounds.top;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    line.style.width = `${Math.hypot(deltaX, deltaY)}px`;
    line.style.transform = `translate(${startX}px, ${startY}px) rotate(${Math.atan2(deltaY, deltaX)}rad)`;
    line.classList.add("is-visible");
  };

  const updateTopology = (route) => {
    const data = routeTopology[route.textContent.trim().toLowerCase()];
    if (!data || !topology || !topologyTitle || !topologyReading || !topologySeams) {
      return null;
    }
    topologyTitle.textContent = data.title;
    topologyReading.textContent = data.reading;
    topologySeams.replaceChildren(...data.seams.map((seam) => {
      const item = document.createElement("li");
      item.textContent = seam;
      return item;
    }));
    return data;
  };

  const revealRoute = (route) => {
    activeRoute = route;
    const data = updateTopology(route);
    oortCloud?.focusRoute(route.textContent.trim().toLowerCase(), data?.title);
    requestAnimationFrame(() => {
      if (activeRoute === route) updateLine(route);
    });
  };

  const concealRoute = () => {
    activeRoute = null;
    line.classList.remove("is-visible");
    oortCloud?.focusRoute("");
  };

  routes.forEach((route) => {
    route.addEventListener("pointerenter", () => {
      revealRoute(route);
    });
    route.addEventListener("focus", () => {
      revealRoute(route);
    });
    route.addEventListener("pointerleave", concealRoute);
    route.addEventListener("blur", concealRoute);
  });

  window.addEventListener("resize", () => {
    if (activeRoute) {
      updateLine(activeRoute);
    }
  });
}

async function initializeEntryWarmth() {
  const oortCloud = addOortCloud();
  await addGlyphSignals();
  addMicroComets();
  wireRouteConstellations(oortCloud);
  const engine = window.threshold;
  if (!engine) {
    return;
  }
  await engine.boot();
  applySeasonTint(engine.getSeason());
  window.addEventListener("threshold:season-changed", (event) => {
    applySeasonTint(event.detail?.season);
  });
}

initializeEntryWarmth().catch(() => {});