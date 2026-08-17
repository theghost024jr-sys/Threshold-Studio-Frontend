import { startGardenBinding } from "./garden-frontend-binding.js";
import {
  applyGardenAnimation,
  gardenAnimationSettled,
  gardenAnimationState,
  smoothGardenAnimation
} from "./garden-animation-binding.js";

export {
  applyGardenCalibration,
  GARDEN_FEED_CALIBRATION,
  gardenAnimationState,
  lerp,
  smoothGardenAnimation,
  updateGardenAnimation
} from "./garden-animation-binding.js";

const HTMLElementBase = globalThis.HTMLElement ?? class {};
const GROWTH_STAGES = new Set(["seeded", "sprouting", "branching", "stable"]);
const PRESSURE_LEVELS = new Set(["local", "moving", "systemic"]);
const BIOMES = new Set(["house", "garden", "forest", "deepforest", "root", "stone", "shadow"]);

function classToken(prefix, value, allowed) {
  const token = String(value || "").toLowerCase().replace(/[\s_]+/g, "");
  return allowed.has(token) ? `${prefix}-${token}` : null;
}

function pressureLevel(value) {
  if (!Number.isFinite(value) || value < 0.3) return "local";
  if (value < 0.7) return "moving";
  return "systemic";
}

export function gardenThemeClasses({ growth = {}, pressureSpread = {}, biomeShift = {}, environmentSignals = {} } = {}) {
  const container = [
    classToken("growth", growth.stage, GROWTH_STAGES),
    classToken("pressure", pressureLevel(pressureSpread.intensity), PRESSURE_LEVELS),
    classToken("biome", biomeShift.to || biomeShift.from, BIOMES)
  ].filter(Boolean);
  if ((environmentSignals.warnings?.length || 0) > 0) container.push("environment-warning");
  if ((environmentSignals.active?.length || 0) > 0 || (environmentSignals.transitions?.length || 0) > 0) {
    container.push("environment-speaking");
  }
  return container;
}

function displayValue(value) {
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "None";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return value ?? "None";
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function stateSection(title, className, rows) {
  const section = element("section", `garden-organ-section ${className}`);
  section.append(element("h2", "garden-organ-heading", title));
  const list = element("dl", "garden-organ-readout");
  for (const [label, value] of rows) {
    list.append(element("dt", null, label), element("dd", null, displayValue(value)));
  }
  section.append(list);
  return section;
}

export class ThresholdGardenElement extends HTMLElementBase {
  #animationCurrent = null;
  #animationFrame = null;
  #animationTarget = null;
  #stopBinding = null;
  #visualAsset = null;
  #visualLoading = false;
  #visualRequest = 0;
  #visualSvg = null;
  #state = {
    growth: {},
    adjacency: {},
    driftCapture: {},
    pressureSpread: {},
    biomeShift: {},
    environmentSignals: {},
    visual: {},
    navigation: { routes: [] }
  };

  connectedCallback() {
    this.#render();
    void this.#loadVisualAsset(this.#state.visual);
    this.#stopBinding ??= startGardenBinding(this);
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

  setGrowth(value) { this.#update("growth", value); }
  setAdjacency(value) { this.#update("adjacency", value); }
  setDriftCapture(value) { this.#update("driftCapture", value); }
  setPressureSpread(value) { this.#update("pressureSpread", value); }
  setBiomeShift(value) { this.#update("biomeShift", value); }
  setEnvironmentSignals(value) { this.#update("environmentSignals", value); }
  setVisual(value) {
    this.#update("visual", value);
    void this.#loadVisualAsset(value);
  }
  setNavigation(value) { this.#update("navigation", value); }

  updateGardenAnimation(feeds) {
    this.#animationTarget = gardenAnimationState(feeds);
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
    const svg = typeof this.querySelector === "function" ? this.querySelector(".garden-inline-glyph") : null;
    if (svg && this.#animationCurrent) applyGardenAnimation(svg, this.#animationCurrent);
  }

  #scheduleAnimationFrame() {
    if (this.#animationFrame !== null || !this.#animationTarget) return;
    if (typeof globalThis.requestAnimationFrame !== "function") {
      this.#animationCurrent = smoothGardenAnimation(this.#animationCurrent, this.#animationTarget);
      this.#applyAnimationState();
      return;
    }
    this.#animationFrame = requestAnimationFrame(() => {
      this.#animationFrame = null;
      this.#animationCurrent = smoothGardenAnimation(this.#animationCurrent, this.#animationTarget);
      this.#applyAnimationState();
      if (!gardenAnimationSettled(this.#animationCurrent, this.#animationTarget)) {
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
      if (!response.ok) throw new Error(`Garden visual unavailable (${response.status})`);
      const parsed = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
      const svg = parsed.documentElement;
      if (svg.localName !== "svg" || parsed.querySelector("parsererror")) {
        throw new Error("Garden visual is not valid SVG");
      }
      if (request !== this.#visualRequest || this.#state.visual.asset !== asset) return;
      svg.classList.add("garden-inline-glyph");
      svg.dataset.asset = asset;
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      this.#visualSvg = svg;
      this.#render();
    } catch (error) {
      console.error("Garden visual error:", error);
    } finally {
      if (request === this.#visualRequest) this.#visualLoading = false;
    }
  }

  #render() {
    if (typeof this.replaceChildren !== "function" || !globalThis.document) return;
    const state = this.#state;
    const theme = gardenThemeClasses(state);
    const shell = element("section", ["garden-organ", "garden-container", ...theme].join(" "));

    const header = element("header", "garden-organ-header");
    const titleGroup = element("div", "garden-title-group");
    titleGroup.append(
      element("p", "eyebrow", "Live organ / Environmental feed"),
      element("h1", "garden-organ-title", "Garden"),
      element("p", "garden-organ-subtitle", "World ecology, chamber seeding, and Fib Flower outer-ring state")
    );
    const visualNode = element("div", "garden-organ-visual");
    if (state.visual.assetExists) {
      const existingSvg = typeof this.querySelector === "function"
        ? this.querySelector(`.garden-inline-glyph[data-asset="${state.visual.asset}"]`)
        : null;
      const svg = existingSvg || (this.#visualSvg && this.#visualAsset === state.visual.asset
        ? document.importNode(this.#visualSvg, true)
        : null);
      if (svg) {
        visualNode.setAttribute("role", "img");
        visualNode.setAttribute("aria-label", "Animated Garden Fib Flower");
        if (!this.#animationCurrent) {
          this.#animationCurrent = gardenAnimationState({
            growth: state.growth,
            adjacency: state.adjacency,
            "drift-capture": state.driftCapture,
            "pressure-spread": state.pressureSpread,
            "biome-shift": state.biomeShift,
            "environment-signals": state.environmentSignals
          });
          this.#animationTarget = { ...this.#animationCurrent };
        }
        applyGardenAnimation(svg, this.#animationCurrent);
        visualNode.append(svg);
      } else {
        const image = element("img");
        image.src = `/assets/${state.visual.asset}`;
        image.alt = "Animated Garden Fib Flower";
        visualNode.append(image);
      }
    } else {
      visualNode.textContent = displayValue(state.visual.fallback);
      visualNode.dataset.fallback = "true";
    }
    header.append(titleGroup, visualNode);

    const grid = element("div", "garden-organ-grid");
    grid.append(
      stateSection("Growth", "garden-growth", [
        ["Rate", state.growth.rate], ["Stage", state.growth.stage], ["Stability", state.growth.stability],
        ["Seeded chambers", state.growth.seededChambers]
      ]),
      stateSection("Adjacency", "garden-adjacency", [
        ["Density", state.adjacency.density], ["Connected chambers", state.adjacency.chambers],
        ["Fib outer petals", state.adjacency.outerRingPetals]
      ]),
      stateSection("Drift capture", "garden-drift", [
        ["Capture rate", state.driftCapture.rate], ["Captured nodes", state.driftCapture.capturedNodes],
        ["Available nodes", state.driftCapture.availableNodes]
      ]),
      stateSection("Pressure spread", "garden-pressure", [
        ["Intensity", state.pressureSpread.intensity], ["Direction", state.pressureSpread.direction],
        ["Affected biomes", state.pressureSpread.affectedBiomes]
      ]),
      stateSection("Biome shift", "garden-biome", [
        ["From", state.biomeShift.from], ["To", state.biomeShift.to], ["Progress", state.biomeShift.progress]
      ]),
      stateSection("Environment signals", "garden-signals", [
        ["Active", state.environmentSignals.active], ["Warnings", state.environmentSignals.warnings],
        ["Transitions", state.environmentSignals.transitions]
      ])
    );

    const navigation = element("nav", "garden-navigation");
    navigation.setAttribute("aria-label", "Garden environmental routes");
    navigation.append(element("h2", "garden-organ-heading", "Environmental routes"));
    const routes = element("ul");
    for (const route of state.navigation.routes || []) {
      const item = element("li");
      const link = element("a", null, route);
      link.href = route;
      item.append(link);
      routes.append(item);
    }
    navigation.append(routes);
    shell.append(header, grid, navigation);
    this.replaceChildren(shell);
  }
}

if (globalThis.customElements && !customElements.get("threshold-garden")) {
  customElements.define("threshold-garden", ThresholdGardenElement);
}