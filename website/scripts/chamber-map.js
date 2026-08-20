const CHAMBER_NODES = [
  {
    id: "root",
    name: "Root Sigil / Home",
    glyph: "*",
    href: "index.html",
    x: 50,
    y: 50,
    vaultPath: "C:/Threshold/ThresholdVault/theghost/Chambers/Root Sigil.md",
    orientation: "Axis Anchor",
    pulse: "0.95",
    element: "Aether",
    description: "Primary orientation chamber and return axis for all routes.",
    cluster: "voice",
    tier: "circle",
    drift: { x: 0.7, y: 0.55 }
  },
  {
    id: "dialogues",
    name: "Dialogues",
    glyph: "~",
    href: "dialogues.html",
    x: 36,
    y: 25,
    vaultPath: "C:/Threshold/ThresholdVault/theghost/Chambers/Dialogues.md",
    orientation: "Voice Weave",
    pulse: "0.81",
    element: "Air",
    description: "Voice fragments branch into echoes, links, and return paths.",
    cluster: "voice",
    tier: "circle",
    drift: { x: 1.05, y: 0.72 }
  },
  {
    id: "mythology",
    name: "Mythology",
    glyph: "M",
    href: "mythology.html",
    x: 66,
    y: 24,
    vaultPath: "C:/Threshold/ThresholdVault/theghost/Chambers/Mythology.md",
    orientation: "Spirit Current",
    pulse: "0.74",
    element: "Fire",
    description: "Entity stories, chambers of origin, and cosmology carriers.",
    cluster: "myth",
    tier: "circle",
    drift: { x: 0.9, y: 0.66 }
  },
  {
    id: "glyphs",
    name: "Glyphs",
    glyph: "G",
    href: "glyphs.html",
    x: 23,
    y: 43,
    vaultPath: "C:/Threshold/ThresholdVault/theghost/Chambers/Glyphs.md",
    orientation: "Symbol Lattice",
    pulse: "0.69",
    element: "Light",
    description: "Glyph anchors and symbol families that bind chamber states.",
    cluster: "archive",
    tier: "circle",
    drift: { x: 0.75, y: 0.6 }
  },
  {
    id: "learning-wheel",
    name: "Learning Wheel",
    glyph: "W",
    href: "learningwheel.html",
    x: 77,
    y: 43,
    vaultPath: "C:/Threshold/ThresholdVault/theghost/Chambers/Learning Wheel.md",
    orientation: "Cycle Engine",
    pulse: "0.77",
    element: "Metal",
    description: "Iterative growth routes and rotating practice arcs.",
    cluster: "myth",
    tier: "circle",
    drift: { x: 0.95, y: 0.83 }
  },
  {
    id: "ledger",
    name: "Ledger",
    glyph: "L",
    href: "ledger.html",
    x: 32,
    y: 68,
    vaultPath: "C:/Threshold/ThresholdVault/theghost/Chambers/Ledger.md",
    orientation: "Memory Archive",
    pulse: "0.65",
    element: "Earth",
    description: "Record layer for traces, outcomes, and state transitions.",
    cluster: "archive",
    tier: "circle",
    drift: { x: 0.82, y: 0.67 }
  },
  {
    id: "house-garden",
    name: "House and Garden",
    glyph: "H",
    href: "housegarden.html",
    x: 68,
    y: 68,
    vaultPath: "C:/Threshold/ThresholdVault/theghost/Chambers/House and Garden.md",
    orientation: "Habitat Motion",
    pulse: "0.79",
    element: "Water",
    description: "Environmental drift, growth behaviors, and embodied weather.",
    cluster: "habitat",
    tier: "branch-node",
    drift: { x: 1.08, y: 0.74 }
  },
  {
    id: "ethos",
    name: "Ethos",
    glyph: "E",
    href: "ethos.html",
    x: 44,
    y: 83,
    vaultPath: "C:/Threshold/ThresholdVault/theghost/Chambers/Ethos.md",
    orientation: "Guiding Law",
    pulse: "0.58",
    element: "Stone",
    description: "Principles, doctrine lines, and cohesion law framing.",
    cluster: "archive",
    tier: "circle",
    drift: { x: 0.7, y: 0.52 }
  },
  {
    id: "invitation",
    name: "Invitation",
    glyph: "I",
    href: "invitation.html",
    x: 56,
    y: 83,
    vaultPath: "C:/Threshold/ThresholdVault/theghost/Chambers/Invitation.md",
    orientation: "Arrival Gate",
    pulse: "0.62",
    element: "Mist",
    description: "Onboarding threshold and welcome vector into the world.",
    cluster: "habitat",
    tier: "circle",
    drift: { x: 0.78, y: 0.58 }
  }
];

const ANCHOR_GLYPHS = [
  { glyph: "<>", x: 12, y: 18 },
  { glyph: "::", x: 84, y: 17 },
  { glyph: "o", x: 10, y: 82 },
  { glyph: "x", x: 88, y: 84 },
  { glyph: "*", x: 50, y: 9 }
];

const CHAMBER_CONNECTIONS = [
  ["root", "dialogues"],
  ["root", "mythology"],
  ["root", "glyphs"],
  ["root", "learning-wheel"],
  ["root", "ledger"],
  ["root", "house-garden"],
  ["root", "ethos"],
  ["root", "invitation"],
  ["dialogues", "mythology"],
  ["dialogues", "glyphs"],
  ["glyphs", "learning-wheel"],
  ["learning-wheel", "ledger"],
  ["ledger", "house-garden"],
  ["ethos", "invitation"],
  ["mythology", "house-garden"]
];

const nodeLayer = document.getElementById("node-layer");
const anchorLayer = document.getElementById("anchor-layer");
const connectionLayer = document.getElementById("connection-layer");
const svgNs = "http://www.w3.org/2000/svg";
const metaPanel = {
  name: document.getElementById("meta-name"),
  description: document.getElementById("meta-description"),
  orientation: document.getElementById("meta-orientation"),
  pulse: document.getElementById("meta-pulse"),
  element: document.getElementById("meta-element"),
  vaultStatus: document.getElementById("meta-vault-status"),
  vaultPath: document.getElementById("meta-vault-path"),
  related: document.getElementById("meta-related"),
  enter: document.getElementById("meta-enter"),
  vault: document.getElementById("meta-vault")
};

const runtime = {
  vaultName: "theghost",
  indexNodes: [],
  chamberEntities: {
    mythology: { count: 0, label: "creatures" },
    dialogues: { count: 0, label: "characters" },
    ethos: { count: 0, label: "archetypes" },
    invitation: { count: 0, label: "guides" }
  },
  breathTick: 0
};

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function vaultRelativeFromAbsolute(path) {
  const marker = "theghost/";
  const normalized = String(path || "").replace(/\\/g, "/");
  const idx = normalized.toLowerCase().indexOf(marker);
  if (idx < 0) {
    return normalized;
  }
  return normalized.slice(idx + marker.length);
}

function buildObsidianUrl(path) {
  const relative = vaultRelativeFromAbsolute(path);
  return `obsidian://open?vault=${encodeURIComponent(runtime.vaultName)}&file=${encodeURIComponent(relative)}`;
}

function loadVaultIndex() {
  return fetch("vault-search-index.json", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => {
      if (!payload || !Array.isArray(payload.nodes)) {
        return;
      }

      runtime.vaultName = payload.vaultName || runtime.vaultName;
      runtime.indexNodes = payload.nodes;
    })
    .catch(() => {
      runtime.indexNodes = [];
    });
}

function loadChamberEntitySignals() {
  const mythologyRequest = fetch("data/mythology-assets.json", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);

  const humanoidRequest = fetch("data/humanoid-triad.json", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);

  return Promise.all([mythologyRequest, humanoidRequest]).then(([mythology, humanoids]) => {
    runtime.chamberEntities.mythology.count = Number(mythology && mythology.entityCount ? mythology.entityCount : 0);

    const counts = humanoids && humanoids.counts ? humanoids.counts : {};
    runtime.chamberEntities.dialogues.count = Number(counts.dialogues || 0);
    runtime.chamberEntities.ethos.count = Number(counts.ethos || 0);
    runtime.chamberEntities.invitation.count = Number(counts.invitation || 0);
  });
}

function resolveVaultMatch(node) {
  const byName = normalize(node.name);
  const fallbackPathKey = normalize(vaultRelativeFromAbsolute(node.vaultPath));

  const matched = runtime.indexNodes.find((entry) => {
    const title = normalize(entry.title);
    const path = normalize(entry.path);
    return title === byName || title.includes(byName) || path.includes(byName) || path.includes(fallbackPathKey);
  });

  if (!matched) {
    return {
      exists: false,
      path: node.vaultPath,
      relatedCount: 0
    };
  }

  return {
    exists: true,
    path: matched.path,
    relatedCount: (matched.links || []).length + (matched.backlinks || []).length
  };
}

function decorateVaultStatus() {
  CHAMBER_NODES.forEach((node) => {
    const match = resolveVaultMatch(node);
    const chamberSignal = runtime.chamberEntities[node.id];
    node.vaultExists = match.exists;
    node.vaultResolvedPath = match.path;
    node.relatedCount = match.relatedCount;

    if (chamberSignal && chamberSignal.count > 0) {
      node.entityCount = chamberSignal.count;
      node.entityLabel = chamberSignal.label;
    } else {
      node.entityCount = 0;
      node.entityLabel = "entities";
    }
  });
}

function setPanelNode(node) {
  metaPanel.name.textContent = node.name;
  metaPanel.description.textContent = node.description;
  metaPanel.orientation.textContent = node.orientation;
  metaPanel.pulse.textContent = node.pulse;
  metaPanel.element.textContent = node.element;
  metaPanel.vaultPath.textContent = node.vaultResolvedPath || node.vaultPath;
  if (node.entityCount > 0) {
    metaPanel.related.textContent = `${node.relatedCount || 0} links + ${node.entityCount} ${node.entityLabel}`;
  } else {
    metaPanel.related.textContent = String(node.relatedCount || 0);
  }

  metaPanel.enter.href = node.href;
  metaPanel.vault.href = buildObsidianUrl(node.vaultResolvedPath || node.vaultPath);

  if (node.vaultExists) {
    metaPanel.vaultStatus.textContent = "Vault note linked";
    metaPanel.vaultStatus.classList.add("ok");
    metaPanel.vaultStatus.classList.remove("missing");
    metaPanel.vault.classList.remove("is-disabled");
  } else {
    metaPanel.vaultStatus.textContent = "Vault note missing";
    metaPanel.vaultStatus.classList.add("missing");
    metaPanel.vaultStatus.classList.remove("ok");
    metaPanel.vault.classList.add("is-disabled");
  }
}

function renderConnections() {
  CHAMBER_CONNECTIONS.forEach(([from, to]) => {
    const line = document.createElementNS(svgNs, "line");
    line.classList.add("connection-line");
    line.setAttribute("data-from", from);
    line.setAttribute("data-to", to);
    connectionLayer.appendChild(line);
  });
}

function renderAnchorGlyphs() {
  ANCHOR_GLYPHS.forEach((anchor) => {
    const marker = document.createElement("span");
    marker.className = "anchor-glyph";
    marker.textContent = anchor.glyph;
    marker.style.left = `${anchor.x}%`;
    marker.style.top = `${anchor.y}%`;
    anchorLayer.appendChild(marker);
  });
}

function nodeCenterById(id) {
  const node = document.querySelector(`.chamber-node[data-node-id="${id}"]`);
  if (!node) {
    return null;
  }

  const core = node.querySelector(".node-core");
  const coreWidth = core ? core.offsetWidth : 64;
  const coreHeight = core ? core.offsetHeight : 64;
  const xPercent = Number(node.style.left.replace("%", ""));
  const yPercent = Number(node.style.top.replace("%", ""));
  const width = nodeLayer.clientWidth;
  const height = nodeLayer.clientHeight;

  return {
    x: width * (xPercent / 100),
    y: height * (yPercent / 100),
    radiusX: coreWidth / 2,
    radiusY: coreHeight / 2
  };
}

function updateConnectionPositions() {
  const lines = connectionLayer.querySelectorAll(".connection-line");
  lines.forEach((line) => {
    const fromId = line.getAttribute("data-from");
    const toId = line.getAttribute("data-to");
    const from = nodeCenterById(fromId);
    const to = nodeCenterById(toId);

    if (!from || !to) {
      return;
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const fromX = from.x + (dx / len) * from.radiusX;
    const fromY = from.y + (dy / len) * from.radiusY;
    const toX = to.x - (dx / len) * to.radiusX;
    const toY = to.y - (dy / len) * to.radiusY;

    line.setAttribute("x1", fromX.toFixed(2));
    line.setAttribute("y1", fromY.toFixed(2));
    line.setAttribute("x2", toX.toFixed(2));
    line.setAttribute("y2", toY.toFixed(2));
  });
}

function createNodeElement(node) {
  const link = document.createElement("a");
  link.className = "chamber-node";
  link.href = node.href;
  link.setAttribute("data-node-id", node.id);
  link.setAttribute("data-base-x", String(node.x));
  link.setAttribute("data-base-y", String(node.y));
  link.setAttribute("data-vault-path", node.vaultPath);
  link.setAttribute("aria-label", `${node.name} chamber`);
  link.classList.add(`cluster-${node.cluster || "voice"}`);
  if (node.tier) {
    link.setAttribute("data-node-tier", node.tier);
  }

  const vector = node.drift || { x: 0.8, y: 0.65 };
  const vectorAngle = Math.atan2(vector.y, vector.x) * (180 / Math.PI);
  link.style.setProperty("--vector-angle", `${vectorAngle.toFixed(2)}deg`);

  const core = document.createElement("div");
  core.className = "node-core";
  core.textContent = node.glyph;

  const label = document.createElement("span");
  label.className = "node-label";
  label.textContent = node.name;

  link.style.left = `${node.x}%`;
  link.style.top = `${node.y}%`;

  if (node.vaultExists) {
    link.classList.add("vault-present");
  } else {
    link.classList.add("vault-missing");
  }

  link.addEventListener("mouseenter", () => setPanelNode(node));
  link.addEventListener("focus", () => setPanelNode(node));

  link.appendChild(core);
  link.appendChild(label);
  return link;
}

function renderNodes() {
  CHAMBER_NODES.forEach((node) => {
    const element = createNodeElement(node);
    element.addEventListener("mousedown", () => {
      element.classList.add("active-click");
      setTimeout(() => element.classList.remove("active-click"), 240);
    });
    nodeLayer.appendChild(element);
  });
}

function animateDrift() {
  const nodes = Array.from(document.querySelectorAll(".chamber-node"));
  const phaseMap = new Map(nodes.map((node, idx) => [node, Math.random() * Math.PI * 2 + idx]));

  function frame(now) {
    const t = now * 0.00032;

    nodes.forEach((node, idx) => {
      const baseX = Number(node.getAttribute("data-base-x"));
      const baseY = Number(node.getAttribute("data-base-y"));
      const phase = phaseMap.get(node) || 0;
      const nodeId = node.getAttribute("data-node-id");
      const profile = CHAMBER_NODES.find((item) => item.id === nodeId);
      const driftProfile = profile && profile.drift ? profile.drift : { x: 0.8, y: 0.65 };

      const driftX = Math.sin(t + phase) * driftProfile.x;
      const driftY = Math.cos(t * 1.1 + phase + idx * 0.2) * driftProfile.y;

      node.style.left = `${baseX + driftX}%`;
      node.style.top = `${baseY + driftY}%`;
    });

    updateConnectionPositions();

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function startBreathCycle() {
  setInterval(() => {
    runtime.breathTick += 1;
    const inhale = runtime.breathTick % 2 === 0;
    document.body.classList.toggle("inhale", inhale);
    document.body.classList.toggle("exhale", !inhale);
  }, 4400);
}

function init() {
  Promise.all([loadVaultIndex(), loadChamberEntitySignals()]).finally(() => {
    decorateVaultStatus();
    renderAnchorGlyphs();
    renderConnections();
    renderNodes();
    animateDrift();
    startBreathCycle();
    setPanelNode(CHAMBER_NODES[0]);
  });
}

(function () {
  const canvas = document.getElementById("chamber-map-canvas");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener("resize", resize);

  function draw() {
    ctx.clearRect(0, 0, width, height);

    CHAMBER_NODES.forEach((node) => {
      const pulse = (node.pulse || 0.5) * 0.02;
      const r = 10 + Math.sin((Date.now() / 1000) * 2 + pulse * 40) * 3;
      ctx.beginPath();
      ctx.arc((node.x / 100) * width, (node.y / 100) * height, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "14px sans-serif";
      ctx.fillText(node.id, (node.x / 100) * width + 16, (node.y / 100) * height + 4);
    });

    requestAnimationFrame(draw);
  }

  draw();

  window.addEventListener("threshold:weather-update", (event) => {
    const season = event && event.detail ? event.detail.cycle || event.detail.season : "";
    const factor = season === "storm" ? 0.04 : season === "shimmer" ? 0.02 : season === "soil" ? 0.01 : season === "fog" ? 0.03 : 0.02;
    CHAMBER_NODES.forEach((node) => {
      node.pulse = Number(node.pulse || 0.5) + factor;
    });
  });
})();

window.addEventListener("resize", updateConnectionPositions);
init();
