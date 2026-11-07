import { requireSupportedClaim } from "./invariant-kernel.js";

export function validateLivingPagePublication({ noteId, page, note, route }) {
  requireSupportedClaim(
    page && page.route === route,
    `No declared living route resolves ${noteId}.`,
    { noteId, route }
  );
  requireSupportedClaim(
    note
      && note.publish === true
      && note.draft !== true
      && typeof note.relativePath === "string"
      && note.relativePath.startsWith("_publish/"),
    `${noteId} is not a publishable vault record.`,
    { noteId, relativePath: note?.relativePath }
  );
  requireSupportedClaim(
    Array.isArray(page.branches) && page.branches.length > 0,
    `${noteId} has no declared branch destination.`,
    { noteId }
  );
  return { page, note };
}
