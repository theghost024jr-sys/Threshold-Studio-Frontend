const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function clampUnit(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : 0;
}

export function normalizeGlyphSignals(signals = {}) {
  return Object.freeze({
    resonance: clampUnit(signals.resonance),
    drift: clampUnit(signals.drift),
    anchored: signals.anchored === true,
  });
}

export function resolveGlyphState(signals) {
  const normalized = normalizeGlyphSignals(signals);
  if (normalized.anchored && normalized.drift <= 0.25) return "anchored";
  if (normalized.drift >= 0.65) return "drifting";
  if (normalized.resonance >= 0.7) return "resonant";
  return "stable";
}

export class GlyphRegistry {
  #definitions = new Map();

  register(definition) {
    if (!definition?.id || !Array.isArray(definition.elements) || !definition.elements.length) {
      throw new TypeError("Glyph definition requires an id and SVG elements");
    }
    if (this.#definitions.has(definition.id)) {
      throw new Error(`Glyph "${definition.id}" is already registered`);
    }

    const stored = Object.freeze({
      ...definition,
      viewBox: definition.viewBox || "0 0 128 128",
      elements: Object.freeze(definition.elements.map((element) => Object.freeze({ ...element }))),
    });
    this.#definitions.set(stored.id, stored);
    return stored;
  }

  get(id) {
    return this.#definitions.get(id) || null;
  }

  has(id) {
    return this.#definitions.has(id);
  }

  list() {
    return Array.from(this.#definitions.keys());
  }
}

function createSvgElement(descriptor) {
  const element = document.createElementNS(SVG_NAMESPACE, descriptor.tag);
  Object.entries(descriptor.attributes || {}).forEach(([name, value]) => {
    element.setAttribute(name, String(value));
  });
  if (descriptor.className) element.setAttribute("class", descriptor.className);
  return element;
}

export class GlyphSystem {
  #registry;

  constructor(registry) {
    this.#registry = registry;
  }

  mount(target, options = {}) {
    if (!(target instanceof Element)) throw new TypeError("Glyph target must be a DOM element");
    const definition = this.#registry.get(options.glyphId);
    if (!definition) throw new Error(`Unknown glyph "${options.glyphId}"`);

    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    svg.setAttribute("viewBox", definition.viewBox);
    svg.setAttribute("class", "threshold-glyph");
    svg.setAttribute("aria-hidden", "true");
    definition.elements.forEach((descriptor) => svg.append(createSvgElement(descriptor)));
    target.replaceChildren(svg);

    const instance = {
      definition,
      target,
      svg,
      binding: Object.freeze({
        nodeId: options.nodeId || null,
        flowerId: options.flowerId || null,
        identityVectorId: options.identityVectorId || null,
      }),
      signals: normalizeGlyphSignals(options.signals),
      state: "stable",
    };

    const update = (signals) => {
      instance.signals = normalizeGlyphSignals(signals);
      instance.state = resolveGlyphState(instance.signals);
      target.dataset.glyphState = instance.state;
      target.style.setProperty("--glyph-resonance", instance.signals.resonance);
      target.style.setProperty("--glyph-drift", instance.signals.drift);
      target.style.setProperty("--glyph-anchored", Number(instance.signals.anchored));
      return instance;
    };

    const announceInteraction = () => {
      window.dispatchEvent(new CustomEvent("threshold:glyph-interaction", {
        detail: { glyphId: definition.id, glyphState: instance.state, ...instance.binding },
      }));
    };

    target.dataset.glyphId = definition.id;
    target.addEventListener("pointerenter", announceInteraction);
    instance.update = update;
    instance.destroy = () => {
      target.removeEventListener("pointerenter", announceInteraction);
      target.replaceChildren();
    };
    return update(instance.signals);
  }
}

export const glyphRegistry = new GlyphRegistry();

glyphRegistry.register({
  id: "field-signal",
  elements: [
    { tag: "circle", className: "glyph-ring glyph-ring--outer", attributes: { cx: 64, cy: 64, r: 48 } },
    { tag: "circle", className: "glyph-ring glyph-ring--middle", attributes: { cx: 64, cy: 64, r: 34 } },
    { tag: "circle", className: "glyph-ring glyph-ring--inner", attributes: { cx: 64, cy: 64, r: 20 } },
    { tag: "path", className: "glyph-axis", attributes: { d: "M64 9V119M9 64H119" } },
    { tag: "path", className: "glyph-core", attributes: { d: "M64 52L76 64L64 76L52 64Z" } },
  ],
});

export const glyphSystem = new GlyphSystem(glyphRegistry);