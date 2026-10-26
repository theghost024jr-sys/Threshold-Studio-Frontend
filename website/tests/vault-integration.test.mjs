import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test.todo(
  "loads generated canonical vault data",
  "Restore the garden document and its published asset in the vault generator output.",
);

test("publishes Cindervox intent signals from the canonical vault", async () => {
  const signals = JSON.parse(await readFile("website/species-signals.json", "utf8"));
  assert.deepEqual(signals.cindervox, {
    default: "/vault/assets/cindervox.png",
    passive: "/vault/assets/cindervoxpassive.png",
    signal: "/vault/assets/cindervoxx.png",
  });
  assert.deepEqual(signals.porpoise, {
    default: "/vault/assets/porpoise.png",
  });

  await Promise.all(
    Object.values(signals).flatMap((intents) =>
      Object.values(intents).map((webPath) => access(`website${webPath}`)),
    ),
  );

  const mythology = await readFile("website/mythology.html", "utf8");
  const controller = await readFile("website/scripts/species-signals.js", "utf8");
  assert.match(mythology, /scripts\/image-fallback\.js/);
  assert.match(mythology, /ThresholdImages\.candidatesFor/);
  assert.match(mythology, /ThresholdImages\.loadWithFallback/);
  assert.doesNotMatch(mythology, /const document = selectedNote\.document/);
  assert.doesNotMatch(mythology, /id="viewer-note"[^>]*href="#"/);
  assert.match(mythology, /scripts\/species-signals\.js/);
  assert.match(controller, /fetch\("\/species-signals\.json"/);
  assert.match(controller, /window\.openCindervox/);
  assert.match(controller, /window\.openPorpoise/);
  assert.match(controller, /button\.hidden = !variants/);
  assert.match(controller, /function variantsFor\(speciesKey\)/);
  for (const species of ["cindervox", "porpoise", "whisperhawk", "stonecat", "lumenstag"]) {
    assert.match(controller, new RegExp(`${species}: ["']\/`));
  }
  for (const intent of ["default", "passive", "signal"]) {
    assert.match(mythology, new RegExp(`data-species-intent="${intent}"`));
  }
});

test("keeps local paths and personal authorship out of public vault data", async () => {
  const vaultData = await readFile("website/data/threshold-vault.json", "utf8");

  assert.match(vaultData, /"authorship": "echoroot & theghost"/);
  assert.doesNotMatch(vaultData, /C:\\\\Users\\\\/);
  assert.doesNotMatch(vaultData, /James Romeo/);
});

test("keeps Basin east of Herb Room while restoring the south Waterfall exit", async () => {
  const vault = JSON.parse(await readFile("website/data/threshold-vault.json", "utf8"));
  const basinDocument = vault.documents.find((document) => document.id === "basin");
  const oldForestDocument = vault.chambers.find((chamber) => chamber.id === "old-forest");

  assert.equal(basinDocument.title, "Basin");
  assert.equal(basinDocument.asset, "basin.png");
  assert.equal(basinDocument.publish, true);
  assert.equal(basinDocument.draft, false);
  await access("website/assets/basin.png");

  const herbRoom = await readFile("website/environment/herbroom.html", "utf8");
  const basin = await readFile("website/environment/basin.html", "utf8");
  const oldForest = await readFile("website/environment/old-forest.html", "utf8");
  const waterfall = await readFile("website/environment/waterfall.html", "utf8");
  const mythology = await readFile("website/mythology.html", "utf8");
  assert.match(basin, /data-threshold-environment="basin"/);
  assert.match(basin, /data-origin-chamber="herbroom"/);
  assert.match(basin, /src="\/assets\/basin\.png"/);
  assert.match(herbRoom, /east-threshold__cue" href="\/environment\/basin\.html"/);
  assert.match(herbRoom, /href="\/environment\/waterfall\.html" class="exit-south">Look South/);
  assert.match(basin, /href="\/environment\/herbroom\.html"/);
  assert.match(basin, /href="\/environment\/old-forest\.html"/);
  assert.match(oldForest, /data-branch="old-forest"/);
  assert.match(oldForest, /scripts\/chamber-loader\.js/);
  assert.deepEqual(basinDocument.exits, ["old-forest"]);
  assert.ok(oldForestDocument, "expected Old Forest to be a published chamber");
  assert.equal(oldForestDocument.route, "/environment/old-forest");
  assert.match(oldForestDocument.body, /The Old Forest is an environment defined by ancient memory/);
  assert.match(waterfall, /<a href="\/environment\/herbroom\.html">[\s\S]*?Return North/);
  assert.match(waterfall, /src="\/assets\/images\/Waterfall\.jpg"/);
  assert.match(waterfall, /into the Forest biome/);
  await access("website/assets/images/Waterfall.jpg");
  assert.ok(!vault.chambers.some((chamber) => chamber.id === "waterfall"));
  assert.match(mythology, /values\.includes\('mythology'\)/);
});

test("keeps local vault filesystem paths out of public output", async () => {
  const vault = JSON.parse(await readFile("website/data/threshold-vault.json", "utf8"));
  const index = JSON.parse(await readFile("website/data/vault-index.json", "utf8"));
  const publicData = JSON.stringify({ vault, index });
  const engine = await readFile("website/threshold-engine.js", "utf8");

  assert.equal("vaultRoot" in vault, false);
  assert.equal("publishRoot" in vault, false);
  assert.equal("vaultRoot" in index, false);
  assert.equal(publicData.includes("C:\\\\Users\\\\"), false);
  assert.ok(vault.documents.every((document) => document.publish !== false && document.draft !== true));
  assert.match(engine, /noteTitle: PUBLIC_AUTHORSHIP/);
});

test("publishes and renders the four-path glyph archive", async () => {
  const index = JSON.parse(await readFile("website/config/glyphs.json", "utf8"));
  assert.deepEqual(Object.keys(index.glyphs), ["collapse", "expand", "fog", "soil"]);

  for (const glyphId of Object.keys(index.glyphs)) {
    const glyph = index.glyphs[glyphId];
    assert.equal(glyph.id, glyphId);
    assert.equal(glyph.asset, `/vault/glyphs/${glyphId}.png`);
    assert.ok(glyph.name);
    assert.ok(glyph.text);
    await access(`website${glyph.asset}`);
  }

  const engine = await readFile("website/scripts/glyphs.js", "utf8");
  const page = await readFile("website/glyphs.html", "utf8");
  assert.match(page, /scripts\/emotional-engine\.js/);
  assert.match(page, /scripts\/image-fallback\.js/);
  assert.match(engine, /fetch\("\/config\/glyphs\.json"/);
  assert.match(engine, /getMazeDepth/);
  assert.match(engine, /threshold:maze-depth-changed/);
  assert.match(engine, /archive\.dataset\.weather = choice/);
  assert.match(engine, /emotions\.checkGlyphAppearance/);
  assert.match(engine, /ThresholdEmotions\.activateGlyph/);
  assert.match(engine, /ThresholdImages\.loadWithFallback/);
  assert.match(engine, /chamber\.replaceChildren\(section\)/);
});