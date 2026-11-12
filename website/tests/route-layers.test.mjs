import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const website = new URL("../", import.meta.url);
const root = new URL("../../", import.meta.url);

const readJson = async (relative) =>
  JSON.parse(await readFile(new URL(relative, website), "utf8"));

const layers = await readJson("config/route-layers.json");
const topology = await readJson("config/world-topology.json");
const flow = await readJson("config/access-flow.json");

const routes = Array.isArray(layers.routes) ? layers.routes : [];
const layerIds = layers.layers.map((layer) => layer.id);
const nodeRoutes = new Map(topology.places.map((place) => [place.id, place.route]));
const byRoute = new Map(routes.map((entry) => [entry.route, entry]));

test("the ledger is structurally sound", () => {
  assert.equal(layers.version, 1);
  assert.ok(layers.revision, "revision is recorded");
  assert.ok(routes.length > 90, "the deployed surface is represented");

  assert.equal(new Set(layerIds).size, layerIds.length, "layer ids are unique");
  const orders = layers.layers.map((layer) => layer.order);
  assert.deepEqual(orders, [...orders].sort((a, b) => a - b), "layers are ordered");

  const seen = new Set();
  for (const entry of routes) {
    assert.ok(layerIds.includes(entry.layer), entry.route + " has a known layer");
    assert.ok(
      ["canonical", "experimental", "legacy", "redirect"].includes(entry.status),
      entry.route + " has a known status"
    );
    assert.ok(entry.route.startsWith("/"), entry.route + " is root-relative");
    assert.ok(!seen.has(entry.route), entry.route + " appears once");
    seen.add(entry.route);
    if (entry.echo) {
      assert.ok(entry.echo.startsWith("/"), entry.route + " echoes a route");
    }
  }
});

test("the spine is the canonical entry path in declared order", () => {
  const spine = routes.filter((entry) => entry.layer === "spine");
  const expected = topology.canonicalEntryPath.map((id) => nodeRoutes.get(id));
  assert.deepEqual(spine.map((entry) => entry.route), expected);

  for (const id of topology.canonicalEntryPath) {
    const place = topology.places.find((candidate) => candidate.id === id);
    const entry = byRoute.get(place.route);
    assert.ok(entry, place.route + " is in the ledger");
    assert.equal(entry.status, "canonical");
    if (place.returnsTo) {
      assert.equal(entry.echo, nodeRoutes.get(place.returnsTo));
    }
  }
});

test("every declared place keeps its echo", () => {
  for (const place of topology.places) {
    const entry = byRoute.get(place.route);
    assert.ok(entry, place.route + " is in the ledger");
    assert.equal(entry.layer, place.route.startsWith("/portal") ? "portal" : entry.layer);
    if (place.returnsTo) {
      assert.equal(entry.echo, nodeRoutes.get(place.returnsTo), place.route + " echo");
    }
  }
});

test("access-flow stages route into the ledger as canonical", () => {
  for (const stage of flow.stages) {
    const entry = byRoute.get(stage.route);
    assert.ok(entry, stage.route + " is in the ledger");
    assert.equal(entry.status, "canonical", stage.route + " is canonical");
  }
});

test("the worker edge agrees with the ledger", async () => {
  const worker = await readFile(new URL("website/_worker.js", root), "utf8");

  for (const redirect of layers.edge.redirects) {
    assert.ok(worker.includes(`url.pathname === "${redirect.from}"`), redirect.from);
    assert.ok(
      worker.includes(`Response.redirect(new URL("${redirect.to}", request.url), ${redirect.status})`),
      redirect.from + " redirects to " + redirect.to
    );
  }
  for (const prefix of layers.edge.sealed) {
    assert.ok(worker.includes(`url.pathname.startsWith("${prefix}")`), prefix + " is sealed");
  }
  for (const retired of layers.edge.retired) {
    assert.ok(!byRoute.has(retired), retired + " is absent from the ledger");
  }

  assert.match(worker, /url\.pathname === "\/api\/routes"/);
  assert.match(worker, /loadRouteLayers\(env, request\)/);
  assert.match(worker, /"\/config\/route-layers\.json"/);
});

test("the unreturned count is still the open finding", () => {
  // The audit recorded 35; /portal/index.html is now a redirect alias, not an unreturned route.
  const unreturned = routes.filter((entry) => entry.orphaned);
  assert.equal(unreturned.length, 34);
  assert.ok(unreturned.every((entry) => entry.layer !== "spine"), "no spine route is unreturned");
});

test("artifact output is quarantined in its own layer", () => {
  const artifacts = routes.filter((entry) => entry.layer === "artifact");
  assert.ok(artifacts.length >= 20);
  for (const entry of artifacts) {
    assert.ok(
      layers.edge.sealed.some((prefix) => entry.route.startsWith(prefix)),
      entry.route + " sits under a sealed prefix"
    );
    assert.equal(entry.status, "experimental");
  }
});
