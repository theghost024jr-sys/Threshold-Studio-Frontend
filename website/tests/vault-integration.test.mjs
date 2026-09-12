import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import { createArchiveModule } from "../archive.js";


test("loads generated canonical vault data", async () => {
  const vault = JSON.parse(await readFile("website/data/threshold-vault.json", "utf8"));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => ({
    ok: url === "/data/threshold-vault.json",
    status: 200,
    async json() {
      return vault;
    },
  });

  try {
    const archive = createArchiveModule();
    const loaded = await archive.loadVault();
    assert.equal(
      loaded.vaultRoot,
      "C:\\Users\\James Romeo\\Threshold\\ThresholdVault\\theghost",
    );
    assert.equal(loaded.counts.publishedMarkdown, 129);
    assert.ok(Array.isArray(loaded.entities));
    assert.ok(Array.isArray(loaded.chambers));
    const chamberAsset = loaded.chambers.flatMap((chamber) => chamber.assets || [])[0];
    assert.ok(chamberAsset, "expected a published chamber to resolve a vault asset");
    assert.match(chamberAsset.sourceRelativePath, /^_publish\/assets\//);
    assert.match(chamberAsset.webPath, /^\/assets\/vault\/[a-f0-9]{12}\.[a-z0-9]+$/);
    await access(`website${chamberAsset.webPath}`);

    const garden = loaded.documents.find((document) => document.id === "garden");
    assert.equal(garden.asset, "/assets/vault/5b8218c41ed2.png");
    await access(`website${garden.asset}`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

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

test("keeps Basin in the Circle 1 chamber chain", async () => {
  const vault = JSON.parse(await readFile("website/data/threshold-vault.json", "utf8"));
  const chambers = Object.fromEntries(vault.chambers.map((chamber) => [chamber.id, chamber]));

  assert.equal(chambers.basin.chamber, "HouseAndGarden");
  assert.equal(chambers.basin.route, "/environment/basin");
  assert.deepEqual(chambers.basin.entries, ["herbroom"]);
  assert.deepEqual(chambers.basin.exits, ["waterfall"]);
  assert.deepEqual(chambers.basin.neighbors, []);
  assert.equal(chambers.basin.asset, "/assets/basin.png");
  assert.equal(chambers.basin.publish, true);
  assert.equal(chambers.basin.draft, false);
  assert.deepEqual(chambers.herbroom.exits, ["basin"]);
  assert.deepEqual(chambers.waterfall.entries, ["basin"]);
  await access("website/assets/basin.png");

  const herbRoom = await readFile("website/environment/herbroom.html", "utf8");
  const basin = await readFile("website/environment/basin.html", "utf8");
  const waterfall = await readFile("website/environment/waterfall.html", "utf8");
  const mythology = await readFile("website/mythology.html", "utf8");
  assert.match(herbRoom, /href="\/environment\/basin\.html"/);
  assert.doesNotMatch(herbRoom, /href="\/environment\/waterfall\.html"/);
  assert.match(basin, /href="\/environment\/herbroom\.html"/);
  assert.match(basin, /href="\/environment\/waterfall\.html"/);
  assert.match(waterfall, /href="\/environment\/basin\.html"/);
  assert.doesNotMatch(waterfall, /href="\/environment\/herbroom\.html"/);
  assert.match(mythology, /values\.includes\('mythology'\)/);
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
  assert.match(engine, /depth \+= 1/);
  assert.match(engine, /archive\.dataset\.weather = choice/);
  assert.match(engine, /emotions\.checkGlyphAppearance/);
  assert.match(engine, /ThresholdEmotions\.activateGlyph/);
  assert.match(engine, /ThresholdImages\.loadWithFallback/);
  assert.match(engine, /chamber\.replaceChildren\(section\)/);
});