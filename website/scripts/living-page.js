import { validateLivingPagePublication } from "./living-page-contract.js";

const CONFIG_URL = "/config/living-pages.json";
const VAULT_URL = "/data/threshold-vault.json";

function requireOk(response, label) {
  if (!response.ok) {
    throw new Error(`${label} unavailable (${response.status}).`);
  }
  return response.json();
}

function assetByName(note) {
  return new Map((note.assets || []).map((asset) => [asset.name.toLowerCase(), asset.webPath]));
}

function appendImage(target, source, alt) {
  const image = document.createElement("img");
  image.src = source;
  image.alt = alt;
  image.loading = "lazy";
  target.appendChild(image);
}

function appendInline(target, value, routes) {
  const pattern = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
  let cursor = 0;
  for (const match of value.matchAll(pattern)) {
    target.append(value.slice(cursor, match.index));
    const targetName = match[1].trim().toLowerCase();
    const label = (match[2] || match[1]).trim();
    const route = routes.get(targetName);
    if (route) {
      const link = document.createElement("a");
      link.href = route;
      link.textContent = label;
      target.appendChild(link);
    } else {
      target.append(label);
    }
    cursor = match.index + match[0].length;
  }
  target.append(value.slice(cursor));
}

function appendMarkdown(target, body, assets, routes) {
  const lines = String(body || "").trim().split("\n");
  let paragraph = [];
  let list = null;

  function flushParagraph() {
    if (!paragraph.length) return;
    const element = document.createElement("p");
    appendInline(element, paragraph.join(" "), routes);
    target.appendChild(element);
    paragraph = [];
  }

  function flushList() {
    if (!list) return;
    target.appendChild(list);
    list = null;
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    const image = line.match(/^!\[\[([^\]]+)\]\]$/);
    const heading = line.match(/^(#{1,2})\s+(.+)$/);
    const item = line.match(/^[-*]\s+(.+)$/);

    if (!line) {
      flushParagraph();
      flushList();
    } else if (image) {
      flushParagraph();
      flushList();
      const source = assets.get(image[1].toLowerCase());
      if (!source) {
        throw new Error(`Published media ${image[1]} is not available for this page.`);
      }
      appendImage(target, source, image[1]);
    } else if (heading) {
      flushParagraph();
      flushList();
      const element = document.createElement(heading[1].length === 1 ? "h2" : "h3");
      appendInline(element, heading[2], routes);
      target.appendChild(element);
    } else if (item) {
      flushParagraph();
      list ||= document.createElement("ul");
      const element = document.createElement("li");
      appendInline(element, item[1], routes);
      list.appendChild(element);
    } else {
      flushList();
      paragraph.push(line);
    }
  });
  flushParagraph();
  flushList();
}

function renderNavigation(page) {
  const navigation = document.querySelector("[data-living-page-navigation]");
  (page.branches || []).forEach((branch) => {
    const link = document.createElement("a");
    link.href = branch.route;
    link.textContent = branch.label;
    navigation.appendChild(link);
  });
}

function initializeLearningGlyph() {
  const glyph = document.body.dataset.learningGlyph;
  const pageRoot = document.querySelector(".living-page");
  if (!glyph || !pageRoot) {
    return;
  }

  const storageKey = "threshold.learningWheel.glyphReturns.v1";
  let progress = { glyphs: [], rareEvent: false };
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (stored && Array.isArray(stored.glyphs)) {
      progress = {
        glyphs: stored.glyphs.filter((entry) => typeof entry === "string"),
        rareEvent: stored.rareEvent === true
      };
    }
  } catch (error) {
    console.warn("Learning glyph returns could not be restored.", error);
  }

  const returnField = document.createElement("section");
  returnField.className = "learning-glyph-return";
  const returnLabel = document.createElement("p");
  returnLabel.className = "living-page__eyebrow";
  returnLabel.textContent = "Glyph return";
  const returnStatus = document.createElement("p");
  returnStatus.dataset.glyphReturnStatus = "";
  returnField.append(returnLabel, returnStatus);
  const stormLink = document.createElement("a");
  stormLink.href = "/learningwheel.html?node=storm-cabinet&fib=3&trail=learning-wheel,seasonal-alcove";
  stormLink.textContent = "Open Storm Cabinet";
  stormLink.hidden = true;
  returnField.appendChild(stormLink);
  pageRoot.appendChild(returnField);

  function updateReturnField() {
    const hasTwoGlyphs = new Set(progress.glyphs).size >= 2;
    const isReady = hasTwoGlyphs && progress.rareEvent;
    stormLink.hidden = !isReady;
    if (isReady) {
      returnStatus.textContent = "Two glyph returns and a rare event have aligned.";
    } else if (hasTwoGlyphs) {
      returnStatus.textContent = "Two glyph returns recognized. The rare event has not arrived.";
    } else {
      returnStatus.textContent = "Double-click this glyph chamber to return its signal.";
    }
  }

  pageRoot.addEventListener("dblclick", function (event) {
    if (event.target.closest("a")) {
      return;
    }
    if (!progress.glyphs.includes(glyph)) {
      progress.glyphs.push(glyph);
    }
    if (!progress.rareEvent && Math.random() < 0.25) {
      progress.rareEvent = true;
    }
    localStorage.setItem(storageKey, JSON.stringify(progress));
    updateReturnField();
  });

  updateReturnField();
}

async function initializeLivingPage() {
  const noteId = document.body.dataset.vaultNoteId;
  const status = document.querySelector("[data-living-page-status]");
  const content = document.querySelector("[data-living-page-content]");
  if (!noteId || !status || !content) {
    throw new Error("Living page is missing its required scaffold elements.");
  }

  const [configuration, vault] = await Promise.all([
    fetch(CONFIG_URL, { cache: "no-store" }).then((response) => requireOk(response, "Living page configuration")),
    fetch(VAULT_URL, { cache: "no-store" }).then((response) => requireOk(response, "Vault data"))
  ]);
  const page = configuration.pages.find((candidate) => candidate.noteId === noteId);
  const note = vault.documents.find((candidate) => candidate.id === noteId);
  validateLivingPagePublication({
    noteId,
    page,
    note,
    route: location.pathname
  });
  const routes = new Map(configuration.pages.flatMap((candidate) => [
    [candidate.noteId.toLowerCase(), candidate.route],
    ...(candidate.aliases || []).map((alias) => [alias.toLowerCase(), candidate.route])
  ]));

  document.title = `${note.title} · Threshold`;
  document.querySelector("[data-living-page-title]").textContent = note.title;
  document.querySelector("[data-living-page-source]").textContent = note.relativePath;
  appendMarkdown(content, note.body, assetByName(note), routes);
  if (page.includeAssets) {
    const bodyAssets = new Set([...content.querySelectorAll("img")].map((image) => image.src));
    (note.assets || []).forEach((asset) => {
      if (!bodyAssets.has(new URL(asset.webPath, location.origin).href)) {
        appendImage(content, asset.webPath, asset.name);
      }
    });
  }
  renderNavigation(page);
  initializeLearningGlyph();
  status.textContent = "Published vault note";
}

initializeLivingPage().catch((error) => {
  console.error("Living page failed to initialize", error);
  const status = document.querySelector("[data-living-page-status]");
  if (status) {
    status.textContent = error instanceof Error ? error.message : "Living page unavailable.";
  }
});
