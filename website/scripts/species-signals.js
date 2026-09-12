(function () {
  const viewer = document.getElementById("myth-viewer");
  const viewerImage = document.getElementById("viewer-image");
  const viewerTitle = document.getElementById("viewer-title");
  const viewerMeta = document.getElementById("viewer-meta");
  const viewerPath = document.getElementById("viewer-path");
  const viewerIndex = document.getElementById("viewer-index");
  const speciesCards = Array.from(document.querySelectorAll("[data-spirit]"));
  const spiritSignals = {
    cindervox: { emotion: "fear", mode: "amplify" },
    porpoise: { emotion: "relief", mode: "amplify" },
    whisperhawk: { emotion: "confusion", mode: "dampen" },
    stonecat: { emotion: "reflection", mode: "amplify" },
    lumenstag: { emotion: "confusion", mode: "dampen" }
  };
  const speciesFallbacks = {
    cindervox: "/vault/glyphs/collapse.png",
    porpoise: "/assets/basin.png",
    whisperhawk: "/vault/glyphs/fog.png",
    stonecat: "/vault/glyphs/soil.png",
    lumenstag: "/vault/glyphs/expand.png"
  };
  let species = {};
  let activeCard = null;

  function speciesName(speciesKey) {
    return speciesKey.charAt(0).toUpperCase() + speciesKey.slice(1);
  }

  function variantsFor(speciesKey) {
    const configured = species[speciesKey];
    if (configured && Object.keys(configured).length) {
      return configured;
    }
    return speciesFallbacks[speciesKey]
      ? { default: speciesFallbacks[speciesKey] }
      : {};
  }

  function selectSpecies(speciesKey, intent) {
    const variants = variantsFor(speciesKey);
    const imagePath = variants[intent] || Object.values(variants)[0];
    if (!imagePath || !viewerImage) {
      return;
    }

    const imageCandidates = window.ThresholdImages.collectCandidates(
      imagePath,
      Object.values(variants),
      speciesFallbacks[speciesKey],
      window.ThresholdImages.defaultCandidates
    );
    window.ThresholdImages.loadWithFallback(viewerImage, imageCandidates);
    viewerImage.alt = speciesName(speciesKey) + " " + intent;
    if (viewerTitle) viewerTitle.textContent = speciesName(speciesKey);
    if (viewerMeta) viewerMeta.textContent = intent.charAt(0).toUpperCase() + intent.slice(1) + " intent";
    if (viewerPath) viewerPath.textContent = imagePath;
    if (viewerIndex) viewerIndex.textContent = intent;
    document.querySelectorAll("[data-species-intent]").forEach(function (button) {
      button.hidden = !variants[button.dataset.speciesIntent];
      button.setAttribute("aria-pressed", String(button.dataset.speciesIntent === intent));
    });
  }

  function openSpecies(speciesKey, intent) {
    const variants = variantsFor(speciesKey);
    if (!viewer || !Object.keys(variants).length) {
      return;
    }
    const requestedIntent = intent || "default";
    const selectedIntent = variants[requestedIntent]
      ? requestedIntent
      : Object.keys(variants)[0];
    activeCard = document.querySelector('[data-spirit="' + speciesKey + '"]');
    selectSpecies(speciesKey, selectedIntent);
    viewer.classList.remove("is-hidden");
    viewer.setAttribute("aria-hidden", "false");
    if (activeCard) activeCard.setAttribute("aria-expanded", "true");
    if (window.ThresholdEmotions && spiritSignals[speciesKey]) {
      window.ThresholdEmotions.interactSpecies({ species: speciesKey, intent: selectedIntent });
      window.ThresholdEmotions.receiveSpiritSignal(Object.assign({
        species: speciesKey,
        amount: 1
      }, spiritSignals[speciesKey]));
    }
  }

  function closeViewer() {
    if (!viewer) {
      return;
    }
    viewer.classList.add("is-hidden");
    viewer.setAttribute("aria-hidden", "true");
    if (activeCard) activeCard.setAttribute("aria-expanded", "false");
    activeCard = null;
  }

  fetch("/species-signals.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("species signal index fetch failed");
      return response.json();
    })
    .then(function (data) {
      species = data || {};
      speciesCards.forEach(function (card) {
        const speciesKey = card.dataset.spirit;
        const variants = variantsFor(speciesKey);
        const preview = card.querySelector(".mythology-image");
        const previewPath = variants.default || Object.values(variants)[0];
        if (preview && previewPath) {
          window.ThresholdImages.loadWithFallback(preview, [
            previewPath,
            speciesFallbacks[speciesKey],
            window.ThresholdImages.defaultCandidates
          ]);
        }
      });
    })
    .catch(function () {
      species = {};
    });

  speciesCards.forEach(function (card) {
    const trigger = card.querySelector(".mythology-text");
    if (!trigger) return;
    trigger.addEventListener("click", function () { openSpecies(card.dataset.spirit, "default"); });
    trigger.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openSpecies(card.dataset.spirit, "default");
      }
    });
  });

  document.querySelectorAll("[data-species-intent]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (activeCard) selectSpecies(activeCard.dataset.spirit, button.dataset.speciesIntent || "default");
    });
  });
  document.querySelectorAll("[data-viewer-close]").forEach(function (control) {
    control.addEventListener("click", closeViewer);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeViewer();
  });

  window.openCindervox = function (intent) { openSpecies("cindervox", intent); };
  window.openPorpoise = function (intent) { openSpecies("porpoise", intent); };
})();