import { chambers } from "../../../data/threshold-vault.json";

export async function fetchArchiveEntries() {
  if (!Array.isArray(chambers)) {
    throw new Error("Generated vault data does not contain a chambers list");
  }
  return chambers;
}