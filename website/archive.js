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

export function createArchiveModule() {
  return {
    async loadVault() {
      return null;
    },

    async loadTerritory() {
      return null;
    },

    enterArchive() {
      return emptySelection();
    }
  };
}