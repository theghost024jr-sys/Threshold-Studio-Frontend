import { startHubBinding } from "./hub-frontend-binding.js";

const HTMLElementBase = globalThis.HTMLElement ?? class {};
const BIOMES = new Set(["house", "garden", "forest", "deepforest", "root", "stone", "shadow"]);
const CYCLES = new Set(["early", "mid", "late"]);
const INTENSITIES = new Set(["low", "medium", "high"]);
const PULSE_MODES = new Set(["cycle-synced"]);
const CYCLE_DURATIONS = new Map([["early", "4s"], ["mid", "3s"], ["late", "2s"]]);

function themeClass(prefix, value, allowed) {
  const token = String(value || "").toLowerCase().replace(/[\s_]+/g, "");
  return allowed.has(token) ? `${prefix}-${token}` : null;
}

function hasSignal(values) {
  return Array.isArray(values) && values.length > 0;
}

function engineLevel(value, fallback) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  if (value < 1) return "low";
  if (value < 3) return "medium";
  return "high";
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function countSignals(signals) {
  if (Array.isArray(signals)) return signals.length;
  return ["active", "warnings", "distortions", "environmental"]
    .reduce((total, key) => total + (Array.isArray(signals?.[key]) ? signals[key].length : 0), 0);
}

export function hubAnimationState({ cycle, drift, pressure, adjacency = [], signals = {} } = {}) {
  const driftLevel = engineLevel(drift, "low");
  const coreScale = { low: 1, medium: 1.05, high: 1.1 }[driftLevel];
  const pressureOpacity = Number.isFinite(pressure) ? clamp(pressure / 5, 0, 1) : 0;
  const adjacencyCount = Array.isArray(adjacency) ? adjacency.length : 0;
  const signalCount = countSignals(signals);
  const signalBoost = signalCount > 0 ? 0.15 : 0;

  return {
    cycleDuration: CYCLE_DURATIONS.get(cycle) || CYCLE_DURATIONS.get("early"),
    driftLevel,
    coreMinScale: (coreScale * 0.96).toFixed(3),
    coreMaxScale: (coreScale * 1.04).toFixed(3),
    pressureOpacity,
    haloLowOpacity: clamp(0.08 + pressureOpacity * 0.42, 0, 1).toFixed(3),
    haloMidOpacity: clamp(0.18 + pressureOpacity * 0.52 + signalBoost, 0, 1).toFixed(3),
    haloHighOpacity: clamp(0.2 + pressureOpacity * 0.65 + signalBoost, 0, 1).toFixed(3),
    haloDuration: `${Math.max(0.6, 2.4 - signalCount * 0.25)}s`,
    haloStrokeWidth: `${8 + Math.min(signalCount, 4) * 2}px`,
    biomeDuration: `${Math.max(6, 16 - adjacencyCount * 2)}s`,
    biomeDelay: `${-adjacencyCount}s`,
    adjacencyCount,
    signalCount
  };
}

export function updateHubAnimation(svg, feeds) {
  const animation = hubAnimationState(feeds);
  const cycle = svg?.querySelector?.("#hub-cycle-ring");
  const core = svg?.querySelector?.("#hub-engine-core");
  const biome = svg?.querySelector?.("#hub-biome-ring");
  const halo = svg?.querySelector?.("#hub-signal-halo");

  cycle?.style.setProperty("animation-duration", animation.cycleDuration);
  core?.style.setProperty("--hub-core-min-scale", animation.coreMinScale);
  core?.style.setProperty("--hub-core-max-scale", animation.coreMaxScale);
  biome?.style.setProperty("animation-duration", animation.biomeDuration);
  biome?.style.setProperty("animation-delay", animation.biomeDelay);
  halo?.style.setProperty("--hub-halo-low-opacity", animation.haloLowOpacity);
  halo?.style.setProperty("--hub-halo-mid-opacity", animation.haloMidOpacity);
  halo?.style.setProperty("--hub-halo-high-opacity", animation.haloHighOpacity);
  halo?.style.setProperty("animation-duration", animation.haloDuration);
  halo?.style.setProperty("stroke-width", animation.haloStrokeWidth);

  if (core) core.dataset.drift = animation.driftLevel;
  if (biome) biome.dataset.adjacency = String(animation.adjacencyCount);
  if (halo) {
    halo.dataset.pressure = String(animation.pressureOpacity);
    halo.dataset.signals = String(animation.signalCount);
  }
  return animation;
}

export function hubThemeClasses({ engine = {}, biome = {}, signals = {}, visual = {} } = {}) {
  const intensity = visual.pulse?.intensity || {};
  const container = [
    themeClass("biome", biome.current, BIOMES),
    themeClass("cycle", engine.cycle || intensity.cycle, CYCLES),
    themeClass("drift", engineLevel(engine.drift, intensity.drift), INTENSITIES),
    themeClass("pressure", engineLevel(engine.pressure, intensity.pressure), INTENSITIES)
  ].filter(Boolean);

  if (hasSignal(signals.warnings) || hasSignal(signals.distortions) || hasSignal(signals.environmental)) {
    container.push("signal-warning");
  }

  return {
    container,
    visual: [themeClass("pulse", visual.pulse?.mode, PULSE_MODES)].filter(Boolean)
  };
}

function displayValue(value) {
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "None";
  return value ?? "—";
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function stateSection(title, className, rows) {
  const section = element("section", `hub-organ-section ${className}`);
  section.append(element("h2", "hub-organ-heading", title));
  const list = element("dl", "hub-organ-readout");
  for (const [label, value] of rows) {
    list.append(
      element("dt", null, label),
      element("dd", null, displayValue(value))
    );
  }
  section.append(list);
  return section;
}

export class ThresholdHubElement extends HTMLElementBase {
  #stopBinding = null;
  #visualAsset = null;
  #visualLoading = false;
  #visualRequest = 0;
  #visualSvg = null;
  #state = {
    engine: {},
    biome: {},
    chambers: {},
    signals: {},
    player: {},
    visual: {},
    navigation: { routes: [] }
  };

  connectedCallback() {
    this.#render();
    void this.#loadVisualAsset(this.#state.visual);
    this.#stopBinding ??= startHubBinding(this);
  }

  disconnectedCallback() {
    this.#stopBinding?.();
    this.#stopBinding = null;
    this.#visualRequest += 1;
    this.#visualLoading = false;
  }

  get state() {
    return structuredClone(this.#state);
  }

  setEngine(value) { this.#update("engine", value); }
  setBiome(value) { this.#update("biome", value); }
  setChambers(value) { this.#update("chambers", value); }
  setSignals(value) { this.#update("signals", value); }
  setPlayer(value) { this.#update("player", value); }
  setVisual(value) {
    this.#update("visual", value);
    void this.#loadVisualAsset(value);
  }
  setNavigation(value) { this.#update("navigation", value); }

  updateHubAnimation(feeds) {
    const svg = typeof this.querySelector === "function" ? this.querySelector(".hub-inline-glyph") : null;
    if (svg) updateHubAnimation(svg, feeds);
  }

  #update(domain, value) {
    this.#state[domain] = value;
    this.#render();
  }

  async #loadVisualAsset(visual = {}) {
    const asset = visual.asset;
    if (!visual.assetExists || typeof asset !== "string" || !asset.endsWith(".svg")) return;
    if (typeof globalThis.fetch !== "function" || typeof globalThis.DOMParser !== "function") return;
    if (this.#visualAsset === asset && (this.#visualSvg || this.#visualLoading)) return;

    const request = ++this.#visualRequest;
    this.#visualAsset = asset;
    this.#visualSvg = null;
    this.#visualLoading = true;

    try {
      const response = await fetch(`/assets/${asset}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Hub visual unavailable (${response.status})`);
      const parsed = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
      const svg = parsed.documentElement;
      if (svg.localName !== "svg" || parsed.querySelector("parsererror")) {
        throw new Error("Hub visual is not valid SVG");
      }
      if (request !== this.#visualRequest || this.#state.visual.asset !== asset) return;

      svg.classList.add("hub-inline-glyph");
      svg.dataset.asset = asset;
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      this.#visualSvg = svg;
      this.#render();
    } catch (error) {
      console.error("Hub visual error:", error);
    } finally {
      if (request === this.#visualRequest) this.#visualLoading = false;
    }
  }

  #render() {
    if (typeof this.replaceChildren !== "function" || !globalThis.document) return;

    const { engine, biome, chambers, signals, player, visual, navigation } = this.#state;
    const theme = hubThemeClasses({ engine, biome, signals, visual });
    const shell = element("section", ["hub-organ", "hub-container", ...theme.container].join(" "));
    shell.style.setProperty("--hub-biome-color", biome.color || "var(--teal)");

    const header = element("header", "hub-organ-header");
    const titleGroup = element("div");
    titleGroup.append(
      element("p", "eyebrow", "Live organ / Engine feed"),
      element("h2", "hub-organ-title", "World state")
    );
    const visualNode = element("div", ["hub-organ-visual", "hub-visual", ...theme.visual].join(" "));
    if (visual.assetExists) {
      const existingSvg = typeof this.querySelector === "function"
        ? this.querySelector(`.hub-inline-glyph[data-asset="${visual.asset}"]`)
        : null;
      const svg = existingSvg || (this.#visualSvg && this.#visualAsset === visual.asset
        ? document.importNode(this.#visualSvg, true)
        : null);
      if (svg) {
        visualNode.setAttribute("role", "img");
        visualNode.setAttribute("aria-label", "Animated Hub Glyph");
        updateHubAnimation(svg, {
          cycle: engine.cycle,
          drift: engine.drift,
          pressure: engine.pressure,
          adjacency: chambers.adjacent,
          signals
        });
        visualNode.append(svg);
      } else {
        const image = element("img");
        image.src = `/assets/${visual.asset}`;
        image.alt = "Animated Hub Glyph";
        visualNode.append(image);
      }
    } else {
      visualNode.textContent = displayValue(visual.fallback);
      visualNode.dataset.fallback = "true";
    }
    header.append(titleGroup, visualNode);

    const grid = element("div", "hub-organ-grid");
    grid.append(
      stateSection("Engine", "hub-engine", [
        ["Drift", engine.drift],
        ["Pressure", engine.pressure],
        ["Cycle", engine.cycle],
        ["Position", engine.cyclePosition],
        ["World", engine.worldState]
      ]),
      stateSection("Biome", "hub-biome", [
        ["Current", biome.current],
        ["Color", biome.color]
      ]),
      stateSection("Chambers", "hub-chambers", [
        ["Adjacent", chambers.adjacent],
        ["Reachable", chambers.reachable],
        ["Recent", chambers.recent]
      ]),
      stateSection("Signals", "hub-signals", [
        ["Active", signals.active],
        ["Warnings", signals.warnings],
        ["Distortions", signals.distortions]
      ]),
      stateSection("Traveler", "hub-player", [
        ["Role", player.role],
        ["State", player.state],
        ["Location", player.location]
      ])
    );

    const routeSection = element("nav", "hub-organ-routes hub-navigation");
    routeSection.setAttribute("aria-label", "Hub-owned routes");
    routeSection.append(element("h2", "hub-organ-heading", "Routes"));
    const routeList = element("ul");
    for (const route of navigation.routes || []) {
      const item = element("li");
      const link = element("a", null, route);
      link.href = route;
      item.append(link);
      routeList.append(item);
    }
    routeSection.append(routeList);

    shell.append(header, grid, routeSection);
    this.replaceChildren(shell);
  }
}

if (globalThis.customElements && !customElements.get("threshold-hub")) {
  customElements.define("threshold-hub", ThresholdHubElement);
}