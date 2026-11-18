import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Frog Chamber is a registered node reached by following the Frog", async () => {
  const [page, meadow, app, topology, ledger] = await Promise.all([
    read("../portal/src/pages/FrogChamber.jsx"),
    read("../portal/src/pages/PlasmaBloomMeadow.jsx"),
    read("../portal/src/App.jsx"),
    read("../config/world-topology.json"),
    read("../config/route-layers.json"),
  ]);

  assert.match(app, /<Route path="\/frog-chamber" element={<FrogChamber \/>} \/>/);
  assert.match(meadow, /You haven&rsquo;t eaten\./);
  assert.match(meadow, /The Frog starts walking\./);
  assert.match(meadow, /<Link to="\/frog-chamber">Follow the Frog<\/Link>/);
  // Following is voluntary: the link is gated on the field going quiet, not a quest flag.
  assert.match(meadow, /setFrogHere\(true\)/);
  assert.doesNotMatch(meadow, /frog.*quest|quest.*frog/i);

  // All created pages are nodes: the chamber is declared in canonical topology.
  const parsed = JSON.parse(topology);
  const place = parsed.places.find((candidate) => candidate.id === "frog-chamber");
  assert.ok(place, "frog-chamber is a declared topology place");
  assert.equal(place.route, "/portal/frog-chamber");
  assert.equal(place.containedBy, "plasma-bloom-meadow");
  assert.equal(place.returnsTo, "plasma-bloom-meadow");
  // Arrival stays a followed passage, not an open map hop.
  assert.equal(place.passage.mode, "stillness");
  const meadowPlace = parsed.places.find((candidate) => candidate.id === "plasma-bloom-meadow");
  assert.ok(meadowPlace.connectsTo.includes("frog-chamber"), "the Meadow seam is reciprocal");

  // The route ledger keeps the chamber's echo back to the Meadow.
  const layers = JSON.parse(ledger);
  const entry = layers.routes.find((candidate) => candidate.route === "/portal/frog-chamber");
  assert.ok(entry, "frog-chamber is in the route ledger");
  assert.equal(entry.node, "frog-chamber");
  assert.equal(entry.echo, "/portal/plasma-bloom-meadow");
});

test("the chamber tests need rather than displaying hunger", async () => {
  const page = await read("../portal/src/pages/FrogChamber.jsx");

  assert.match(page, /One table\. Two places\./);
  assert.match(page, /Beef Wellington/);
  // The Wellington is ordinary; the strange part is who made it.
  assert.match(page, /Not magical\. It is Beef Wellington\./);
  assert.match(page, /The strange part is that a frog made it\./);
  // Hunger changes because they ate; no meter, no number, no pickup reward.
  assert.doesNotMatch(page, /\+50|HUNGER|hunger:\s*\d|progress\s*bar/i);
  assert.doesNotMatch(page, /TAKE prompt|Take the jar/i);
  assert.match(page, /We eat\. There is almost no conversation\./);
});

test("dinner is not the end — the chamber ends in rest under the stars", async () => {
  const [page, stylesheet] = await Promise.all([
    read("../portal/src/pages/FrogChamber.jsx"),
    read("../portal/src/pages/FrogChamber.css"),
  ]);

  assert.match(page, /Outside: a small fire, a sleeping bag on the ground/);
  assert.match(page, /Maybe the Frog is still nearby\. Maybe not\./);
  assert.match(page, /The jar is wherever you left it\./);
  assert.match(page, /You lie down\./);
  assert.match(page, /The fire settles\./);
  assert.match(page, /You look up at the stars\./);

  // No menu, no sleep button, no clock, no objective, no way onward.
  assert.match(page, /No menu\./);
  assert.match(page, /No sleep button\./);
  assert.match(page, /No clock\./);
  assert.match(page, /No objective\./);
  assert.doesNotMatch(page, /Walk back to the Meadow|frog-nav|sleep button.*onClick/i);

  // Tiredness is hidden state: known and experienced, never metered.
  assert.match(page, /Threshold knows you are tired\. You experience being tired\./);
  assert.match(page, /no ENERGY 17\/100/);
  assert.match(page, /left you alone under the stars\./);
  assert.match(stylesheet, /\.frog-rest__stars::after/);
  assert.match(stylesheet, /\.frog-chamber--after \.frog-fire span/);
});

test("the stars are not the destination — sleep arrives, then the chamber withdraws", async () => {
  const [page, stylesheet] = await Promise.all([
    read("../portal/src/pages/FrogChamber.jsx"),
    read("../portal/src/pages/FrogChamber.css"),
  ]);

  // One continuous scene. Time and settling carry both transitions — no control, no navigation.
  assert.match(page, /const SLEEP_AFTER_MS = \d+/);
  assert.match(page, /const WAKE_AFTER_MS = \d+/);
  assert.match(page, /setTimeout\(\(\) => setPhase\('sleeping'\), SLEEP_AFTER_MS\)/);
  assert.match(page, /setTimeout\(\(\) => setPhase\('awake'\), WAKE_AFTER_MS\)/);
  assert.match(page, /phase === 'sleeping' && \(/);
  assert.match(page, /className="frog-sleep"/);
  assert.doesNotMatch(page, /<Link|to="\/|react-router-dom/);

  // Waking: the chamber furniture is gone, only the underlying environment remains.
  assert.match(page, /phase === 'awake' && \(/);
  assert.match(page, /phase !== 'awake' && \(/);
  assert.match(page, /You wake\./);
  assert.match(page, /No Frog\. No table\. No Wellington\. No fire\. No sleeping bag\./);
  assert.match(page, /frog-awake__line/);
  assert.match(page, /frog-awake__gone/);

  // The jar stays unresolved — not confirmed present or absent.
  assert.match(page, /As for the jar — you do not check\./);
  assert.match(page, /not something this place will tell you\./);

  assert.match(stylesheet, /@keyframes frog-fall-asleep/);
  assert.match(stylesheet, /@keyframes frog-wake/);
});

test("the band listens to itself — listening is reciprocal", async () => {
  const band = await read("../portal/src/pages/SnailBand.jsx");

  assert.match(band, /They listen to each other\./);
  assert.match(band, /The Beetle hears the frogs on bass; the Frog listens for the groove/);
  assert.match(band, /The band is a loop, not a chain\./);
});

test("the low end is carried by the chamber, not an instrument", async () => {
  const [page, stylesheet] = await Promise.all([
    read("../portal/src/pages/FrogChamber.jsx"),
    read("../portal/src/pages/FrogChamber.css"),
  ]);

  assert.match(page, /The Chamber carries the low end\./);
  assert.match(page, /water moving, mud shifting, reeds rubbing/);
  assert.match(page, /low\.frequency\.value = 44/);
  assert.match(stylesheet, /\.frog-water/);
  assert.match(stylesheet, /\.frog-reeds/);
  assert.match(stylesheet, /\.frog-stones/);
  assert.match(stylesheet, /\.frog-fire/);
});

test("the jar can be set down and its fate stays unresolved", async () => {
  const page = await read("../portal/src/pages/FrogChamber.jsx");

  assert.match(page, /You can put that down\./);
  assert.match(page, /\['table', 'Put it on the table'\]/);
  assert.match(page, /\['fire', 'Put it beside the fire'\]/);
  assert.match(page, /\['held', 'Keep holding it'\]/);
  assert.match(page, /The jar is sitting on the table\./);
  assert.match(page, /You get up\. Frog stays\./);
  // Threshold decides; the design does not answer.
  assert.match(page, /Did I finally find where it wanted to be\?/);
  assert.match(page, /We don&rsquo;t answer that yet\. That is for Threshold to decide\./);
});
