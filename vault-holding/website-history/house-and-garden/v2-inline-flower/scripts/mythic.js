const SPIRIT_FALLBACK = {
  fog: "The Deer",
  expand: "The Whale",
  collapse: "The Wolf",
  soil: "The Bear",
  threshold: "The Witness"
};

const GUARDIAN_FALLBACK = {
  fog: "The Whisperer",
  expand: "The Lumen Keeper",
  collapse: "The Architect of Ruin",
  soil: "The Archivist",
  threshold: "The Threshold Keeper"
};

let mythicData = null;
let mythicLoadPromise = null;
let interactionsData = null;
let interactionsLoadPromise = null;

function toSeason(channel) {
  if (channel === "expand") {
    return "shimmer";
  }
  if (channel === "collapse") {
    return "storm";
  }
  if (channel === "soil") {
    return "soil";
  }
  if (channel === "fog") {
    return "fog";
  }
  return "threshold";
}

function getMappedLabel(group, season) {
  if (!group || typeof group !== "object") {
    return "";
  }

  const value = group[season] || group.threshold || "";
  return typeof value === "string" ? value : "";
}

function loadMythicData(engine) {
  if (mythicLoadPromise) {
    return mythicLoadPromise;
  }

  if (engine && typeof engine.loadVault === "function") {
    mythicLoadPromise = engine.loadVault("vault-mythic")
      .then(function (payload) {
        mythicData = payload;
        return mythicData;
      })
      .catch(function () {
        mythicData = null;
        return null;
      });
    return mythicLoadPromise;
  }

  mythicLoadPromise = fetch("data/vault-mythic.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        return null;
      }
      return response.json();
    })
    .then(function (payload) {
      mythicData = payload;
      return mythicData;
    })
    .catch(function () {
      mythicData = null;
      return null;
    });

  return mythicLoadPromise;
}

function loadInteractionsData(engine) {
  if (interactionsLoadPromise) {
    return interactionsLoadPromise;
  }

  if (engine && typeof engine.loadVault === "function") {
    interactionsLoadPromise = engine.loadVault("vault-interactions")
      .then(function (payload) {
        interactionsData = payload;
        return interactionsData;
      })
      .catch(function () {
        interactionsData = null;
        return null;
      });
    return interactionsLoadPromise;
  }

  interactionsLoadPromise = fetch("data/vault-interactions.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        return null;
      }
      return response.json();
    })
    .then(function (payload) {
      interactionsData = payload;
      return interactionsData;
    })
    .catch(function () {
      interactionsData = null;
      return null;
    });

  return interactionsLoadPromise;
}

function resolveInteraction(season, chamber) {
  if (!interactionsData || !interactionsData.matrix) {
    return null;
  }

  const seasonMatrix = interactionsData.matrix[season] || interactionsData.matrix.threshold || null;
  if (!seasonMatrix || typeof seasonMatrix !== "object") {
    return null;
  }

  const chamberKey = String(chamber || "").toLowerCase().replace(/-gate$/, "");
  return seasonMatrix[chamberKey] || seasonMatrix.threshold || null;
}

export function createMythicModule(engine) {
  function applyInteraction(interaction) {
    const node = document.getElementById("dialogue-root");
    if (!node || !interaction) {
      return;
    }

    if (interaction && typeof interaction === "object" && interaction.text) {
      node.textContent = String(interaction.text);
      return;
    }

    if (typeof interaction === "string") {
      node.textContent = interaction;
    }
  }

  function apply(channel, selection, context) {
    const spiritNode = document.getElementById("spirit-animal");
    const guardianNode = document.getElementById("legacy-character");

    const season = context && context.season ? String(context.season) : toSeason(channel);
    const chamber = context && context.chamber
      ? String(context.chamber)
      : (selection && selection.territoryChamber && selection.territoryChamber.id ? selection.territoryChamber.id : channel);
    const mappedSpirit = getMappedLabel(mythicData && mythicData.spirit, season);
    const mappedGuardian = getMappedLabel(mythicData && mythicData.legacy, season);
    const interaction = resolveInteraction(season, chamber);

    const spirit = selection && selection.speciesWrap && selection.speciesWrap.spirit
      ? selection.speciesWrap.spirit
      : mappedSpirit
        ? mappedSpirit
      : SPIRIT_FALLBACK[channel] || SPIRIT_FALLBACK.threshold;

    const guardian = selection && selection.actorWrap && selection.actorWrap.guardian
      ? selection.actorWrap.guardian
      : mappedGuardian
        ? mappedGuardian
      : GUARDIAN_FALLBACK[channel] || GUARDIAN_FALLBACK.threshold;

    if (spiritNode) {
      spiritNode.setAttribute("data-label", spirit);
      spiritNode.setAttribute("aria-label", spirit);
    }

    if (guardianNode) {
      guardianNode.setAttribute("data-label", guardian);
      guardianNode.setAttribute("aria-label", guardian);
    }

    applyInteraction(interaction);

    if (!mythicData) {
      loadMythicData(engine).then(function () {
        if (mythicData) {
          apply(channel, selection, context);
        }
      });
    }

    if (!interactionsData) {
      loadInteractionsData(engine).then(function () {
        if (interactionsData) {
          apply(channel, selection, context);
        }
      });
    }
  }

  loadMythicData(engine);
  loadInteractionsData(engine);

  return {
    apply
  };
}
