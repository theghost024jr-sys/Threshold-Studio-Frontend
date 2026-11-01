(function () {
  const viewer = document.getElementById("myth-viewer");
  const viewerImage = document.getElementById("viewer-image");
  const viewerTitle = document.getElementById("viewer-title");
  const viewerMeta = document.getElementById("viewer-meta");
  const viewerPath = document.getElementById("viewer-path");
  const viewerIndex = document.getElementById("viewer-index");
  const cindervoxEncounter = document.getElementById("cindervox-encounter");
  const cindervoxEncounterCopy = document.getElementById("cindervox-encounter-copy");
  const cindervoxConsequence = document.getElementById("cindervox-consequence");
  const cindervoxCanyonLink = document.getElementById("cindervox-canyon-link");
  const whisperhawkSignal = document.getElementById("whisperhawk-signal");
  const whisperhawkSignalCopy = document.getElementById("whisperhawk-signal-copy");
  const whisperhawkConsequence = document.getElementById("whisperhawk-consequence");
  const whisperMap = document.getElementById("whisper-map");
  const whisperhawkScanControls = document.querySelectorAll("[data-whisperhawk-scan]");
  const owlStillwatch = document.getElementById("owl-stillwatch");
  const circuitMirror = document.getElementById("circuit-mirror");
  const mirrorInput = document.getElementById("mirror-input");
  const mirrorReflection = document.getElementById("mirror-reflection");
  const mirrorDifference = document.getElementById("mirror-difference");
  const mirrorDemand = document.getElementById("mirror-demand");
  const mirrorPressure = document.getElementById("mirror-pressure");
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
  let cindervoxChoice = null;

  function playWhisperhawkSignal() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }

    const context = new AudioContext();
    const now = context.currentTime;
    const gain = context.createGain();
    const oscillator = context.createOscillator();
    const tremolo = context.createOscillator();
    const tremoloGain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(384, now);
    oscillator.frequency.exponentialRampToValueAtTime(612, now + 0.62);
    oscillator.frequency.exponentialRampToValueAtTime(470, now + 1.3);

    tremolo.type = "sine";
    tremolo.frequency.setValueAtTime(6.5, now);
    tremoloGain.gain.setValueAtTime(42, now);
    tremolo.connect(tremoloGain);
    tremoloGain.connect(oscillator.frequency);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    tremolo.start(now);
    oscillator.stop(now + 1.32);
    tremolo.stop(now + 1.32);
    oscillator.addEventListener("ended", function () {
      context.close();
    });
  }

  function updateCindervoxEncounter(speciesKey) {
    if (!cindervoxEncounter) {
      return;
    }

    const isCindervox = speciesKey === "cindervox";
    cindervoxEncounter.hidden = !isCindervox;
    if (!isCindervox) {
      return;
    }

    if (!cindervoxChoice) {
      cindervoxEncounterCopy.textContent = "The boundary hums. What is your movement?";
      cindervoxConsequence.textContent = "A choice opens a consequence field. Waiting remains available.";
      cindervoxCanyonLink.hidden = true;
    }
  }

  function updateWhisperhawkSignal(speciesKey) {
    if (!whisperhawkSignal) {
      return;
    }

    whisperhawkSignal.hidden = speciesKey !== "whisperhawk";
    if (speciesKey === "whisperhawk") {
      whisperhawkSignal.classList.remove("is-traced");
      whisperhawkSignalCopy.textContent = "A faint streak scans across the layers before its meaning resolves.";
      whisperhawkConsequence.textContent = "The pattern is still forming.";
      if (whisperMap) {
        whisperMap.hidden = true;
      }
      whisperhawkScanControls.forEach(function (control) {
        control.textContent = "Trace the shift";
      });
    }
  }

  function updateOwlStillwatch(speciesKey) {
    if (owlStillwatch) {
      owlStillwatch.hidden = speciesKey !== "owl";
    }
  }

  function updateCircuitMirror(speciesKey, intent) {
    if (!circuitMirror) {
      return;
    }

    const readings = {
      whisperhawk: {
        input: "Air signal; a pre-manifest resonance shift.",
        reflection: "A long, angled scan across layers.",
        difference: "The pattern is visible before the event resolves.",
        demand: "Interpret through context before movement.",
        pressure: "Soft signal · early drift"
      },
      "cindervox:passive": {
        input: "Passive Cindervox signal.",
        reflection: "Resonance listening and containment.",
        difference: "Environmental pressure remains beside collapse.",
        demand: "Hold the boundary while pressure dissipates.",
        pressure: "Dampened · contained"
      },
      "cindervox:signal": {
        input: "Ember signal.",
        reflection: "Catalytic activation and boundary sharpening.",
        difference: "Latent signal becomes active force.",
        demand: "A decisive vector gathers at the threshold.",
        pressure: "High · accelerated"
      },
      "cindervox:default": {
        input: "Cindervox at the threshold.",
        reflection: "A low-grade shimmer modulates pressure.",
        difference: "The boundary is active without a fixed vector.",
        demand: "Listen before ignition or containment.",
        pressure: "Present · unresolved"
      }
    };
    const reading = readings[speciesKey + ":" + intent] || readings[speciesKey];
    circuitMirror.hidden = !reading;
    if (!reading) {
      return;
    }

    mirrorInput.textContent = reading.input;
    mirrorReflection.textContent = reading.reflection;
    mirrorDifference.textContent = reading.difference;
    mirrorDemand.textContent = reading.demand;
    mirrorPressure.textContent = reading.pressure;
  }

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
    if (viewerPath) viewerPath.textContent = "Archive image available for this orientation.";
    if (viewerIndex) viewerIndex.textContent = intent;
    updateCindervoxEncounter(speciesKey);
    updateWhisperhawkSignal(speciesKey);
    updateOwlStillwatch(speciesKey);
    updateCircuitMirror(speciesKey, intent);
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
  document.querySelectorAll("[data-cindervox-choice]").forEach(function (control) {
    control.addEventListener("click", function () {
      cindervoxChoice = control.dataset.cindervoxChoice;
      if (cindervoxChoice === "hold") {
        selectSpecies("cindervox", "passive");
        cindervoxEncounterCopy.textContent = "Passive does not mean absent. Cindervox listens, absorbs environmental pressure, and buffers the edge of collapse.";
        cindervoxConsequence.textContent = "A passive field gathers: listening, pressure absorption, and containment beside collapse.";
        cindervoxCanyonLink.hidden = false;
      } else if (cindervoxChoice === "cross") {
        selectSpecies("cindervox", "signal");
        cindervoxEncounterCopy.textContent = "Ember turns latent signal into active force. The canyon sharpens a path toward decisive action.";
        cindervoxConsequence.textContent = "An Ember field gathers: ignition, sharpened boundaries, and acceleration with a risk of overexposure.";
        cindervoxCanyonLink.hidden = false;
      } else {
        selectSpecies("cindervox", "default");
        cindervoxEncounterCopy.textContent = "Cindervox remains at the threshold. Nothing is forced into motion.";
        cindervoxConsequence.textContent = "No vector is fixed. The field stays open for a later movement.";
        cindervoxCanyonLink.hidden = true;
      }
      document.querySelectorAll("[data-cindervox-choice]").forEach(function (button) {
        button.setAttribute("aria-pressed", String(button === control));
      });
    });
  });
  whisperhawkScanControls.forEach(function (control) {
    control.addEventListener("click", function () {
      if (!whisperhawkSignal) {
        return;
      }
      playWhisperhawkSignal();
      whisperhawkSignal.classList.add("is-traced");
      whisperhawkSignalCopy.textContent = "The thin line widens briefly. A resonance shift is visible before it manifests.";
      whisperhawkConsequence.textContent = "Early warning: the pattern points across the field without fixing your movement.";
      if (whisperMap) {
        whisperMap.hidden = false;
      }
      control.textContent = "Trace the shift again";
    });
    document.querySelectorAll("[data-whisperhawk-stillwatch]").forEach(function (control) {
      control.addEventListener("click", function () {
        openSpecies("owl", "default");
      });
    });
    document.querySelectorAll("[data-owl-return]").forEach(function (control) {
      control.addEventListener("click", function () {
        openSpecies("whisperhawk", "default");
      });
    });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeViewer();
  });

  window.openCindervox = function (intent) { openSpecies("cindervox", intent); };
  window.openPorpoise = function (intent) { openSpecies("porpoise", intent); };
})();