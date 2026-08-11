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
  "contact.html",
  "engine.html"
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
  assert.match(hub, /data-void-field/);
  assert.match(hub, /fibonacci-entry\.js\?v=frame-3/);
  assert.match(reactor, /const nodeCount = 8/);
  assert.match(reactor, /threshold:hub-signal/);
  for (const zone of ["idle", "approach", "contact", "retreat"]) {
    assert.match(reactor, new RegExp(`setZone\\("${zone}"`));
  }
  assert.match(reactor, /emitSignal\("resonance"/);
  assert.match(reactor, /emitSignal\("descent"/);
  for (const signature of ["ethos", "glyphs", "mythology", "dialogues", "contact"]) {
    assert.match(reactor, new RegExp(`${signature}:`));
  }
  assert.match(reactor, /drawVoid\(now, deltaSeconds, metrics\)/);
  assert.match(reactor, /drawFieldFrame\(context, now, deltaSeconds, metrics, activity, signature\)/);
  assert.match(reactor, /frameParticles/);
  assert.match(reactor, /if \(reducedMotion\.matches\) \{\s*drawVoid\(performance\.now\(\), 0, wheelMetrics\(\), true\)/);
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