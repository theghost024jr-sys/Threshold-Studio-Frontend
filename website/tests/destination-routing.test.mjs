import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import spokes from "../config/spokes.json" with { type: "json" };
import { buildFibonacciUrl } from "../scripts/fibonacci-routing.js";

const hubDestinations = [
  "housegarden.html",
  "ethos.html",
  "discover.html",
  "invitation.html",
  "mythology.html",
  "glyphs.html",
  "dialogues.html",
  "contact.html"
];

test("routes Hub cards to owned destination pages", async () => {
  const hub = await readFile(new URL("../index.html", import.meta.url), "utf8");
  for (const destination of hubDestinations) {
    assert.match(hub, new RegExp(`href=["']${destination}["']`));
  }
  assert.doesNotMatch(hub, /href=["']spoke\.html/);
});

test("ships the Fib 13 Hub reactor interaction contract", async () => {
  const hub = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const reactor = await readFile(
    new URL("../scripts/fibonacci-entry.js", import.meta.url),
    "utf8"
  );

  assert.match(hub, /data-hub-wheel/);
  assert.match(hub, /data-hub-node-field/);
  assert.match(hub, /data-hub-receptor/);
  assert.match(hub, /class=["']entry-reactor["'][\s\S]*?<\/div>\s*<div class=["']entry-engine-core["'] data-engine-core/);
  assert.match(hub, /data-engine-state=["']latent["']/);
  assert.match(hub, /data-void-field/);
  assert.match(hub, /fibonacci-entry\.js\?v=reveal-5/);
  assert.match(reactor, /const nodeCount = 8/);
  assert.match(reactor, /threshold:hub-signal/);
  assert.match(reactor, /threshold:engine-event/);
  assert.match(reactor, /type === "reveal-request"/);
  assert.match(reactor, /activateEngineReveal\(event\.detail\.reveal\)/);
  assert.match(reactor, /emitEngineEvent\("reveal-generated"/);
  assert.doesNotMatch(reactor, /state\.reveal/);
  for (const zone of ["idle", "approach", "contact", "retreat"]) {
    assert.match(reactor, new RegExp(`setZone\\("${zone}"`));
  }
  assert.match(reactor, /emitSignal\("resonance"/);
  assert.match(reactor, /stage === "transition" \? "descent" : "reveal-stage"/);
  for (const signature of ["ethos", "glyphs", "mythology", "dialogues", "contact"]) {
    assert.match(reactor, new RegExp(`${signature}:`));
  }
  assert.match(reactor, /drawVoid\(now, deltaSeconds, metrics\)/);
  assert.match(reactor, /drawFieldFrame\(context, now, deltaSeconds, metrics, activity, signature\)/);
  assert.match(reactor, /frameParticles/);
  assert.match(reactor, /if \(reducedMotion\.matches\) \{\s*drawVoid\(performance\.now\(\), 0, wheelMetrics\(\), true\)/);
  for (const direction of ["left", "right", "top", "bottom"]) {
    assert.match(reactor, new RegExp(`${direction}: \\{ color:`));
  }
  for (const theme of ["root-bloom", "glyphfall-alignment", "cycle-burst", "drift-scatter", "threshold-opening", "firefall-origin", "symbol-cascade", "signal-oscillation", "transmission-burst"]) {
    assert.match(reactor, new RegExp(`id: "${theme}"`));
  }
  assert.match(reactor, /directional: 400, transition: 720/);
  assert.match(reactor, /"threshold:reveal-event"/);
  assert.match(reactor, /"tight-radius"/);
  assert.match(reactor, /"gesture"/);
  assert.match(reactor, /function drawRevealEffect\(context, now, metrics\)/);
  assert.match(reactor, /const glow = engineState\.reveal\.context\.glow/);
  for (const stage of ["directional", "chamber", "transition"]) {
    assert.match(reactor, new RegExp(`"${stage}"`));
  }
});

test("keeps Fibonacci lineage on the destination page", () => {
  assert.equal(
    buildFibonacciUrl({
      spoke: "house-garden",
      path: "garden",
      version: "v3-vines",
      fib: 8
    }, "housegarden.html"),
    "housegarden.html?id=house-garden&path=garden&version=v3-vines&fib=8"
  );
});

test("ships every declared spoke page with the destination loader", async () => {
  for (const spoke of spokes.spokes) {
    const pageUrl = new URL(`../${spoke.entry}`, import.meta.url);
    await access(pageUrl);
    const page = await readFile(pageUrl, "utf8");
    assert.match(page, new RegExp(`data-threshold-spoke=["']${spoke.id}["']`));
    assert.match(page, /scripts\/destination-page\.js/);
  }
});

test("keeps Engine outside the Fibonacci page topology", async () => {
  const manifest = JSON.parse(await readFile(
    new URL("../config/spokes.json", import.meta.url),
    "utf8"
  ));
  const topology = JSON.parse(await readFile(
    new URL("../config/page-topology.json", import.meta.url),
    "utf8"
  ));
  const engine = await readFile(new URL("../deep-system/engine.html", import.meta.url), "utf8");
  const hub = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const reactor = await readFile(new URL("../scripts/fibonacci-entry.js", import.meta.url), "utf8");

  assert.ok(!manifest.spokes.some((spoke) => spoke.id === "engine"));
  assert.ok(!Object.hasOwn(topology.spokes, "engine"));
  assert.doesNotMatch(engine, /data-threshold-spoke=["']engine/);
  assert.doesNotMatch(engine, /destination-page\.js|node-runtime\.js|spoke-tabs\.js/);
  assert.match(hub, /class=["']entry-engine["'][^>]+href=["']deep-system\/engine\.html/);
  assert.match(reactor, /querySelectorAll\(["']\.entry-actions a["']\)/);
  assert.doesNotMatch(reactor, /querySelectorAll\(["'][^"']*\.entry-engine/);
});

test("destination loader reconstructs and renders node children", async () => {
  const loader = await readFile(
    new URL("../scripts/destination-page.js", import.meta.url),
    "utf8"
  );
  assert.match(loader, /ThresholdNodes\.activate/);
  assert.match(loader, /node\.children/);
  assert.match(loader, /renderChildren\(view, node/);
  assert.match(loader, /renderParent\(view, topology, spoke, node\)/);
  assert.match(loader, /choice\.fib/);
  assert.match(loader, /Authored links remain available/);
  assert.match(loader, /prefers-reduced-motion: reduce/);
  assert.match(loader, /threshold-reveal-arrival-layer/);
  assert.doesNotMatch(loader, /node\.choices/);
  assert.doesNotMatch(loader, /location\.assign\(["']spoke\.html/);
});

test("grounds a bidirectional Fibonacci page graph", async () => {
  const topology = JSON.parse(await readFile(
    new URL("../config/page-topology.json", import.meta.url),
    "utf8"
  ));
  assert.deepEqual(topology.sequence, [13, 8, 5, 3, 2, 1]);
  assert.equal(topology.directions.inward, "13 -> 8 -> 5 -> 3 -> 2 -> 1");
  assert.equal(topology.directions.outward, "1 -> 2 -> 3 -> 5 -> 8 -> 13");

  for (const [spokeId, spoke] of Object.entries(topology.spokes)) {
    for (const childId of spoke.children) {
      const child = topology.nodes[childId];
      assert.ok(child.parents.includes(spokeId));
      const childFib = child.fibByParent?.[spokeId] || child.fib;
      assert.equal(topology.sequence.indexOf(childFib), topology.sequence.indexOf(spoke.fib) + 1);
    }
  }
  for (const [nodeId, node] of Object.entries(topology.nodes)) {
    for (const childId of node.children) {
      const child = topology.nodes[childId];
      assert.ok(child.parents.includes(nodeId));
      const childFib = child.fibByParent?.[nodeId] || child.fib;
      assert.equal(topology.sequence.indexOf(childFib), topology.sequence.indexOf(node.fib) + 1);
    }
    for (const parentId of node.parents) {
      const parent = topology.nodes[parentId] || topology.spokes[parentId];
      assert.ok(parent, `${nodeId} has a declared parent`);
      assert.ok(parent.children.includes(nodeId), `${parentId} links inward to ${nodeId}`);
    }
  }
  assert.equal(topology.nodes["lantern-vault"].fibByParent.ethos, 5);
  assert.equal(topology.nodes["lantern-vault"].fibByParent["lantern-pedal"], 3);
  assert.deepEqual(topology.nodes["root-archive"].parents, ["house-garden", "ethos"]);
  assert.deepEqual(topology.nodes["storm-cabinet"].parents, ["seasonal-alcove", "fracture-pedal"]);
});