import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { INVARIANT_FAILURE } from "../scripts/invariant-kernel.js";
import { validateLivingPagePublication } from "../scripts/living-page-contract.js";

const publishedPage = {
  route: "/pages/published.html",
  branches: [{ label: "Return", route: "/index.html" }]
};
const publishedNote = {
  publish: true,
  draft: false,
  relativePath: "_publish/published.md"
};

test("[TST-004] permits a declared route backed by a published non-draft source", () => {
  assert.deepEqual(
    validateLivingPagePublication({
      noteId: "published",
      page: publishedPage,
      note: publishedNote,
      route: "/pages/published.html"
    }),
    { page: publishedPage, note: publishedNote }
  );
});

test("[TST-005] rejects an unpublished or archival source from public routing", () => {
  for (const note of [
    { ...publishedNote, publish: false },
    { ...publishedNote, relativePath: "03 - Organism/Lantern Myth.md" }
  ]) {
    assert.throws(
      () => validateLivingPagePublication({
        noteId: "lantern",
        page: publishedPage,
        note,
        route: "/pages/published.html"
      }),
      (error) => error.code === INVARIANT_FAILURE.UNSUPPORTED_CLAIM
    );
  }
});

test("[TST-006] rejects a draft source from public routing", () => {
  assert.throws(
    () => validateLivingPagePublication({
      noteId: "draft",
      page: publishedPage,
      note: { ...publishedNote, draft: true },
      route: "/pages/published.html"
    }),
    (error) => error.code === INVARIANT_FAILURE.UNSUPPORTED_CLAIM
  );
});

test("keeps every configured living route on the published vault surface", async () => {
  const [configuration, vault] = await Promise.all([
    readFile(new URL("../config/living-pages.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/threshold-vault.json", import.meta.url), "utf8").then(JSON.parse)
  ]);
  for (const page of configuration.pages) {
    const note = vault.documents.find((document) => document.id === page.noteId);
    assert.doesNotThrow(() => validateLivingPagePublication({
      noteId: page.noteId,
      page,
      note,
      route: page.route
    }));
  }
});
