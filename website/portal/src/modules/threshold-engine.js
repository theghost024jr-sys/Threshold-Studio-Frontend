const CHANNELS = ["threshold", "fog", "expand", "collapse", "soil"];

export function createPortalEngine() {
  return {
    channels: CHANNELS,
    initialState: {
      channel: "threshold",
      route: "portal",
      status: "ready",
    },
    normalizeChannel(value) {
      return CHANNELS.includes(value) ? value : "threshold";
    },
  };
}