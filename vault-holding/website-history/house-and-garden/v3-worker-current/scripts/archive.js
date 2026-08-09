const ROTATION_KEY = "threshold.engine.poolRotation.v1";

function getRotationMap() {
  try {
    const raw = localStorage.getItem(ROTATION_KEY);
    const map = raw ? JSON.parse(raw) : {};
    if (!map || typeof map !== "object") {
      return {};
    }
    return map;
  } catch (error) {
    return {};
  }
}

function setRotationMap(map) {
  try {
    localStorage.setItem(ROTATION_KEY, JSON.stringify(map));
  } catch (error) {
    // Ignore storage restrictions.
  }
}

function rotatePool(pool, key, fallback) {
  const entries = Array.isArray(pool) ? pool.filter(function (entry) {
    return entry && typeof entry === "object";
  }) : [];

  if (entries.length === 0) {
    return fallback || null;
  }

  const map = getRotationMap();
  const current = Number(map[key] || 0);
  const index = Math.abs(current) % entries.length;
  map[key] = current + 1;
  setRotationMap(map);

  return entries[index] || fallback || null;
}

function resolveChannelNote(wrapper, key) {
  if (!wrapper || typeof wrapper !== "object") {
    return null;
  }

  const fallback = wrapper.note || (wrapper.title || wrapper.excerpt ? wrapper : null);
  return rotatePool(wrapper.notePool, key, fallback);
}

export function createArchiveModule() {
  let cache = null;
  let territoryCache = null;
  let territoryPromise = null;

  async function loadVault() {
    if (cache) {
      return cache;
    }

    try {
      const response = await fetch("data/vault-archive.json", { cache: "no-store" });
      if (!response.ok) {
        cache = null;
        return null;
      }
      cache = await response.json();
      return cache;
    } catch (error) {
      cache = null;
      return null;
    }
  }

  async function loadTerritory(engine) {
    if (territoryCache) {
      return territoryCache;
    }

    if (territoryPromise) {
      return territoryPromise;
    }

    if (engine && typeof engine.loadVault === "function") {
      territoryPromise = engine.loadVault("vault-territory")
        .then(function (payload) {
          territoryCache = payload;
          return territoryCache;
        })
        .catch(function () {
          territoryCache = null;
          return null;
        });
      return territoryPromise;
    }

    territoryPromise = fetch("data/vault-territory.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
      .then(function (payload) {
        territoryCache = payload;
        return territoryCache;
      })
      .catch(function () {
        territoryCache = null;
        return null;
      });

    return territoryPromise;
  }

  function resolveTerritoryChamber(meta, channel) {
    const territory = territoryCache && territoryCache.chambers ? territoryCache.chambers : null;
    if (!territory || typeof territory !== "object") {
      return null;
    }

    const routeKey = meta && meta.route ? String(meta.route).toLowerCase().replace(/-gate$/, "") : "";
    const channelKey = channel === "expand" ? "shimmer" : (channel === "collapse" ? "storm" : channel);

    return territory[routeKey] || territory[channelKey] || territory[channel] || territory.threshold || null;
  }

  function enterArchive(channel, meta, payload) {
    const root = payload && payload.archive ? payload.archive : payload;
    if (!root) {
      return {
        speciesNote: null,
        weatherNote: null,
        chamberNote: null,
        actorNote: null,
        routeMeta: null,
        routeNote: null,
        territoryChamber: null,
        lore: ""
      };
    }

    const speciesWrap = root.species && root.species[channel] ? root.species[channel] : null;
    const weatherWrap = root.weather && root.weather[channel] ? root.weather[channel] : null;
    const chamberWrap = root.chambers && root.chambers[channel] ? root.chambers[channel] : null;
    const actorWrap = root.actors && root.actors[channel] ? root.actors[channel] : null;

    const routeMeta = meta && meta.route && root.routes ? root.routes[meta.route] : null;

    const speciesNote = resolveChannelNote(speciesWrap, "species." + channel);
    const weatherNote = resolveChannelNote(weatherWrap, "weather." + channel);
    const chamberNote = resolveChannelNote(chamberWrap, "chambers." + channel);
    const actorNote = resolveChannelNote(actorWrap, "actors." + channel);
    const routeNote = resolveChannelNote(routeMeta, "routes." + (meta && meta.route ? meta.route : ""));
    const territoryChamber = resolveTerritoryChamber(meta, channel);

    return {
      speciesWrap,
      weatherWrap,
      chamberWrap,
      actorWrap,
      speciesNote,
      weatherNote,
      chamberNote,
      actorNote,
      routeMeta,
      routeNote,
      territoryChamber,
      lore: (routeNote && routeNote.excerpt) || (routeMeta && routeMeta.lore) || ""
    };
  }

  return {
    loadVault,
    loadTerritory,
    enterArchive
  };
}
