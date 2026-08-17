import { startHubBinding } from "./hub-frontend-binding.js";

const HTMLElementBase = globalThis.HTMLElement ?? class {};
const BIOMES = new Set(["house", "garden", "forest", "deepforest", "root", "stone", "shadow"]);
const CYCLES = new Set(["early", "mid", "late"]);
const INTENSITIES = new Set(["low", "medium", "high"]);
const PULSE_MODES = new Set(["cycle-synced"]);

function themeClass(prefix, value, allowed) {
  const token = String(value || "").toLowerCase().replace(/[\s_]+/g, "");
  return allowed.has(token) ? `${prefix}-${token}` : null;
}

function hasSignal(values) {
  return Array.isArray(values) && values.length > 0;
}

export function hubThemeClasses({ engine = {}, biome = {}, signals = {}, visual = {} } = {}) {
  const intensity = visual.pulse?.intensity || {};
  const container = [
    themeClass("biome", biome.current, BIOMES),
    themeClass("cycle", engine.cycle || intensity.cycle, CYCLES),
    themeClass("drift", intensity.drift, INTENSITIES),
    themeClass("pressure", intensity.pressure, INTENSITIES)
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
    this.#stopBinding ??= startHubBinding(this);
  }

  disconnectedCallback() {
    this.#stopBinding?.();
    this.#stopBinding = null;
  }

  get state() {
    return structuredClone(this.#state);
  }

  setEngine(value) { this.#update("engine", value); }
  setBiome(value) { this.#update("biome", value); }
  setChambers(value) { this.#update("chambers", value); }
  setSignals(value) { this.#update("signals", value); }
  setPlayer(value) { this.#update("player", value); }
  setVisual(value) { this.#update("visual", value); }
  setNavigation(value) { this.#update("navigation", value); }

  #update(domain, value) {
    this.#state[domain] = value;
    this.#render();
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
      const image = element("img");
      image.src = `/assets/${visual.asset}`;
      image.alt = "Threshold Hub glyph";
      visualNode.append(image);
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