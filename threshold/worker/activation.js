import { readNodeObject, readObject } from "./r2.js";

const COOKIE = "threshold_progression";
const PROTECTED = new Set(["dialogues", "contributions", "vault"]);
const SIGNAL_DIRECTIONS = Object.freeze({
  proceed: new Set(["north"]),
  return: new Set(["south"]),
  lateral: new Set(["east", "west"]),
  stay: new Set(["stay"])
});

function encode(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function cookie(request) {
  const match = (request.headers.get("cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(COOKIE + "="));
  return match ? match.slice(COOKIE.length + 1) : "";
}

async function key(secret, usage) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

export async function signProgression(payload, secret) {
  const encoded = encode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await key(secret, "sign"), new TextEncoder().encode(encoded));
  return encoded + "." + encode(new Uint8Array(signature));
}

export async function progression(request, secret) {
  const [encoded, signature] = cookie(request).split(".");
  if (!encoded || !signature || !secret) return { seedPlanted: false };
  try {
    const supplied = Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(signature.length / 4) * 4, "=")), (character) => character.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", await key(secret, "verify"), supplied, new TextEncoder().encode(encoded));
    if (!valid) return { seedPlanted: false };
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=")), (character) => character.charCodeAt(0))));
  } catch {
    return { seedPlanted: false };
  }
}

export function progressionResponse(payload, signed) {
  return Response.json(payload, { headers: { "set-cookie": `${COOKIE}=${signed}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`, "cache-control": "no-store" } });
}

function exactKeys(value, keys) {
  return value && typeof value === "object"
    && Object.keys(value).length === keys.length
    && keys.every((keyName) => Object.hasOwn(value, keyName));
}

function sameState(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function validatePulse(pulse) {
  if (!exactKeys(pulse, ["state", "seed", "signal"])
    || !exactKeys(pulse.state, ["version", "choice", "direction"])) {
    return false;
  }
  const { state, seed, signal } = pulse;
  if (![state.version, state.choice, state.direction].every((value) => typeof value === "string" && value.length > 0)
    || !SIGNAL_DIRECTIONS[signal]?.has(state.direction)) {
    return false;
  }
  if (signal === "stay") {
    return seed === null;
  }
  if (!exactKeys(seed, ["kind", "fromFib", "state", "relic"])
    || ![5, 8].includes(seed.fromFib)
    || !exactKeys(seed.state, ["version", "choice", "shimmer", "stays"])
    || typeof seed.state.version !== "string"
    || typeof seed.state.choice !== "string"
    || typeof seed.state.shimmer !== "boolean"
    || !Number.isInteger(seed.state.stays)
    || seed.state.stays < 0
    || !exactKeys(seed.relic, ["fib", "direction", "state"])
    || seed.relic.fib !== seed.fromFib
    || seed.relic.direction !== state.direction
    || !sameState(seed.state, seed.relic.state)
    || seed.state.version !== state.version
    || seed.state.choice !== state.choice) {
    return false;
  }
  return signal === "return" ? seed.kind === "return" : seed.kind === "relic";
}

export async function activate(request, env) {
  const body = await request.json();
  const branch = String(body?.spoke || "").replace(/[^a-z0-9-]/g, "");
  const token = String(body?.activation || "").replace(/[^A-Za-z0-9_-]/g, "");
  if (!branch || !token) return Response.json({ error: "Branch and activation are required" }, { status: 400 });
  if (token !== branch && !PROTECTED.has(token) && !validatePulse(body?.pulse)) {
    return Response.json({ error: "Pulse rejected" }, { status: 409 });
  }
  if (PROTECTED.has(token)) {
    const state = await progression(request, env.SEED_SECRET);
    if (!state.seedPlanted) return Response.json({ error: "Plant a seed to activate this branch" }, { status: 403 });
  }
  return readNodeObject(env.NODE_BUNDLES, `nodes/${branch}/${token}.json`, "private, no-store");
}

export function activateAsset(match, env) {
  return readObject(env.NODE_BUNDLES, `assets/${match.branch}/${match.token}/${match.name}`, "private, max-age=3600");
}