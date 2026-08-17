import { startHubBinding } from "./hub-frontend-binding.js";

const HTMLElementBase = globalThis.HTMLElement ?? class {};
const BIOMES = new Set(["house", "garden", "forest", "deepforest", "root", "stone", "shadow"]);
const CYCLES = new Set(["early", "mid", "late"]);
const INTENSITIES = new Set(["low", "medium", "high"]);
const PULSE_MODES = new Set(["cycle-synced"]);
export const HUB_FEED_CALIBRATION = Object.freeze({
  smoothingAlpha: 0.15,
  settleEpsilon: 0.001,
  cycleSeconds: { early: 6, mid: 4, late: 2 },
  driftScales: { low: [1, 1.03], medium: [1, 1.06], high: [1, 1.1] },
  pressureOpacities: { soft: [0.1, 0.25], tense: [0.25, 0.45], critical: [0.45, 0.7] },
  adjacency: { arrayMaximum: 4, biomeSeconds: [16, 8], phaseSeconds: [0, -4] },
  signals: {
    quiet: { haloSeconds: 2.4, strokeWidth: 8, opacityBoost: 0 },
    pulse: { haloSeconds: 1.6, strokeWidth: 10, opacityBoost: 0.1 },
    burst: { haloSeconds: 0.8, strokeWidth: 14, opacityBoost: 0.2 }
  }
});
const ANIMATION_NUMBER_KEYS = [
  "cycleSeconds",
  "coreMinScale",
  "coreMaxScale",
  "haloLowOpacity",
  "haloMidOpacity",
  "haloHighOpacity",
  "haloSeconds",
  "haloStrokeWidth",
  "biomeSeconds",
  "biomeDelaySeconds",
  "adjacencyNormalized"
];

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

function pressureLevel(value) {
  if (value < 1) return "soft";
  if (value < 3) return "tense";
  return "critical";
}

function signalMode(signals) {
  if (typeof signals === "string" && Object.hasOwn(HUB_FEED_CALIBRATION.signals, signals)) return signals;
  if (hasSignal(signals?.warnings) || hasSignal(signals?.distortions)) return "burst";
  if (countSignals(signals) > 0) return "pulse";
  return "quiet";
}

function normalizedAdjacency(adjacency) {
  if (typeof adjacency === "number" && Number.isFinite(adjacency)) return clamp(adjacency, 0, 1);
  if (Array.isArray(adjacency)) {
    return clamp(adjacency.length / HUB_FEED_CALIBRATION.adjacency.arrayMaximum, 0, 1);
  }
  return 0;
}

export function hubAnimationState({ cycle, drift, pressure, adjacency = [], signals = {} } = {}) {
  const normalizedDrift = Number.isFinite(drift) ? clamp(drift, 0, 5) : 0;
  const normalizedPressure = Number.isFinite(pressure) ? clamp(pressure, 0, 5) : 0;
  const driftLevel = engineLevel(normalizedDrift, "low");
  const tensionLevel = pressureLevel(normalizedPressure);
  const adjacencyNormalized = normalizedAdjacency(adjacency);
  const mode = signalMode(signals);
  const [coreMinScale, coreMaxScale] = HUB_FEED_CALIBRATION.driftScales[driftLevel];
  const [haloLow, haloHigh] = HUB_FEED_CALIBRATION.pressureOpacities[tensionLevel];
  const signalRule = HUB_FEED_CALIBRATION.signals[mode];
  const haloLowOpacity = clamp(haloLow + signalRule.opacityBoost, 0, 1);
  const haloHighOpacity = clamp(haloHigh + signalRule.opacityBoost, 0, 1);

  return {
    cycleSeconds: HUB_FEED_CALIBRATION.cycleSeconds[cycle] || HUB_FEED_CALIBRATION.cycleSeconds.early,
    driftLevel,
    coreMinScale,
    coreMaxScale,
    pressureLevel: tensionLevel,
    haloLowOpacity,
    haloMidOpacity: (haloLowOpacity + haloHighOpacity) / 2,
    haloHighOpacity,
    haloSeconds: signalRule.haloSeconds,
    haloStrokeWidth: signalRule.strokeWidth,
    biomeSeconds: lerp(...HUB_FEED_CALIBRATION.adjacency.biomeSeconds, adjacencyNormalized),
    biomeDelaySeconds: lerp(...HUB_FEED_CALIBRATION.adjacency.phaseSeconds, adjacencyNormalized),
    adjacencyNormalized,
    signalMode: mode
  };
}

export function lerp(previousValue, newValue, alpha = HUB_FEED_CALIBRATION.smoothingAlpha) {
  return previousValue + (newValue - previousValue) * alpha;
}

export function smoothHubAnimation(previous, target, alpha = HUB_FEED_CALIBRATION.smoothingAlpha) {
  if (!previous) return { ...target };
  const smoothed = { ...target };
  for (const key of ANIMATION_NUMBER_KEYS) {
    smoothed[key] = lerp(previous[key], target[key], alpha);
  }
  return smoothed;
}

function animationSettled(current, target) {
  return ANIMATION_NUMBER_KEYS.every((key) => (
    Math.abs(current[key] - target[key]) <= HUB_FEED_CALIBRATION.settleEpsilon
  ));
}

function applyHubAnimation(svg, animation) {
  const cycle = svg?.querySelector?.("#hub-cycle-ring");
  const core = svg?.querySelector?.("#hub-core");
  const biome = svg?.querySelector?.("#hub-biome-ring");
  const halo = svg?.querySelector?.("#hub-halo");

  cycle?.style.setProperty("animation-duration", `${animation.cycleSeconds.toFixed(3)}s`);
  core?.style.setProperty("--hub-core-min-scale", animation.coreMinScale.toFixed(3));
  core?.style.setProperty("--hub-core-max-scale", animation.coreMaxScale.toFixed(3));
  biome?.style.setProperty("animation-duration", `${animation.biomeSeconds.toFixed(3)}s`);
  biome?.style.setProperty("animation-delay", `${animation.biomeDelaySeconds.toFixed(3)}s`);
  halo?.style.setProperty("--hub-halo-low-opacity", animation.haloLowOpacity.toFixed(3));
  halo?.style.setProperty("--hub-halo-mid-opacity", animation.haloMidOpacity.toFixed(3));
  halo?.style.setProperty("--hub-halo-high-opacity", animation.haloHighOpacity.toFixed(3));
  halo?.style.setProperty("animation-duration", `${animation.haloSeconds.toFixed(3)}s`);
  halo?.style.setProperty("stroke-width", `${animation.haloStrokeWidth.toFixed(3)}px`);

  if (core) core.dataset.drift = animation.driftLevel;
  if (biome) biome.dataset.adjacency = animation.adjacencyNormalized.toFixed(3);
  if (halo) {
    halo.dataset.pressure = animation.pressureLevel;
    halo.dataset.signals = animation.signalMode;
  }
  return animation;
}

export function updateHubAnimation(svg, feeds, previous = null, alpha = 1) {
  const target = hubAnimationState(feeds);
  const animation = smoothHubAnimation(previous, target, alpha);
  return applyHubAnimation(svg, animation);
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
  #animationCurrent = null;
  #animationFrame = null;
  #animationTarget = null;
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
    if (this.#animationFrame !== null && typeof globalThis.cancelAnimationFrame === "function") {
      cancelAnimationFrame(this.#animationFrame);
    }
    this.#animationFrame = null;
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
    this.#animationTarget = hubAnimationState(feeds);
    if (!this.#animationCurrent) {
      this.#animationCurrent = { ...this.#animationTarget };
      this.#applyAnimationState();
      return;
    }
    this.#scheduleAnimationFrame();
  }

  #update(domain, value) {
    this.#state[domain] = value;
    this.#render();
  }

  #applyAnimationState() {
    const svg = typeof this.querySelector === "function" ? this.querySelector(".hub-inline-glyph") : null;
    if (svg && this.#animationCurrent) applyHubAnimation(svg, this.#animationCurrent);
  }

  #scheduleAnimationFrame() {
    if (this.#animationFrame !== null || !this.#animationTarget) return;
    if (typeof globalThis.requestAnimationFrame !== "function") {
      this.#animationCurrent = smoothHubAnimation(this.#animationCurrent, this.#animationTarget);
      this.#applyAnimationState();
      return;
    }

    this.#animationFrame = requestAnimationFrame(() => {
      this.#animationFrame = null;
      this.#animationCurrent = smoothHubAnimation(this.#animationCurrent, this.#animationTarget);
      this.#applyAnimationState();
      if (!animationSettled(this.#animationCurrent, this.#animationTarget)) {
        this.#scheduleAnimationFrame();
      } else {
        this.#animationCurrent = { ...this.#animationTarget };
        this.#applyAnimationState();
      }
    });
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
        if (!this.#animationCurrent) {
          this.#animationCurrent = hubAnimationState({
            cycle: engine.cycle,
            drift: engine.drift,
            pressure: engine.pressure,
            adjacency: chambers.adjacent,
            signals
          });
          this.#animationTarget = { ...this.#animationCurrent };
        }
        applyHubAnimation(svg, this.#animationCurrent);
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