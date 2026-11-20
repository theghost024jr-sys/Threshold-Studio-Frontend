import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("the archive keeps story and receipts as distinct registers of one document", async () => {
  const [page, css, script] = await Promise.all([
    read("../conversations-with-ai.html"),
    read("../styles/conversations-with-ai.css"),
    read("../scripts/conversations-with-ai.js"),
  ]);

  // Without JavaScript the full document is visible: both registers in markup,
  // default view "both".
  assert.match(page, /<body data-archive-view="both">/);
  assert.match(page, /data-archive-register="story"/);
  assert.match(page, /data-archive-register="receipts"/);
  assert.match(css, /body\[data-archive-view="story"\] \[data-archive-register="receipts"\] \{ display: none; \}/);
  assert.match(css, /body\[data-archive-view="receipts"\] \[data-archive-register="story"\] \{ display: none; \}/);
  assert.match(script, /document\.body\.dataset\.archiveView = mode/);
});

test("the archive preserves its honesty invariants", async () => {
  const page = await read("../conversations-with-ai.html");

  assert.match(page, /Nobody gets cleaned up for publication\./);
  // Unrecovered lines are flagged, not laundered into transcripts.
  assert.match(page, /exact wording unrecovered/);
  assert.match(page, /none of these lines are presented here as verbatim transcripts/);
  // The gap stays open rather than being filled for a cleaner timeline.
  assert.match(page, /has not yet been recovered/);
  assert.match(page, /open gaps rather than being filled in/);
  // Later echoes are marked as derivative, never as original record.
  assert.match(page, /Later echo &ne; original record/);
  assert.match(page, /<strong>not<\/strong> independent proof/);
  assert.match(page, /nobody has to pretend that he did\./);
});

test("the archive returns to the world it is mapped in", async () => {
  const page = await read("../conversations-with-ai.html");
  const matches = page.match(/href="\/world-map\.html"/g) || [];
  assert.ok(matches.length >= 2, "return passage at both ends of the document");
});
