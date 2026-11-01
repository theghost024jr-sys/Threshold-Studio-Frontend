const instrument = document.querySelector("[data-glyph-instrument]");
const archiveTitle = document.querySelector("[data-archive-title]");
const archiveSummary = document.querySelector("[data-archive-summary]");
const archiveSource = document.querySelector("[data-archive-source]");
const glyphTitle = document.querySelector("[data-glyph-title]");
const glyphDetail = document.querySelector("[data-glyph-detail]");
const glyphNode = document.querySelector("[data-glyph-node]");
const glyphRoute = document.querySelector("[data-glyph-route]");
const glyphSource = document.querySelector("[data-glyph-source]");
const glyphOpen = document.querySelector("[data-glyph-open]");
const glyphDiscovery = document.querySelector("[data-glyph-discovery]");
const glyphLens = document.querySelector("[data-glyph-lens]");
const glyphLensName = document.querySelector("[data-glyph-lens-name]");
const glyphRule = document.querySelector("[data-glyph-rule]");
const glyphButtons = [...document.querySelectorAll("[data-glyph-id]")];

let documentsById = new Map();
const revealedGlyphs = new Set();

const GLYPH_LENSES = {
  glyph_fog: {
    name: "Partial sight",
    instruction: "Certainty recedes. Nearby and subtle signals become comparatively easier to hold.",
    rule: "Fog softens presentation only. Every route and revealed glyph remains available.",
  },
  glyph_expand: {
    name: "Context",
    instruction: "The frame widens. Existing adjacency and extent become easier to notice.",
    rule: "Expand reveals no relationships; it only gives existing material more room in the frame.",
  },
  glyph_collapse: {
    name: "Reduction",
    instruction: "Secondary presentation quiets. Persistent structure is left easier to inspect.",
    rule: "This reduces representation only. It does not invoke Threshold's physical Collapse.",
  },
  glyph_soil: {
    name: "Substrate",
    instruction: "The surface quiets. Underlying contours become more legible where they are already represented.",
    rule: "Soil exposes no invented content. It can only emphasize represented structure.",
  },
};

function documentSummary(document) {
  const lines = String(document?.body || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("!["));
  return lines[0] || document?.description || "This glyph has no published description.";
}

function selectGlyph(id) {
  const document = documentsById.get(id);
  const lens = GLYPH_LENSES[id];
  const label = id.replace("glyph_", "").replace(/(^|_)([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
  instrument.dataset.glyphState = id.replace("glyph_", "");
  glyphTitle.textContent = document?.title || label;
  glyphDetail.textContent = lens?.instruction || documentSummary(document);
  glyphLens.textContent = lens?.instruction || "The selected glyph changes only this reading.";
  glyphLensName.textContent = lens?.name || "Archive reading";
  glyphRule.textContent = lens?.rule || "Discovery changes attention. It does not change the world.";
  glyphNode.textContent = id;
  glyphRoute.textContent = document?.html || "Glyph Archive";
  glyphSource.textContent = document ? `published: ${document.relativePath}` : "Published record unavailable";
  glyphOpen.href = document?.html || "glyphs.html";
  glyphOpen.textContent = document ? `Open preserved ${document.title} page` : "Open the preserved glyph pages";
  glyphButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.glyphId === id));
  });
}

function revealGlyph(id) {
  if (revealedGlyphs.has(id)) return;
  revealedGlyphs.add(id);
  glyphButtons.find((button) => button.dataset.glyphId === id)?.classList.add("is-revealed");
  const count = revealedGlyphs.size;
  glyphDiscovery.textContent = `${count} glyph${count === 1 ? "" : "s"} revealed.`;
}

function renderUnresolvedReading() {
  instrument.dataset.glyphState = "unresolved";
  glyphTitle.textContent = "No glyph selected";
  glyphDetail.textContent = "Move through the field. A glyph can be read after it has appeared.";
  glyphLens.textContent = "Nothing has been selected. The field remains unresolved.";
  glyphLensName.textContent = "Unresolved";
  glyphRule.textContent = "Discovery changes attention. It does not change the world.";
  glyphNode.textContent = "unresolved";
  glyphRoute.textContent = "Glyph Archive";
  glyphSource.textContent = "Published records wait in the field.";
  glyphOpen.href = "glyphs.html";
  glyphOpen.textContent = "Open the preserved glyph pages";
}

async function loadArchive() {
  try {
    const response = await fetch("/data/threshold-vault.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Vault data request failed: ${response.status}`);
    const vault = await response.json();
    documentsById = new Map((vault.documents || []).map((document) => [document.id, document]));
    const archive = documentsById.get("glyph_archive");
    if (!archive) throw new Error("Published Glyph Archive record is unavailable.");
    archiveTitle.textContent = archive.title;
    archiveSummary.textContent = documentSummary(archive);
    archiveSource.textContent = `Published vault source: ${archive.relativePath}`;
    renderUnresolvedReading();
  } catch (error) {
    console.error("Glyph Archive could not load its vault record.", error);
    archiveSource.textContent = `Vault source unavailable: ${error.message}`;
  }
}

glyphButtons.forEach((button) => {
  const reveal = () => revealGlyph(button.dataset.glyphId);
  button.addEventListener("pointerenter", reveal);
  button.addEventListener("focus", reveal);
  button.addEventListener("click", () => {
    reveal();
    selectGlyph(button.dataset.glyphId);
  });
});

void loadArchive();
