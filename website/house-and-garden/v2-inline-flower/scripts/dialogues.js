let dialoguesPromise = null;

async function loadDialogues(engine) {
  if (dialoguesPromise) {
    return dialoguesPromise;
  }

  if (engine && typeof engine.loadVault === "function") {
    dialoguesPromise = engine.loadVault("vault-dialogues").catch(function () {
      return null;
    });
    return dialoguesPromise;
  }

  dialoguesPromise = fetch("data/vault-dialogues.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        return null;
      }
      return response.json();
    })
    .catch(function () {
      return null;
    });

  return dialoguesPromise;
}

function getMappedVoice(bundle, key, season, fallback) {
  if (bundle && bundle[key] && typeof bundle[key] === "object") {
    const value = bundle[key][season];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return fallback;
}

function applySeasonClass(node, season) {
  if (!node) {
    return;
  }

  node.classList.remove("season-fog", "season-shimmer", "season-storm", "season-soil");
  node.classList.add("season-" + season);
}

function replayFade(node) {
  if (!node) {
    return;
  }

  node.classList.remove("fade-in");
  void node.offsetWidth;
  node.classList.add("fade-in");
}

const DialoguesModule = {
  async init(engine) {
    const season = this.detectSeason();
    const data = await loadDialogues(engine);
    const voice = getMappedVoice(data, "season", season, this.getSeasonVoice(season));

    // Seasonal voice
    const seasonNode = document.getElementById("dialogue-season");
    if (seasonNode) {
      seasonNode.innerHTML = voice;
      applySeasonClass(seasonNode, season);
      replayFade(seasonNode);
    }

    // Spirit voice
    if (engine && typeof engine.invokeMythic === "function") {
      engine.invokeMythic({ type: "spirit", season: season });
    }

    // Legacy voice (deep echo)
    const legacy = getMappedVoice(data, "legacy", season, this.getLegacyVoice(season));
    const legacyNode = document.getElementById("dialogue-character");
    if (legacyNode) {
      legacyNode.innerHTML = legacy;
      applySeasonClass(legacyNode, season);
      replayFade(legacyNode);
    }

    // Root machine voice
    const root = getMappedVoice(data, "rootMachine", season, this.getRootVoice(season));
    const rootNode = document.getElementById("dialogue-root");
    if (rootNode) {
      rootNode.innerHTML = root;
      applySeasonClass(rootNode, season);
      replayFade(rootNode);
    }

    const voiceNode = document.getElementById("dialogue-voice");
    if (voiceNode) {
      const runtimeVoice = getMappedVoice(data, "voice", season, "Voice channel active: " + season + ".");
      voiceNode.innerHTML = runtimeVoice;
      applySeasonClass(voiceNode, season);
      replayFade(voiceNode);
    }
  },

  detectSeason() {
    const hour = new Date().getHours();
    if (hour < 6) return "soil";
    if (hour < 12) return "fog";
    if (hour < 18) return "shimmer";
    return "storm";
  },

  getSeasonVoice(season) {
    const map = {
      fog: "The mist remembers beginnings.",
      shimmer: "Light expands where attention rests.",
      storm: "Pressure reveals the shape of truth.",
      soil: "Roots hold what the surface forgets."
    };
    return map[season];
  },

  getLegacyVoice(season) {
    const map = {
      fog: "Whisperer: 'Clarity is a visitor, not a resident.'",
      shimmer: "Lumen Keeper: 'Expansion without ego becomes illumination.'",
      storm: "Architect of Ruin: 'Collapse is the doorway to form.'",
      soil: "Archivist: 'Memory is the slowest kind of light.'"
    };
    return map[season];
  },

  getRootVoice(season) {
    const map = {
      fog: "Drift: 'Movement without direction is still movement.'",
      shimmer: "Resonance: 'Everything vibrates toward alignment.'",
      storm: "Collapse: 'Pressure is the architect of change.'",
      soil: "Anchor: 'Stillness is a kind of strength.'"
    };
    return map[season];
  }
};

export default DialoguesModule;
