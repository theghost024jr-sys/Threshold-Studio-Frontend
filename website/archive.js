function emptySelection() {
  return {
    speciesNote: null,
    weatherNote: null,
    chamberNote: null,
    actorNote: null,
    routeMeta: null,
    routeNote: null,
    territoryChamber: null,
    lore: ""
  };
}

const VAULT_DATA_URL = "/data/threshold-vault.json";

export function createArchiveModule() {
  let vaultPromise = null;

  function loadVaultData() {
    if (!vaultPromise) {
      vaultPromise = fetch(VAULT_DATA_URL, { cache: "no-store" }).then((response) => {
        if (!response.ok) {
          throw new Error(`Vault data request failed: ${response.status}`);
        }
        return response.json();
      });
    }
    return vaultPromise;
  }

  return {
    async loadVault() {
      return loadVaultData();
    },

    async loadTerritory() {
      const vault = await loadVaultData();
      return { chambers: vault.chambers || [] };
    },

    enterArchive(channel, options, vault) {
      const selection = emptySelection();
      const route = String(options?.route || channel || "").toLowerCase();
      const chambers = vault?.chambers || [];
      const chamber = chambers.find((candidate) => {
        const values = [candidate.id, candidate.title, candidate.chamber, candidate.relativePath]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());
        return values.some((value) => value === route || value.includes(`/${route}`));
      });
      if (chamber) {
        selection.chamberNote = chamber;
        selection.territoryChamber = chamber;
        selection.lore = chamber.body || chamber.description || "";
      }
      return selection;
    }
  };
}