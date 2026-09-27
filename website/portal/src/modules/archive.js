const VAULT_DATA_URL = "/data/threshold-vault.json";

export async function fetchArchiveEntries() {
  const response = await fetch(VAULT_DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Archive request failed: ${response.status}`);
  }

  const vault = await response.json();
  return Array.isArray(vault?.chambers) ? vault.chambers : [];
}