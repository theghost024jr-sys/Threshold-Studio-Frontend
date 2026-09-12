(function (root) {
  const bindings = new WeakMap();
  const defaultCandidates = Object.freeze([
    "/assets/vault/5b8218c41ed2.png",
    "/assets/basin.png",
    "/vault/glyphs/expand.png",
    "/vault/glyphs/soil.png"
  ]);

  function collectCandidates() {
    const candidates = [];

    function add(value) {
      if (Array.isArray(value)) {
        value.forEach(add);
        return;
      }
      if (value && typeof value === "object") {
        add(value.webPath || value.asset);
        return;
      }
      if (typeof value !== "string") {
        return;
      }
      const candidate = value.trim();
      if (candidate && !candidates.includes(candidate)) {
        candidates.push(candidate);
      }
    }

    Array.from(arguments).forEach(add);
    return candidates;
  }

  function candidatesFor(record, fallbacks = defaultCandidates) {
    return collectCandidates(record && record.assets, record && record.asset, fallbacks);
  }

  function loadWithFallback(image, candidates, options = {}) {
    const previousBinding = bindings.get(image);
    if (previousBinding) {
      previousBinding.destroy();
    }

    const queue = collectCandidates(candidates);
    let index = -1;

    function advance() {
      index += 1;
      if (index >= queue.length) {
        image.removeAttribute("src");
        image.hidden = true;
        image.dataset.imageState = "unavailable";
        if (typeof options.onExhausted === "function") {
          options.onExhausted(image);
        }
        return null;
      }

      image.hidden = false;
      image.dataset.imageState = index === 0 ? "preferred" : "fallback";
      image.dataset.imageFallbackIndex = String(index);
      image.src = queue[index];
      return queue[index];
    }

    function markLoaded() {
      image.hidden = false;
      image.dataset.imageState = index === 0 ? "loaded" : "fallback-loaded";
    }

    image.addEventListener("error", advance);
    image.addEventListener("load", markLoaded);
    advance();

    const binding = {
      candidates: queue,
      destroy() {
        image.removeEventListener("error", advance);
        image.removeEventListener("load", markLoaded);
        if (bindings.get(image) === binding) {
          bindings.delete(image);
        }
      }
    };
    bindings.set(image, binding);
    return binding;
  }

  root.ThresholdImages = Object.freeze({
    defaultCandidates,
    collectCandidates,
    candidatesFor,
    loadWithFallback
  });
})(globalThis);