import { activate, activateAsset, progression, progressionResponse, signProgression } from "./activation.js";
import { route } from "./routing.js";

export default {
  async fetch(request, env) {
    const match = route(request);
    if (match.type === "progression") {
      const state = await progression(request, env.SEED_SECRET);
      return Response.json({ seedPlanted: state.seedPlanted === true }, { headers: { "cache-control": "no-store" } });
    }
    if (match.type === "plant") {
      if (!env.SEED_SECRET) return Response.json({ error: "Seed signing unavailable" }, { status: 503 });
      const body = await request.json();
      const branch = String(body?.spoke || "").replace(/[^a-z0-9-]/g, "");
      if (!branch) return Response.json({ error: "Branch is required" }, { status: 400 });
      const state = { seedPlanted: true, plantedAt: Date.now(), branch };
      return progressionResponse(state, await signProgression(state, env.SEED_SECRET));
    }
    if (match.type === "activate") return activate(request, env);
    if (match.type === "asset") return activateAsset(match, env);
    return env.ASSETS ? env.ASSETS.fetch(request) : Response.json({ error: "Route not found" }, { status: 404 });
  }
};