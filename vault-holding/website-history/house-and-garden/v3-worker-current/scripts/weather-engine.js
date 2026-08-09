(function () {
  const WEATHER_DATA_PATH = "data/weather-engine.json";

  const state = {
    payload: null,
    activeItem: null,
    activeCycle: "cosmic",
    timer: null,
    widget: null,
    viewer: null,
    seed: Math.floor(Date.now() / 1000)
  };

  const CYCLE_BY_MONTH = [
    "cold", "cold", "wind", "fog", "wind", "heat", "heat", "storm", "fog", "wind", "storm", "cosmic"
  ];

  const PROFILE = {
    storm: { pulse: "violent", drift: "fast", refresh: "chaotic", transition: "sharp" },
    fog: { pulse: "soft", drift: "slow", refresh: "gentle", transition: "fade" },
    heat: { pulse: "bright", drift: "up", refresh: "bloom", transition: "bloom" },
    cold: { pulse: "dim", drift: "down", refresh: "steady", transition: "shrink" },
    wind: { pulse: "airy", drift: "lateral", refresh: "drift", transition: "slide" },
    cosmic: { pulse: "spiral", drift: "orbit", refresh: "ripple", transition: "ripple" }
  };

  function monthCycle() {
    const month = new Date().getMonth();
    return CYCLE_BY_MONTH[month] || "cosmic";
  }

  function detectSeason() {
    const month = new Date().getMonth();
    if (month <= 2) {
      return "soil";
    }
    if (month <= 5) {
      return "fog";
    }
    if (month <= 8) {
      return "shimmer";
    }
    return "storm";
  }

  function broadcastSeason(season) {
    window.dispatchEvent(new CustomEvent("threshold:weather-update", {
      detail: { season, cycle: season }
    }));
  }

  function rotatePick(items) {
    if (!Array.isArray(items) || !items.length) {
      return null;
    }
    state.seed = (state.seed + 7) % 1000000;
    return items[state.seed % items.length];
  }

  function ensureViewer() {
    if (state.viewer) {
      return state.viewer;
    }

    const viewer = document.createElement("section");
    viewer.className = "weather-viewer is-hidden";
    viewer.setAttribute("aria-hidden", "true");
    viewer.innerHTML = [
      '<div class="weather-viewer-backdrop" data-weather-close="1"></div>',
      '<article class="weather-viewer-panel">',
      '  <div class="weather-viewer-head">',
      '    <h3 id="weather-viewer-title">Weather Chamber</h3>',
      '    <button type="button" class="weather-close" data-weather-close="1">Close</button>',
      '  </div>',
      '  <p id="weather-viewer-meta" class="weather-viewer-meta"></p>',
      '  <div class="weather-viewer-body">',
      '    <div class="weather-image-wrap"><img id="weather-viewer-image" alt="Weather asset"></div>',
      '    <div class="weather-viewer-copy">',
      '      <p id="weather-viewer-cycle"></p>',
      '      <p id="weather-viewer-profile"></p>',
      '      <p id="weather-viewer-note"></p>',
      '      <p><a id="weather-viewer-link" href="#" target="_blank" rel="noreferrer">Open Vault Weather Note</a></p>',
      '    </div>',
      '  </div>',
      '</article>'
    ].join("\n");

    document.body.appendChild(viewer);
    viewer.addEventListener("click", function (event) {
      const target = event.target;
      if (target instanceof Element && target.getAttribute("data-weather-close") === "1") {
        closeViewer();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !viewer.classList.contains("is-hidden")) {
        closeViewer();
      }
    });

    state.viewer = viewer;
    return viewer;
  }

  function openViewer() {
    if (!state.activeItem) {
      return;
    }

    const viewer = ensureViewer();
    const title = document.getElementById("weather-viewer-title");
    const meta = document.getElementById("weather-viewer-meta");
    const image = document.getElementById("weather-viewer-image");
    const cycle = document.getElementById("weather-viewer-cycle");
    const profile = document.getElementById("weather-viewer-profile");
    const note = document.getElementById("weather-viewer-note");
    const link = document.getElementById("weather-viewer-link");

    const item = state.activeItem;
    const cycleName = state.activeCycle;
    const weatherProfile = PROFILE[cycleName] || PROFILE.cosmic;

    title.textContent = `${item.element} · ${item.name}`;
    meta.textContent = `${item.category.toUpperCase()} weather chamber`;
    cycle.textContent = `Cycle: ${cycleName} | state: ${item.state}`;
    profile.textContent = `Pulse ${weatherProfile.pulse} · Drift ${weatherProfile.drift} · Transition ${weatherProfile.transition}`;
    note.textContent = item.note && item.note.excerpt ? item.note.excerpt : "Weather note not available for this item.";

    if (item.webPath) {
      image.src = item.webPath;
      image.alt = `${item.name} weather image`;
      image.closest(".weather-image-wrap").classList.remove("is-empty");
    } else {
      image.removeAttribute("src");
      image.alt = "No weather image";
      image.closest(".weather-image-wrap").classList.add("is-empty");
    }

    if (item.note && item.note.obsidianUrl) {
      link.href = item.note.obsidianUrl;
      link.classList.remove("is-disabled");
      link.textContent = "Open Vault Weather Note";
    } else {
      link.href = "#";
      link.classList.add("is-disabled");
      link.textContent = "Vault note unavailable";
    }

    viewer.classList.remove("is-hidden");
    viewer.setAttribute("aria-hidden", "false");
  }

  function closeViewer() {
    if (!state.viewer) {
      return;
    }
    state.viewer.classList.add("is-hidden");
    state.viewer.setAttribute("aria-hidden", "true");
  }

  function weatherItemsForCycle(payload, cycleName) {
    if (!payload || !Array.isArray(payload.items)) {
      return [];
    }

    const ids = payload.cycles && Array.isArray(payload.cycles[cycleName]) ? payload.cycles[cycleName] : [];
    if (!ids.length) {
      return payload.items;
    }

    const idSet = new Set(ids);
    const fromCycle = payload.items.filter((item) => idSet.has(item.id));
    return fromCycle.length ? fromCycle : payload.items;
  }

  function applyWeatherToDocument(item, cycleName) {
    if (!item) {
      return;
    }

    const body = document.body;
    body.dataset.weatherCycle = cycleName;
    body.dataset.weatherCategory = item.category;
    body.dataset.weatherElement = item.element.toLowerCase();
    body.classList.remove(
      "weather-cycle-storm", "weather-cycle-fog", "weather-cycle-heat", "weather-cycle-cold", "weather-cycle-wind", "weather-cycle-cosmic",
      "weather-category-sky", "weather-category-earth", "weather-category-water", "weather-category-fire", "weather-category-light", "weather-category-dark", "weather-category-ethos"
    );
    body.classList.add(`weather-cycle-${cycleName}`);
    body.classList.add(`weather-category-${item.category}`);

    const profile = PROFILE[cycleName] || PROFILE.cosmic;
    body.style.setProperty("--weather-drift-speed", profile.drift === "fast" ? "1.25" : profile.drift === "slow" ? "0.82" : "1");
    body.style.setProperty("--weather-pulse-power", profile.pulse === "violent" ? "1.2" : profile.pulse === "soft" ? "0.78" : "1");

    const detail = {
      cycle: cycleName,
      item,
      profile
    };

    window.dispatchEvent(new CustomEvent("threshold:weather-update", { detail }));

    if (cycleName === "storm") {
      window.dispatchEvent(new CustomEvent("threshold:weather-event", { detail: { type: "stormfront", item } }));
    } else if (cycleName === "fog") {
      window.dispatchEvent(new CustomEvent("threshold:weather-event", { detail: { type: "fog-bloom", item } }));
    } else if (cycleName === "cosmic") {
      window.dispatchEvent(new CustomEvent("threshold:weather-event", { detail: { type: "voidstorm", item } }));
    } else if (cycleName === "heat") {
      window.dispatchEvent(new CustomEvent("threshold:weather-event", { detail: { type: "heatwave", item } }));
    }
  }

  function ensureWidget() {
    if (state.widget) {
      return state.widget;
    }

    const dock = document.createElement("aside");
    dock.className = "weather-dock";
    dock.innerHTML = [
      '<h4>Weather Engine</h4>',
      '<p id="weather-dock-line">Awaiting index...</p>',
      '<div class="weather-dock-actions">',
      '  <button type="button" id="weather-cycle-next">Cycle</button>',
      '  <button type="button" id="weather-open-viewer">Open Weather Chamber</button>',
      '</div>'
    ].join("\n");

    document.body.appendChild(dock);
    const cycleBtn = dock.querySelector("#weather-cycle-next");
    const viewBtn = dock.querySelector("#weather-open-viewer");

    cycleBtn.addEventListener("click", function () {
      stepCycle();
    });

    viewBtn.addEventListener("click", function () {
      openViewer();
    });

    state.widget = dock;
    return dock;
  }

  function updateDockLine() {
    if (!state.widget || !state.activeItem) {
      return;
    }
    const line = state.widget.querySelector("#weather-dock-line");
    line.textContent = `${state.activeCycle.toUpperCase()} · ${state.activeItem.element} · ${state.activeItem.name}`;
  }

  function stepCycle(nextCycle) {
    if (!state.payload || !Array.isArray(state.payload.items) || !state.payload.items.length) {
      return;
    }

    const cycleOrder = ["storm", "fog", "heat", "cold", "wind", "cosmic"];
    if (nextCycle) {
      state.activeCycle = nextCycle;
    } else {
      const idx = cycleOrder.indexOf(state.activeCycle);
      state.activeCycle = cycleOrder[(idx + 1 + cycleOrder.length) % cycleOrder.length];
    }

    const pool = weatherItemsForCycle(state.payload, state.activeCycle);
    state.activeItem = rotatePick(pool) || rotatePick(state.payload.items);
    applyWeatherToDocument(state.activeItem, state.activeCycle);
    updateDockLine();
  }

  function runCycleTimer() {
    if (state.timer) {
      clearInterval(state.timer);
    }

    state.timer = setInterval(function () {
      stepCycle();
    }, 18000);
  }

  function bindReactiveHooks() {
    window.addEventListener("threshold:weather-event", function (event) {
      const detail = event.detail || {};
      if (detail.type === "stormfront") {
        const mythRefresh = document.getElementById("entity-refresh");
        if (mythRefresh) {
          mythRefresh.click();
        }
      }
    });
  }

  function init() {
    fetch(WEATHER_DATA_PATH, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("weather manifest missing");
        }
        return response.json();
      })
      .then(function (payload) {
        state.payload = payload;
        ensureWidget();
        state.activeCycle = monthCycle();
        const pool = weatherItemsForCycle(payload, state.activeCycle);
        state.activeItem = rotatePick(pool) || rotatePick(payload.items);
        applyWeatherToDocument(state.activeItem, state.activeCycle);
        updateDockLine();
        runCycleTimer();
        bindReactiveHooks();
      })
      .catch(function () {
        ensureWidget();
        const line = state.widget.querySelector("#weather-dock-line");
        line.textContent = "Weather index missing. Run build-weather-index.js.";
      });
  }

  const initialSeason = detectSeason();
  broadcastSeason(initialSeason);
  window.threshold = window.threshold || {};
  window.threshold.detectSeason = detectSeason;

  init();
})();
