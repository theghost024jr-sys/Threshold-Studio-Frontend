const pageEcho = (id, branchId, label, href, source, styles = [], inventorySource = null) => Object.freeze({
  id,
  branchId,
  kind: "page-echo",
  label,
  href,
  source,
  inventorySource,
  styles: Object.freeze(styles),
  force: "low"
});

export const PAGE_ECHOES = Object.freeze([
  pageEcho("entry", "rootSigil", "Threshold Entry", "/index.html", "index.html", [
    "styles/complexity-layers.css"
  ]),
  pageEcho("hub", "rootSigil", "Hub", "/hub.html", "hub.html", [
    "styles/complexity-layers.css",
    "styles/hub-interaction.css",
    "styles/pulse.css",
    "styles/styles.css"
  ]),
  pageEcho("engine", "rootSigil", "Engine", "/deep-system/engine.html", "deep-system/engine.html", [
    "styles/styles.css",
    "styles/hub-interaction.css",
    "styles/complexity-layers.css",
    "styles/node-editor.css"
  ]),
  pageEcho("portal-home", "home", "Portal", "/portal/", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-dashboard", "home", "Portal Dashboard", "/portal/dashboard", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("world-map", "home", "World Map", "/world-map.html", "world-map.html", [
    "styles/complexity-layers.css",
    "styles/world-map.css"
  ]),
  pageEcho("discover", "home", "Discover", "/discover.html", "discover.html", [
    "styles/styles.css",
    "styles/complexity-layers.css",
    "styles/spoke-tabs.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ]),
  pageEcho("spoke-shell", "home", "Spoke Shell", "/spoke.html", "spoke.html", [
    "styles/spoke-shell.css",
    "styles/spoke-tabs.css"
  ]),
  pageEcho("ethos", "ethos", "Ethos", "/ethos.html", "ethos.html", [
    "styles.css",
    "styles/complexity-layers.css",
    "styles/ethos-root.css",
    "styles/spoke-tabs.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ]),
  pageEcho("glyphs", "glyphs", "Glyphs", "/glyphs.html", "glyphs.html", [
    "styles.css",
    "styles/glyphs.css",
    "styles/spoke-tabs.css",
    "styles/complexity-layers.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ]),
  pageEcho("learning-wheel", "learningWheel", "Learning Wheel", "/learningwheel.html", "learningwheel.html", [
    "styles/styles.css",
    "styles/learning-wheel.css",
    "styles/spoke-tabs.css",
    "styles/complexity-layers.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ]),
  pageEcho("dialogues", "dialogues", "Dialogues", "/dialogues.html", "dialogues.html", [
    "styles/styles.css",
    "styles/dialogues.css",
    "styles/complexity-layers.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ]),
  pageEcho("mythology", "mythology", "Mythology", "/mythology.html", "mythology.html", [
    "styles/styles.css",
    "styles/mythology-viewer.css",
    "styles/weather-engine.css",
    "styles/complexity-layers.css",
    "styles/spoke-tabs.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ]),
  pageEcho("beyond-gateway", "mythology", "Beyond", "/pages/beyond/beyond.html", "pages/beyond/beyond.html", [
    "styles/complexity-layers.css",
    "styles/styles.css",
    "styles/beyond.css",
    "styles/immersive.css"
  ]),
  pageEcho("ella", "mythology", "Ella", "/pages/beyond/Ella.html", "pages/beyond/Ella.html", [
    "styles/glyph-system.css",
    "styles/ella-immersive.css"
  ]),
  pageEcho("house-garden", "houseGarden", "House and Garden", "/housegarden.html", "housegarden.html", [
    "styles/styles.css",
    "styles/node-editor.css",
    "styles/housegarden.css",
    "styles/pulse.css",
    "styles/complexity-layers.css",
    "styles/spoke-tabs.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ]),
  pageEcho("garden", "houseGarden", "Garden", "/garden.html", "garden.html", [
    "styles.css"
  ]),
  pageEcho("herbroom", "houseGarden", "Herb Room", "/environment/herbroom.html", "environment/herbroom.html"),
  pageEcho("basin-reference-page", "houseGarden", "Basin", "/environment/basin.html", "environment/basin.html"),
  pageEcho("basin-generated-page", "houseGarden", "Basin (published note)", "/generated-pages/environment/basin.html", null),
  pageEcho("old-forest", "houseGarden", "Old Forest", "/environment/old-forest.html", "environment/old-forest.html"),
  pageEcho("invitation", "invitation", "Invitation", "/invitation.html", "invitation.html", [
    "styles/complexity-layers.css",
    "styles/invitation-sanctuary.css"
  ]),
  pageEcho("contact", "contact", "Contact", "/contact.html", "contact.html", [
    "styles/styles.css",
    "styles/complexity-layers.css",
    "styles/spoke-tabs.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ]),
  pageEcho("thank-you", "contact", "Thank You", "/thankyou.html", "thankyou.html", [
    "styles/styles.css"
  ]),
  pageEcho("inventory-contact", "contact", "Contact · Inventory", "/echoes/inventory/contact.html", null, [
    "styles/styles.css",
    "styles/complexity-layers.css",
    "styles/spoke-tabs.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ], "contact.html"),
  pageEcho("inventory-dialogues", "dialogues", "Dialogues · Inventory", "/echoes/inventory/dialogues.html", null, [
    "styles/styles.css",
    "styles/dialogues.css",
    "styles/complexity-layers.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ], "dialogues.html"),
  pageEcho("inventory-discover", "home", "Discover · Inventory", "/echoes/inventory/discover.html", null, [
    "styles/styles.css",
    "styles/complexity-layers.css",
    "styles/spoke-tabs.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ], "discover.html"),
  pageEcho("inventory-ethos", "ethos", "Ethos · Inventory", "/echoes/inventory/ethos.html", null, [
    "styles.css",
    "styles/complexity-layers.css",
    "styles/spoke-tabs.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ], "ethos.html"),
  pageEcho("inventory-garden", "houseGarden", "Garden · Inventory", "/echoes/inventory/garden.html", null, [
    "styles.css"
  ], "garden.html"),
  pageEcho("inventory-glyphs", "glyphs", "Glyphs · Inventory", "/echoes/inventory/glyphs.html", null, [
    "styles.css",
    "styles/glyphs.css",
    "styles/spoke-tabs.css",
    "styles/complexity-layers.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ], "glyphs.html"),
  pageEcho("inventory-house-garden", "houseGarden", "House and Garden · Inventory", "/echoes/inventory/housegarden.html", null, [
    "styles/styles.css",
    "styles/housegarden.css",
    "styles/complexity-layers.css",
    "styles/spoke-tabs.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ], "housegarden.html"),
  pageEcho("inventory-hub", "rootSigil", "Hub · Inventory", "/echoes/inventory/hub.html", null, [
    "styles.css"
  ], "hub.html"),
  pageEcho("inventory-entry", "rootSigil", "Threshold Entry · Inventory", "/echoes/inventory/index.html", null, [
    "styles/complexity-layers.css"
  ], "index.html"),
  pageEcho("inventory-invitation", "invitation", "Invitation · Inventory", "/echoes/inventory/invitation.html", null, [
    "styles.css",
    "styles/access-flow.css",
    "styles/complexity-layers.css",
    "styles/destination-page.css",
    "styles/spoke-tabs.css"
  ], "invitation.html"),
  pageEcho("inventory-learning-wheel", "learningWheel", "Learning Wheel · Inventory", "/echoes/inventory/learningwheel.html", null, [
    "styles/styles.css",
    "styles/learning-wheel.css",
    "styles/spoke-tabs.css",
    "styles/complexity-layers.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ], "learningwheel.html"),
  pageEcho("inventory-mythology", "mythology", "Mythology · Inventory", "/echoes/inventory/mythology.html", null, [
    "styles/styles.css",
    "styles/mythology-viewer.css",
    "styles/weather-engine.css",
    "styles/complexity-layers.css",
    "styles/spoke-tabs.css",
    "styles/destination-page.css",
    "styles/access-flow.css"
  ], "mythology.html"),
  pageEcho("inventory-spoke-shell", "home", "Spoke Shell · Inventory", "/echoes/inventory/spoke.html", null, [
    "styles/spoke-shell.css",
    "styles/spoke-tabs.css"
  ], "spoke.html"),
  pageEcho("inventory-engine", "rootSigil", "Engine · Inventory", "/echoes/inventory/deep-system/engine.html", null, [
    "styles/styles.css",
    "styles/hub-interaction.css",
    "styles/complexity-layers.css"
  ], "deep-system/engine.html"),
  pageEcho("inventory-basin", "houseGarden", "Basin · Inventory", "/echoes/inventory/environment/basin.html", null, [], "environment/basin.html"),
  pageEcho("inventory-herbroom", "houseGarden", "Herb Room · Inventory", "/echoes/inventory/environment/herbroom.html", null, [], "environment/herbroom.html"),
  pageEcho("portal-ethos", "ethos", "Portal · Ethos", "/portal/branches/ethos", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-mythology", "mythology", "Portal · Mythology", "/portal/branches/mythology", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-learning-wheel", "learningWheel", "Portal · Learning Wheel", "/portal/branches/learningwheel", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-house-garden", "houseGarden", "Portal · House and Garden", "/portal/branches/housegarden", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-invitation", "invitation", "Portal · Invitation", "/portal/branches/invitation", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-root-sigil", "rootSigil", "Portal · Hub Branch", "/portal/branches/rootSigil", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-home-branch", "home", "Portal · Home Branch", "/portal/branches/home", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-glyphs", "glyphs", "Portal · Glyphs", "/portal/branches/glyphs", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-dialogues", "dialogues", "Portal · Dialogues", "/portal/branches/dialogues", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-contact", "contact", "Portal · Contact", "/portal/branches/contact", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-world", "home", "Portal · World", "/portal/world", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-world-map", "home", "Portal · World Map", "/portal/world/map", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-garden", "houseGarden", "Portal · Garden", "/portal/world/garden", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-ella", "mythology", "Portal · Ella", "/portal/world/ella", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-chambers", "home", "Portal · Chambers", "/portal/world/chambers", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-chamber-house-garden", "houseGarden", "Portal · House and Garden Chamber", "/portal/world/chambers/house-and-garden", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-chamber-ella", "mythology", "Portal · Ella Chamber", "/portal/world/chambers/ella", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ]),
  pageEcho("portal-chamber-dialogues", "dialogues", "Portal · Dialogues Chamber", "/portal/world/chambers/dialogues", "portal/index.html", [
    "portal/src/App.css",
    "portal/src/index.css"
  ])
]);

export const INVENTORY_ECHO_EXCLUSIONS = Object.freeze({
  "environment/waterfall.html": "Referenced image is not committed as public media"
});

export const PAGE_ECHO_MATCHING = Object.freeze({
  sigma: 0.35,
  minimumScore: 0.82,
  minimumMargin: 0.12
});

export function normalizePageName(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function editDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      const substitution = diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      previous[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + 1,
        substitution
      );
      diagonal = above;
    }
  }

  return previous[right.length];
}

export function gaussianNameSimilarity(leftName, rightName) {
  const left = normalizePageName(leftName);
  const right = normalizePageName(rightName);
  if (!left || !right) {
    return 0;
  }

  const normalizedDistance = editDistance(left, right) / Math.max(left.length, right.length);
  return Math.exp(-0.5 * (normalizedDistance / PAGE_ECHO_MATCHING.sigma) ** 2);
}

function pageNameKey(echo) {
  const source = echo.inventorySource
    || (echo.source === "portal/index.html" ? echo.href : echo.source)
    || echo.href;
  const filename = String(source).split(/[?#]/, 1)[0].replace(/\/+$/, "").split("/").at(-1) || "";
  return normalizePageName(filename.replace(/\.html?$/i, ""));
}

function publishedMarkdownNotes(vaultData) {
  const uniqueNotes = new Map();
  ["documents", "chambers"].forEach((collection) => {
    (vaultData?.[collection] || []).forEach((note) => {
      const relativePath = typeof note.relativePath === "string" ? note.relativePath : "";
      if (!relativePath.toLowerCase().startsWith("_publish/")) {
        return;
      }
      uniqueNotes.set(relativePath.toLowerCase(), {
        id: note.id || relativePath,
        title: note.title || relativePath.split("/").at(-1).replace(/\.md$/i, ""),
        relativePath
      });
    });
  });
  return [...uniqueNotes.values()];
}

function matchPublishedNote(echo, notes) {
  const pageName = pageNameKey(echo);
  const ranked = notes.map((note) => {
    const filename = note.relativePath.split("/").at(-1).replace(/\.md$/i, "");
    const score = Math.max(
      gaussianNameSimilarity(pageName, note.title),
      gaussianNameSimilarity(pageName, filename)
    );
    return { note, score };
  }).sort((left, right) => right.score - left.score
    || left.note.relativePath.localeCompare(right.note.relativePath));

  const first = ranked[0];
  if (!first || first.score < PAGE_ECHO_MATCHING.minimumScore) {
    return { status: "unmatched", markdownMatch: null };
  }

  const second = ranked[1];
  if (second && first.score - second.score < PAGE_ECHO_MATCHING.minimumMargin) {
    return { status: "ambiguous", markdownMatch: null };
  }

  return {
    status: "matched",
    markdownMatch: Object.freeze({
      ...first.note,
      score: Number(first.score.toFixed(4))
    })
  };
}

export function resolvePageEchoes(echoes, vaultData) {
  const notes = publishedMarkdownNotes(vaultData);
  return echoes.map((echo) => Object.freeze({
    ...echo,
    ...matchPublishedNote(echo, notes)
  }));
}
