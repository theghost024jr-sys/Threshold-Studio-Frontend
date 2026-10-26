import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const expectedIds = [
  "role-expressions",
  "species-signals",
  "index-0001",
  "index-0002",
  "index-0003",
  "index-0004",
  "glyph_fog",
  "glyph_expand",
  "glyph_collapse",
  "glyph_soil"
];

test("keeps the Herb Room east threshold as an authored environmental reveal", async () => {
  const [configuration, herbRoom] = await Promise.all([
    readFile(new URL("../config/living-pages.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../environment/herbroom.html", import.meta.url), "utf8")
  ]);
  assert.ok(!configuration.pages.some((page) => page.noteId === "herbroom-threshold-east"));
  assert.match(herbRoom, /east-threshold__cue" href="\/environment\/basin\.html"/);
  assert.match(herbRoom, /const revealEast = \(clientX\)/);
});

test("binds every living scaffold route to one publishable vault note", async () => {
  const [configuration, vault] = await Promise.all([
    readFile(new URL("../config/living-pages.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/threshold-vault.json", import.meta.url), "utf8").then(JSON.parse)
  ]);
  assert.deepEqual(configuration.pages.map((page) => page.noteId), expectedIds);

  for (const page of configuration.pages) {
    const note = vault.documents.find((document) => document.id === page.noteId);
    assert.ok(note, `${page.noteId} must resolve to a vault record`);
    assert.equal(note.publish, true);
    assert.notEqual(note.draft, true);
    assert.ok(Array.isArray(page.branches) && page.branches.length > 0);

    const file = new URL(`..${page.route}`, import.meta.url);
    await access(file);
    const source = await readFile(file, "utf8");
    assert.match(source, new RegExp(`data-vault-note-id="${page.noteId}"`));
    for (const branch of page.branches) {
      assert.match(branch.route, /^\/(?:[^/]+\/)*[^/]+\.html$/);
    }
  }
});

test("renders authored vault links only through declared living routes", async () => {
  const [source, contract] = await Promise.all([
    readFile(new URL("../scripts/living-page.js", import.meta.url), "utf8"),
    readFile(new URL("../scripts/living-page-contract.js", import.meta.url), "utf8")
  ]);
  assert.match(source, /validateLivingPagePublication/);
  assert.match(contract, /No declared living route resolves/);
  assert.match(contract, /has no declared branch destination/);
  assert.match(source, /Published media .* is not available/);
  assert.match(source, /document\.createElement\("a"\)/);
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
});
