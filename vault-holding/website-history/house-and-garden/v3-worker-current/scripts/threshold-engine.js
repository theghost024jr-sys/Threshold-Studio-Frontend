const TARGET_IDS = [
  "cave",
  "stairs",
  "weather-fog",
  "weather-shimmer",
  "weather-storm",
  "weather-soil",
  "spirit-animal",
  "legacy-character",
  "shimmer-glyphs",
  "project-chamber"
];

const BRANCH_IDS = [
  "rootSigil",
  "home",
  "ethos",
  "glyphs",
  "learningWheel",
  "ledger",
  "dialogues",
  "mythology",
  "houseGarden",
  "invitation",
  "contact"
];

class ThresholdBranch {
  constructor(id, render) {
    this.id = id;
    this.visible = true;
    this.state = "stable";
    this.payload = null;
    this.render = render;
  }

  hide() {
    this.visible = false;
    this.state = "hidden";
    this.render(this);
  }

  reveal() {
    this.visible = true;
    this.state = "stable";
    this.payload = null;
    this.render(this);
  }

  pulse() {
    const self = this;
    this.state = "pulsing";
    this.render(this);
    window.setTimeout(function () {
      self.state = "stable";
      self.render(self);
    }, 800);
  }

  alter(payload) {
    this.state = "altered";
    this.payload = payload || null;
    this.render(this);
  }
}

class ThresholdBranchEngine {
  constructor(engine) {
    this.engine = engine;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) {
      return this;
    }

    const render = this.engine.renderBranch.bind(this.engine);
    this.engine.branches = {};

    BRANCH_IDS.forEach((id) => {
      this.engine.branches[id] = new ThresholdBranch(id, render);
      render(this.engine.branches[id]);
    });

    this.initialized = true;
    return this;
  }

  ids() {
    return Object.keys(this.engine.branches || {});
  }

  pickBranch(explicitId) {
    const pool = this.ids();
    if (pool.length === 0) {
      return null;
    }

    const id = explicitId && this.engine.branches[explicitId]
      ? explicitId
      : pool[Math.floor(Math.random() * pool.length)];

    return this.engine.branches[id] || null;
  }
}

class ThresholdGlyphEngine {
  constructor(engine, branchEngine) {
    this.engine = engine;
    this.branchEngine = branchEngine;
    this.initialized = false;
    this.enabled = false;
    this.boundHandler = this.handleGlyphInteraction.bind(this);
  }

  initialize() {
    if (this.initialized) {
      return this;
    }

    window.addEventListener("threshold:glyph-interaction", this.boundHandler);
    this.initialized = true;
    return this;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  glyphInteractWithBranch(glyph) {
    const branch = this.branchEngine.pickBranch(glyph && glyph.branchId ? glyph.branchId : "");
    if (!branch) {
      return;
    }

    const roll = Math.random();
    let action = "none";

    if (roll < 0.15) {
      action = "hide";
      branch.hide();
    } else if (roll < 0.30) {
      action = "reveal";
      branch.reveal();
    } else if (roll < 0.45) {
      action = "pulse";
      branch.pulse();
    } else if (roll < 0.55) {
      action = "alter";
      branch.alter({ glyph: glyph || null });
    }

    window.dispatchEvent(new CustomEvent("threshold:branch-entity-update", {
      detail: {
        branchId: branch.id,
        action: action,
        glyph: glyph || null,
        visible: branch.visible,
        state: branch.state,
        payload: branch.payload || null
      }
    }));
  }

  handleGlyphInteraction(event) {
    if (!this.enabled) {
      return;
    }

    const glyph = event && event.detail ? event.detail : {};
    this.glyphInteractWithBranch(glyph);
  }
}

class ThresholdEngine {
  constructor() {
    this.activationStorageKey = "threshold.hub.activation.v1";
    this.ready = null;
    this.booted = false;
    this.vault = null;
    this.physics = null;
    this.volatility = null;
    this.territory = null;
    this.interactions = null;
    this.archive = null;
    this.weather = null;
    this.branchModule = null;
    this.branches = {};
    this.mythic = null;
    this.inspector = null;
    this.lastDetail = null;
    this.hubFadeTimer = null;
    this.hubActivationPromise = null;
    this.state = {
      hubActivated: false,
      hubActivating: false,
      branchEngineReady: false,
      activationPath: "collapse",
      branchVisibilityRules: "dormant",
      currentChannel: "threshold",
      currentWeather: "threshold",
      currentRoute: "",
      currentPage: "",
      currentBranch: ""
    };
    this.restoreActivationState();
    this.branchEngine = new ThresholdBranchEngine(this);
    this.glyphEngine = new ThresholdGlyphEngine(this, this.branchEngine);
    this.moduleCache = {};
    this.vaultDataCache = {};
    this.moduleMap = {
      archive: () => import("./archive.js"),
      weather: () => import("./weather.js"),
      branches: () => import("./branches.js"),
      mythic: () => import("./mythic.js"),
      housegarden: () => import("./housegarden.js"),
      dialogues: () => import("./dialogues.js"),
      glyphs: () => import("./glyphs.js")
    };
  }

  async boot() {
    if (this.ready) {
      return this.ready;
    }

    this.ready = (async () => {
      this.ensureRenderTargets();
      this.ensureProjectChamberInspector();
      this.ensureNavigationLogo();
      this.bindLogoTriggers();
      this.bindHubTriggers();
      this.syncLogoState({
        channel: "threshold",
        weather: this.state.currentWeather || "threshold",
        route: "",
        page: location.pathname.split("/").pop() || ""
      });

      if (this.state.hubActivated) {
        this.applyActivationPath(this.state.activationPath);
        this.activateNodeOrbit();
      }

      const archiveMod = await this.loadModule("archive");
      const weatherMod = await this.loadModule("weather");
      const branchesMod = await this.loadModule("branches");
      const mythicMod = await this.loadModule("mythic");

      this.archive = archiveMod.createArchiveModule();
      this.weather = weatherMod.createWeatherModule();
      this.branchModule = branchesMod.createBranchModule(this);
      this.mythic = mythicMod.createMythicModule(this);

      this.vault = await this.archive.loadVault();
      this.territory = await this.archive.loadTerritory(this);
      this.booted = true;
      this.renderProjectChamber({
        channel: "threshold",
        route: "",
        page: location.pathname.split("/").pop() || "",
        branch: document.body.dataset.thresholdBranch || "",
        weather: "threshold",
        noteTitle: this.vault ? "Vault connected" : "Vault not loaded",
        notePath: this.vault && this.vault.vaultRoot ? this.vault.vaultRoot : ""
      });

      window.dispatchEvent(new CustomEvent("threshold:engine-ready", {
        detail: {
          booted: true,
          hasVault: Boolean(this.vault)
        }
      }));

      window.dispatchEvent(new CustomEvent("threshold:root-booted"));

      return this;
    })();

    return this.ready;
  }

  restoreActivationState() {
    try {
      const raw = localStorage.getItem(this.activationStorageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return;
      }

      this.state.hubActivated = Boolean(parsed.hubActivated);
      this.state.activationPath = parsed.activationPath === "drift" ? "drift" : "collapse";
    } catch (err) {
      // Ignore storage read/parse issues.
    }
  }

  persistActivationState() {
    try {
      localStorage.setItem(this.activationStorageKey, JSON.stringify({
        hubActivated: Boolean(this.state.hubActivated),
        activationPath: this.state.activationPath === "drift" ? "drift" : "collapse"
      }));
    } catch (err) {
      // Ignore storage write issues.
    }
  }

  ensureRenderTargets() {
    const main = document.querySelector("main") || document.body;
    let mount = document.getElementById("thresholdEngineMount");

    if (!mount) {
      mount = document.createElement("div");
      mount.id = "thresholdEngineMount";
      mount.hidden = true;
      main.appendChild(mount);
    }

    TARGET_IDS.forEach((id) => {
      if (!document.getElementById(id)) {
        const node = document.createElement("div");
        node.id = id;
        node.hidden = true;
        mount.appendChild(node);
      }
    });
  }

  ensureNavigationLogo() {
    const nav = document.querySelector("nav");
    if (!nav || nav.querySelector("[data-threshold-logo-nav='1']")) {
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = "index.html";
    anchor.className = "threshold-nav-logo";
    anchor.setAttribute("aria-label", "Enter the Threshold Hub");
    anchor.setAttribute("data-threshold-logo-nav", "1");
    anchor.setAttribute("data-threshold-logo-trigger", "1");

    const img = document.createElement("img");
    img.src = "assets/logo/threshold-logo.svg";
    img.alt = "Threshold Root Sigil";
    img.className = "threshold-nav-logo-img";
    img.addEventListener("error", function () {
      img.src = "assets/logo.png";
    }, { once: true });

    anchor.appendChild(img);
    nav.insertBefore(anchor, nav.firstChild);
  }

  syncLogoState(detail = {}) {
    const channel = this.inferChannel(detail.channel || detail.weather || this.state.currentChannel || this.state.currentWeather || "threshold");
    const weather = detail.weather || detail.channel || this.state.currentWeather || channel;
    const route = detail.route || this.state.currentRoute || "";
    const page = detail.page || this.state.currentPage || (location.pathname.split("/").pop() || "");
    const branch = detail.branch || this.state.currentBranch || (document.body.dataset.thresholdBranch || "");
    const activationPath = detail.activationPath || this.state.activationPath || "collapse";
    const pathMode = activationPath === "drift" ? "drift" : "collapse";
    const mood = channel === "collapse"
      ? "collapse"
      : channel === "fog"
        ? "fog"
        : channel === "soil"
          ? "soil"
          : channel === "expand"
            ? "expand"
            : "threshold";

    this.state.currentChannel = channel;
    this.state.currentWeather = weather;
    this.state.currentRoute = String(route || "");
    this.state.currentPage = String(page || "");
    this.state.currentBranch = String(branch || "");

    document.body.dataset.thresholdChannel = channel;
    document.body.dataset.thresholdWeather = weather;
    document.body.dataset.thresholdPath = pathMode;
    document.body.dataset.thresholdBranch = this.state.currentBranch;
    document.body.dataset.thresholdRoute = this.state.currentRoute;
    document.body.dataset.thresholdPage = this.state.currentPage;

    const logoNodes = document.querySelectorAll("[data-threshold-logo-trigger], #threshold-logo");
    logoNodes.forEach(function (node) {
      if (!node) {
        return;
      }
      node.dataset.logoMood = mood;
      node.dataset.logoPath = pathMode;
      node.dataset.logoBranch = this.state.currentBranch;
      node.dataset.logoPage = this.state.currentPage;
    }, this);

    window.dispatchEvent(new CustomEvent("threshold:logo-state-update", {
      detail: {
        channel: channel,
        weather: weather,
        branch: this.state.currentBranch,
        route: this.state.currentRoute,
        page: this.state.currentPage,
        activationPath: pathMode,
        mood: mood
      }
    }));

    return {
      channel: channel,
      weather: weather,
      branch: this.state.currentBranch,
      route: this.state.currentRoute,
      page: this.state.currentPage,
      activationPath: pathMode,
      mood: mood
    };
  }

  bindLogoTriggers() {
    const self = this;
    const triggers = document.querySelectorAll("[data-threshold-logo-trigger], #threshold-logo");

    triggers.forEach(function (node) {
      if (!node || node.dataset.thresholdLogoBound === "1") {
        return;
      }

      node.dataset.thresholdLogoBound = "1";
      node.addEventListener("click", function (event) {
        const href = node.getAttribute("href") || "";
        const isAnchor = node.tagName === "A";
        const isIndexLink = isAnchor && /(^|\/)index\.html(?:$|[?#])/.test(href);
        const page = (location.pathname.split("/").pop() || "").toLowerCase();

        if (isIndexLink && page !== "index.html" && page !== "") {
          try {
            sessionStorage.setItem("threshold.logo.entry.v1", "hub");
          } catch (err) {
            // Ignore storage restrictions.
          }
          return;
        }

        if (isAnchor && isIndexLink) {
          event.preventDefault();
        }

        if (page === "index.html" || page === "") {
          if (isAnchor) {
            event.preventDefault();
          }
          self.activateHub().catch(function () {
            // Ignore soft-failures and keep normal interaction.
          });
          return;
        }

        self.initializeRootMachine().catch(function () {
          // Ignore soft-failures and keep normal navigation.
        });
      });
    });
  }

  bindHubTriggers() {
    const self = this;
    const hubTriggers = [
      { node: document.getElementById("hubA") || document.getElementById("hub"), path: "collapse" },
      { node: document.getElementById("hubB"), path: "drift" }
    ];

    hubTriggers.forEach(function (entry) {
      if (!entry.node || entry.node.dataset.thresholdHubBound === "1") {
        return;
      }

      entry.node.dataset.thresholdHubBound = "1";
      entry.node.addEventListener("click", function () {
        self.activateHub({ path: entry.path }).catch(function () {
          // Keep interaction non-blocking on soft failures.
        });
      });
    });
  }

  async loadModule(name) {
    if (!name || !this.moduleMap[name]) {
      throw new Error("Unknown module: " + name);
    }

    if (!this.moduleCache[name]) {
      this.moduleCache[name] = await this.moduleMap[name]();
    }

    return this.moduleCache[name];
  }

  async loadVault(name) {
    if (!name) {
      return null;
    }

    if (this.vaultDataCache[name]) {
      return this.vaultDataCache[name];
    }

    const path = "data/" + name + ".json";
    const payloadPromise = fetch(path, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
      .catch(function () {
        return null;
      });

    this.vaultDataCache[name] = payloadPromise;
    return payloadPromise;
  }

  async loadRootPhysics() {
    const payload = await this.loadVault("vault-engine");
    this.physics = payload || {
      drift: { coefficient: 1 },
      collapse: { threshold: 1 },
      anchor: { weight: 1 },
      pressure: { curve: [1] },
      resonance: { multiplier: 1 },
      fib: { sequence: [] }
    };
    return this.physics;
  }

  async loadVolatility() {
    const payload = await this.loadVault("vault-volatility");
    this.volatility = payload || {
      drift: { fog: 1, shimmer: 1, storm: 1, soil: 1, threshold: 1 },
      collapse: { fog: 1, shimmer: 1, storm: 1, soil: 1, threshold: 1 }
    };
    return this.volatility;
  }

  async loadTerritory() {
    if (this.archive && typeof this.archive.loadTerritory === "function") {
      this.territory = await this.archive.loadTerritory(this);
    } else {
      this.territory = await this.loadVault("vault-territory");
    }
    return this.territory;
  }

  async loadInteractions() {
    this.interactions = await this.loadVault("vault-interactions");
    return this.interactions;
  }

  applyDrift(state) {
    const input = state || {};
    const season = input.season || "threshold";
    const position = Number(input.position || 0);
    const motion = Number(input.motion || 0);

    const v = this.volatility && this.volatility.drift && this.volatility.drift[season]
      ? Number(this.volatility.drift[season])
      : 1;

    const c = this.physics && this.physics.drift && this.physics.drift.coefficient
      ? Number(this.physics.drift.coefficient)
      : 1;

    return position + (motion * c * v);
  }

  checkCollapse(state) {
    const input = state || {};
    const season = input.season || "threshold";
    const pressure = Number(input.pressure || 0);

    const threshold = this.physics && this.physics.collapse && this.physics.collapse.threshold
      ? Number(this.physics.collapse.threshold)
      : 1;

    const v = this.volatility && this.volatility.collapse && this.volatility.collapse[season]
      ? Number(this.volatility.collapse[season])
      : 1;

    return (pressure * v) > threshold;
  }

  ensureProjectChamberInspector() {
    let inspector = document.getElementById("projectChamberInspector");
    if (!inspector) {
      inspector = document.createElement("aside");
      inspector.id = "projectChamberInspector";
      inspector.className = "project-chamber-inspector";
      inspector.innerHTML = [
        '<h3 class="project-chamber-title">Project Chamber</h3>',
        '<p class="project-chamber-line"><strong>Channel:</strong> <span data-project-field="channel">threshold</span></p>',
        '<p class="project-chamber-line"><strong>Branch:</strong> <span data-project-field="branch">--</span></p>',
        '<p class="project-chamber-line"><strong>Route:</strong> <span data-project-field="route">--</span></p>',
        '<p class="project-chamber-line"><strong>Note:</strong> <span data-project-field="note">--</span></p>',
        '<p class="project-chamber-path" data-project-field="path">--</p>'
      ].join("");
      document.body.appendChild(inspector);
    }

    this.inspector = {
      node: inspector,
      channel: inspector.querySelector('[data-project-field="channel"]'),
      branch: inspector.querySelector('[data-project-field="branch"]'),
      route: inspector.querySelector('[data-project-field="route"]'),
      note: inspector.querySelector('[data-project-field="note"]'),
      path: inspector.querySelector('[data-project-field="path"]')
    };

    window.addEventListener("threshold:branch-update", (event) => {
      const detail = event && event.detail ? event.detail : {};
      const merged = Object.assign({}, this.lastDetail || {}, {
        branch: detail.branch || document.body.dataset.thresholdBranch || "",
        route: detail.route || (this.lastDetail && this.lastDetail.route) || "",
        lore: detail.lore || (this.lastDetail && this.lastDetail.lore) || ""
      });
      this.renderProjectChamber(merged);
    });
  }

  renderProjectChamber(detail) {
    if (!this.inspector || !this.inspector.node) {
      return;
    }

    const snapshot = Object.assign({
      channel: "threshold",
      branch: "",
      route: "",
      noteTitle: "--",
      notePath: "--"
    }, detail || {});

    this.lastDetail = snapshot;

    this.inspector.channel.textContent = snapshot.channel || "threshold";
    this.inspector.branch.textContent = snapshot.branch || "--";
    this.inspector.route.textContent = snapshot.route || "--";
    this.inspector.note.textContent = snapshot.noteTitle || "--";
    this.inspector.path.textContent = snapshot.notePath || "--";
    this.inspector.node.dataset.channel = snapshot.channel || "threshold";
  }

  renderBranch(branch) {
    if (!branch || !branch.id) {
      return;
    }

    const selector = '[data-branch="' + String(branch.id) + '"]';
    const nodes = Array.from(document.querySelectorAll(selector));
    if (nodes.length === 0) {
      return;
    }

    nodes.forEach(function (el) {
      if (!branch.visible) {
        el.style.opacity = "0";
      } else {
        el.style.opacity = "1";
      }

      el.classList.toggle("branch-pulse", branch.state === "pulsing");
      el.classList.toggle("branch-altered", branch.state === "altered");
      el.setAttribute("data-branch-state", branch.state || "stable");
      el.setAttribute("data-branch-visible", branch.visible ? "true" : "false");
    });
  }

  pickSelectedNote(selection) {
    if (!selection || typeof selection !== "object") {
      return null;
    }

    return selection.routeNote || selection.chamberNote || selection.weatherNote || selection.speciesNote || selection.actorNote || null;
  }

  normalizeChannel(input) {
    const value = String(input || "").toLowerCase();
    if (value === "shimmer") {
      return "expand";
    }
    if (value === "storm") {
      return "collapse";
    }
    if (value === "root") {
      return "soil";
    }
    return value || "threshold";
  }

  inferChannel(input, weatherHint) {
    const source = this.normalizeChannel(input || weatherHint || "threshold");

    if (source.includes("collapse") || source.includes("storm") || source.includes("mythology")) {
      return "collapse";
    }
    if (source.includes("fog") || source.includes("mist") || source.includes("ethos") || source.includes("housegarden")) {
      return "fog";
    }
    if (source.includes("soil") || source.includes("root") || source.includes("wheel") || source.includes("learning")) {
      return "soil";
    }
    if (source.includes("expand") || source.includes("shimmer") || source.includes("invitation") || source.includes("light")) {
      return "expand";
    }
    return "threshold";
  }

  detectSeason() {
    const hour = new Date().getHours();
    if (hour < 6) {
      return "soil";
    }
    if (hour < 12) {
      return "fog";
    }
    if (hour < 18) {
      return "shimmer";
    }
    return "storm";
  }

  setWeather(seasonOrChannel) {
    const channel = this.inferChannel(this.normalizeChannel(seasonOrChannel), this.normalizeChannel(seasonOrChannel));
    if (this.weather && typeof this.weather.apply === "function") {
      this.weather.apply(channel, null);
    }
    this.syncLogoState({ channel: channel, weather: channel });
    return channel;
  }

  invokeMythic(options = {}) {
    const season = options.season || "threshold";
    const channel = this.inferChannel(this.normalizeChannel(season), this.normalizeChannel(season));
    if (this.mythic && typeof this.mythic.apply === "function") {
      this.mythic.apply(channel, options.selection || null, options);
    }
    this.syncLogoState({ channel: channel, weather: channel, route: options.route || this.state.currentRoute });
    return channel;
  }

  async enterArchive(input, options = {}) {
    await this.boot();

    const route = options.route || (typeof input === "string" ? input : "");
    const channel = this.inferChannel(input, options.weather);

    const selection = this.archive.enterArchive(channel, {
      route: route,
      weather: options.weather || channel,
      page: options.page || ""
    }, this.vault);

    const territoryChamber = selection && selection.territoryChamber ? selection.territoryChamber : null;
    if (territoryChamber && territoryChamber.description) {
      const cave = document.getElementById("cave");
      if (cave) {
        cave.textContent = String(territoryChamber.description);
      }

      if (territoryChamber.season) {
        this.setWeather(String(territoryChamber.season));
      }
    }

    this.weather.apply(channel, selection);
    this.mythic.apply(channel, selection, {
      type: "legacy",
      season: this.detectSeason(),
      chamber: route || channel
    });
    if (this.branchModule && typeof this.branchModule.apply === "function") {
      this.branchModule.apply(route, selection);
    }

    const selectedNote = this.pickSelectedNote(selection);
    const branch = document.body.dataset.thresholdBranch || "";

    const detail = Object.assign({}, selection, {
      channel: channel,
      route: route,
      weather: options.weather || channel,
      page: options.page || "",
      branch: branch,
      noteTitle: selectedNote && selectedNote.title ? selectedNote.title : "--",
      notePath: selectedNote && selectedNote.relativePath ? selectedNote.relativePath : "--"
    });

    this.renderProjectChamber(detail);
    this.syncLogoState(detail);

    window.dispatchEvent(new CustomEvent("threshold:archive-entered", { detail }));
    return detail;
  }

  async initializeRootMachine() {
    await this.boot();

    await Promise.all([
      this.loadRootPhysics(),
      this.loadVolatility(),
      this.loadTerritory(),
      this.loadInteractions(),
      this.loadVault("vault-dialogues"),
      this.loadVault("vault-mythic"),
      this.loadVault("vault-glyphs"),
      this.loadVault("vault-branches")
    ]);

    const season = this.detectSeason();
    const weather = this.setWeather(season);
    this.invokeMythic({ type: "spirit", season: season });

    const detail = await this.enterArchive("threshold", {
      route: "root-machine",
      weather: weather,
      page: location.pathname.split("/").pop() || ""
    });

    window.dispatchEvent(new CustomEvent("threshold:root-machine-initialized", { detail }));
    return detail;
  }

  activateHubFade(path) {
    const overlay = document.getElementById("activation-overlay") || document.getElementById("hub-fade-overlay");
    if (!overlay) {
      return Promise.resolve();
    }

    overlay.style.background = "#000000";

    overlay.classList.add("active");

    if (this.hubFadeTimer) {
      window.clearTimeout(this.hubFadeTimer);
    }

    return this.wait(1400);
  }

  clearHubFade() {
    const overlay = document.getElementById("activation-overlay") || document.getElementById("hub-fade-overlay");
    if (!overlay) {
      return;
    }

    if (this.hubFadeTimer) {
      window.clearTimeout(this.hubFadeTimer);
    }

    this.hubFadeTimer = window.setTimeout(function () {
      overlay.classList.remove("active");
    }, 120);
  }

  spinRootMachine() {
    const rm = document.getElementById("root-machine");
    if (!rm) {
      return;
    }

    rm.classList.remove("spin-once");
    void rm.offsetWidth;
    rm.classList.add("spin-once");
  }

  rotateRootMachine(direction) {
    const rm = document.getElementById("root-machine");
    if (!rm) {
      return;
    }

    rm.classList.remove("rotate-cw", "rotate-ccw", "spin-cw", "spin-ccw");
    if (direction === "ccw") {
      rm.classList.add("rotate-ccw", "spin-ccw");
    } else {
      rm.classList.add("rotate-cw", "spin-cw");
    }
  }

  activateBackgroundColor() {
    document.body.classList.remove("seasonal-background", "index-background", "studio-background");
    document.body.removeAttribute("data-season");

    const seasonalNodes = document.querySelectorAll(".seasonal-background");
    seasonalNodes.forEach(function (node) {
      node.classList.remove("seasonal-background", "is-season-synced");
      node.removeAttribute("data-season");
    });

    // Force the ritual collapse colors regardless of prior page theming.
    document.body.style.background = "#000000";
    document.body.style.color = "#ffffff";

    document.body.classList.add("hub-active");

    const path = this.state.activationPath === "drift" ? "hub-path-drift" : "hub-path-collapse";
    const remove = path === "hub-path-drift" ? "hub-path-collapse" : "hub-path-drift";

    document.body.classList.remove(remove);
    document.body.classList.add(path);
  }

  activateRootMachineContainer() {
    const container = document.getElementById("root-machine-container");
    if (container) {
      container.classList.add("hub-active");
    }

    const rootMachine = document.getElementById("root-machine");
    if (rootMachine) {
      rootMachine.classList.add("inverted");
    }

    const hubs = [
      document.getElementById("hubA"),
      document.getElementById("hubB"),
      document.getElementById("hub")
    ];

    hubs.forEach(function (hub) {
      if (hub) {
        hub.classList.add("activated");
      }
    });
  }

  activateNodeOrbit() {
    const thresholdNode = document.getElementById("threshold-node");
    if (!thresholdNode) {
      return;
    }

    const existing = thresholdNode.querySelectorAll(".node-orbit");
    if (existing.length > 0) {
      return;
    }

    for (let i = 0; i < 6; i += 1) {
      const node = document.createElement("div");
      node.className = "node-orbit";
      node.style.animationDelay = (i * 0.3).toFixed(1) + "s";
      thresholdNode.appendChild(node);
    }
  }

  activateNodes() {
    const nodeEls = document.querySelectorAll(".node, .fib-node, .fib-label");
    nodeEls.forEach(function (node) {
      node.classList.add("activated");
      node.classList.add("awakened");
    });
  }

  pulseNodesByPath(mode) {
    const targets = mode === "drift"
      ? ["collapse", "drift"]
      : ["anchor", "resonance"];

    targets.forEach(function (name) {
      const nodeMatches = document.querySelectorAll(".node[data-id='" + name + "'], .fib-label[data-id='" + name + "']");
      nodeMatches.forEach(function (node) {
        node.classList.remove("pulse");
        void node.offsetWidth;
        node.classList.add("pulse");
      });
    });
  }

  applyActivationPath(path) {
    const mode = path === "drift" ? "drift" : "collapse";
    this.state.activationPath = mode;

    this.activateBackgroundColor();
    this.activateRootMachineContainer();
    this.activateNodes();
    this.pulseNodesByPath(mode);
    this.rotateRootMachine(mode === "drift" ? "ccw" : "cw");
    this.syncLogoState({ activationPath: mode });

    window.dispatchEvent(new CustomEvent("threshold:activation-path", {
      detail: {
        path: mode,
        fade: "black",
        rotation: mode === "drift" ? "ccw" : "cw",
        rain: mode === "drift" ? "shape" : "glyph"
      }
    }));

    this.persistActivationState();
  }

  wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  initializeHubWorld() {
    this.branchEngine.initialize();
    this.glyphEngine.initialize();
    this.glyphEngine.enable();
    this.state.branchEngineReady = true;
    this.state.branchVisibilityRules = "active";

    window.dispatchEvent(new CustomEvent("threshold:hub-world-initialized", {
      detail: {
        hubActivated: this.state.hubActivated,
        branchCount: this.branchEngine.ids().length,
        branchVisibilityRules: this.state.branchVisibilityRules,
        branchEngineReady: this.state.branchEngineReady
      }
    }));
  }

  async activateHub(options = {}) {
    await this.boot();

    const requestedPath = options && options.path === "drift" ? "drift" : "collapse";

    if (this.state.hubActivated) {
      this.applyActivationPath(requestedPath);
      return this.lastDetail || null;
    }

    if (this.hubActivationPromise) {
      return this.hubActivationPromise;
    }

    const self = this;
    this.hubActivationPromise = (async function () {
      self.state.hubActivating = true;
      self.state.activationPath = requestedPath;
      window.dispatchEvent(new CustomEvent("threshold:hub-activation-started", {
        detail: {
          hubActivated: false,
          hubActivating: true,
          path: self.state.activationPath
        }
      }));

      await self.activateHubFade(self.state.activationPath);

      self.applyActivationPath(self.state.activationPath);
      self.spinRootMachine();
      self.activateNodeOrbit();

      self.initializeHubWorld();
      self.clearHubFade();

      const detail = await self.enterHub({ skipFade: true });
      self.state.hubActivated = true;
      self.persistActivationState();

      window.dispatchEvent(new CustomEvent("threshold:hub-activation-complete", {
        detail: Object.assign({}, detail, {
          hubActivated: true,
          hubActivating: false
        })
      }));

      return detail;
    })();

    try {
      return await this.hubActivationPromise;
    } finally {
      this.state.hubActivating = false;
      this.hubActivationPromise = null;
    }
  }

  async enterHub(options = {}) {
    await this.boot();

    if (!options.skipFade && !this.state.hubActivated) {
      return this.activateHub();
    }

    if (!this.state.branchEngineReady) {
      this.initializeHubWorld();
    }

    await this.initializeRootMachine();

    const detail = await this.enterArchive("hub", {
      route: "hub",
      weather: "expand",
      page: location.pathname.split("/").pop() || ""
    });

    const hubRoot = document.getElementById("hub-root");
    if (hubRoot) {
      hubRoot.innerHTML = [
        '<div class="hub-title">Threshold Root Machine</div>',
        '<div class="hub-sub">Fib Flower • Drift • Collapse • Anchor • Pressure • Resonance</div>'
      ].join("");
    }

    this.applyActivationPath(this.state.activationPath);
    this.activateNodeOrbit();
    this.state.hubActivated = true;
    this.persistActivationState();
    window.dispatchEvent(new CustomEvent("threshold:hub-entered", { detail }));
    window.dispatchEvent(new CustomEvent("threshold:wheel-ready"));
    window.dispatchEvent(new CustomEvent("threshold:chamber-map-ready"));
    return detail;
  }

  async enterHouseGarden() {
    await this.boot();
    const mod = await this.loadModule("housegarden");
    if (mod && mod.default && typeof mod.default.init === "function") {
      mod.default.init(this);
    }
  }

  async enterDialogues() {
    await this.boot();
    const mod = await this.loadModule("dialogues");
    if (mod && mod.default && typeof mod.default.init === "function") {
      await mod.default.init(this);
    }
  }

  getVault() {
    return this.vault;
  }
}

const threshold = new ThresholdEngine();
window.threshold = threshold;
threshold.boot().catch(function () {
  // Keep pages functional even if module boot fails.
});

export default threshold;
