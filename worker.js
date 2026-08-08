const GROUPS = [
  {
    key: "identity",
    label: "Identity",
    queries: ["ethos:identity", "tag:ethos:identity", "identity ethos", "identity resonance"]
  },
  {
    key: "alignment",
    label: "Alignment",
    queries: ["ethos:alignment", "tag:ethos:alignment", "alignment ethos", "harmonic alignment"]
  },
  {
    key: "behavior",
    label: "Behavior",
    queries: ["ethos:behavior", "tag:ethos:behavior", "behavior ethos", "conduct protocol"]
  },
  {
    key: "invitation",
    label: "Invitation",
    queries: ["ethos:invitation", "tag:ethos:invitation", "invitation ethos", "threshold invitation"]
  },
  {
    key: "ghost",
    label: "Ghost",
    queries: ["ethos:ghost", "tag:ethos:ghost", "ghost ethos", "theghost"]
  }
];

let cachedSearchIndex = null;
let cachedPngIndex = null;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

const PROGRESSION_COOKIE = "threshold_progression";
const PROTECTED_ACTIVATIONS = new Set(["dialogues", "contributions"]);

function base64UrlEncode(value) {
  const bytes = value instanceof Uint8Array ? value : new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function readCookie(request, name) {
  const source = request.headers.get("cookie") || "";
  const prefix = `${name}=`;
  const match = source.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return match ? match.slice(prefix.length) : "";
}

async function signProgression(payload, secret) {
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  return `${encoded}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function verifyProgression(request, secret) {
  const token = readCookie(request, PROGRESSION_COOKIE);
  const [encoded, suppliedSignature] = token.split(".");
  if (!encoded || !suppliedSignature || !secret) {
    return { seedPlanted: false };
  }

  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const progression = JSON.parse(atob(padded));
    const expected = await signProgression(progression, secret);
    return expected === token ? progression : { seedPlanted: false };
  } catch {
    return { seedPlanted: false };
  }
}

function progressionResponse(payload, cookie) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "set-cookie": `${PROGRESSION_COOKIE}=${cookie}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
    }
  });
}

async function activateNode(request, env) {
  const body = await request.json();
  const spoke = String(body?.spoke || "").replace(/[^a-z0-9-]/g, "");
  const activation = String(body?.activation || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!spoke || !activation) {
    return json({ error: "spoke and activation are required" }, 400);
  }

  if (PROTECTED_ACTIVATIONS.has(activation)) {
    const progression = await verifyProgression(request, env.SEED_SECRET);
    if (!progression.seedPlanted) {
      return json({ error: "plant a seed to activate this node" }, 403);
    }
    return json({
      id: activation,
      fib: 3,
      spoke,
      entry: null,
      kind: activation,
      choices: []
    });
  }

  if (!env.NODE_BUNDLES) {
    return json({ error: "node storage is unavailable" }, 503);
  }
  const object = await env.NODE_BUNDLES.get(`nodes/${spoke}/${activation}.json`);
  if (!object) {
    return json({ error: "node not found" }, 404);
  }
  return new Response(object.body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store"
    }
  });
}

async function activateNodeAsset(url, env) {
  if (!env.NODE_BUNDLES) {
    return json({ error: "node storage is unavailable" }, 503);
  }
  const match = url.pathname.match(/^\/api\/nodes\/assets\/([a-z0-9-]+)\/([a-zA-Z0-9_-]+)\/([^/]+)$/);
  if (!match) {
    return json({ error: "invalid asset path" }, 400);
  }
  const key = `assets/${match[1]}/${match[2]}/${match[3]}`;
  const object = await env.NODE_BUNDLES.get(key);
  if (!object) {
    return json({ error: "asset not found" }, 404);
  }
  const headers = new Headers();
  object.writeHttpMetadata?.(headers);
  headers.set("cache-control", "private, max-age=3600");
  if (object.httpEtag || object.etag) {
    headers.set("etag", object.httpEtag || object.etag);
  }
  return new Response(object.body, { headers });
}

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function tokenizeQuery(query) {
  const source = String(query || "").trim();
  const terms = [];
  const fields = [];

  source.split(/\s+/).forEach((part) => {
    if (!part) {
      return;
    }
    const idx = part.indexOf(":");
    if (idx > 0) {
      const field = normalizeText(part.slice(0, idx)).replace(/[^a-z0-9_-]+/g, "");
      const value = normalizeText(part.slice(idx + 1)).replace(/[^a-z0-9_\/-]+/g, "");
      if (field && value) {
        fields.push({ field, value });
        return;
      }
    }
    const term = normalizeText(part).replace(/[^a-z0-9_\/-]+/g, "");
    if (term) {
      terms.push(term);
    }
  });

  return { terms, fields };
}

function nodeText(node) {
  const parts = [
    node?.id,
    node?.title,
    node?.path,
    node?.excerpt,
    Array.isArray(node?.tags) ? node.tags.join(" ") : "",
    Array.isArray(node?.links) ? node.links.join(" ") : "",
    Array.isArray(node?.backlinks) ? node.backlinks.join(" ") : "",
    Array.isArray(node?.tokens) ? node.tokens.join(" ") : ""
  ];
  return normalizeText(parts.join(" "));
}

function nodeMatchesField(node, field, value, text) {
  const tags = Array.isArray(node?.tags) ? node.tags.map((item) => normalizeText(item)) : [];
  const tokens = Array.isArray(node?.tokens) ? node.tokens.map((item) => normalizeText(item)) : [];
  const links = Array.isArray(node?.links) ? node.links.map((item) => normalizeText(item)) : [];
  const backlinks = Array.isArray(node?.backlinks) ? node.backlinks.map((item) => normalizeText(item)) : [];
  const path = normalizeText(node?.path);
  const title = normalizeText(node?.title);

  if (field === "tag" || field === "tags") {
    return tags.some((item) => item.includes(value) || item.replace(/^#/, "") === value);
  }
  if (field === "path") {
    return path.includes(value);
  }
  if (field === "title") {
    return title.includes(value);
  }
  if (field === "token" || field === "tokens") {
    return tokens.some((item) => item === value || item.includes(value));
  }
  if (field === "link" || field === "links") {
    return links.some((item) => item.includes(value));
  }
  if (field === "backlink" || field === "backlinks") {
    return backlinks.some((item) => item.includes(value));
  }

  return text.includes(value);
}

function scoreNode(node, parsed) {
  const text = nodeText(node);
  const title = normalizeText(node?.title);
  const path = normalizeText(node?.path);

  for (const condition of parsed.fields) {
    if (!nodeMatchesField(node, condition.field, condition.value, text)) {
      return -1;
    }
  }

  for (const term of parsed.terms) {
    if (!text.includes(term)) {
      return -1;
    }
  }

  let score = 0;
  parsed.fields.forEach((condition) => {
    score += 6;
    if (title.includes(condition.value)) score += 2;
    if (path.includes(condition.value)) score += 1;
  });

  parsed.terms.forEach((term) => {
    score += 4;
    if (title.includes(term)) score += 3;
    if (path.includes(term)) score += 2;
  });

  return score;
}

async function loadJsonAsset(env, request, assetPath) {
  const url = new URL(request.url);
  url.pathname = assetPath;
  url.search = "";

  const response = await env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));
  if (!response.ok) {
    throw new Error(`asset ${assetPath} unavailable (${response.status})`);
  }

  return response.json();
}

async function loadSearchIndex(env, request) {
  if (cachedSearchIndex) {
    return cachedSearchIndex;
  }
  cachedSearchIndex = await loadJsonAsset(env, request, "/vault-search-index.json");
  return cachedSearchIndex;
}

async function loadPngIndex(env, request) {
  if (cachedPngIndex) {
    return cachedPngIndex;
  }
  const payload = await loadJsonAsset(env, request, "/data/all-png-images.json");
  cachedPngIndex = Array.isArray(payload) ? payload.map((item) => String(item || "").replace(/\\/g, "/")) : [];
  return cachedPngIndex;
}

function searchNodes(nodes, query, limit = 120) {
  const parsed = tokenizeQuery(query);
  return nodes
    .map((node) => {
      const score = scoreNode(node, parsed);
      if (score < 0) {
        return null;
      }
      return { ...node, score };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return normalizeText(a.title).localeCompare(normalizeText(b.title));
    })
    .slice(0, Math.max(1, Number(limit || 120)));
}

function extractPngMentions(node) {
  const text = [node?.excerpt || "", node?.title || "", node?.path || ""].join("\n");
  const found = [];
  const matcher = /([a-z0-9 _\-]+\.png)/gi;
  let match = matcher.exec(text);
  while (match) {
    const value = normalizeText(match[1]).trim();
    if (value) {
      found.push(value);
    }
    match = matcher.exec(text);
  }
  return Array.from(new Set(found));
}

function resolveAssetsForNode(node, pngList, maxItems = 8) {
  const mentions = extractPngMentions(node);
  if (!mentions.length) {
    return [];
  }

  const assets = [];
  const seen = new Set();

  for (const mention of mentions) {
    if (assets.length >= maxItems) {
      break;
    }
    const match = pngList.find((assetPath) => {
      const base = assetPath.split("/").pop() || "";
      return normalizeText(base) === mention;
    });
    if (!match || seen.has(match)) {
      continue;
    }
    seen.add(match);
    assets.push(match);
  }

  return assets;
}

function isEthosNode(node) {
  const text = nodeText(node);
  const signals = ["ethos", "ethyl", "archetype", "resonance", "alignment", "invitation", "ghost", "pulse", "identity"];
  return signals.some((signal) => text.includes(signal));
}

function groupKeywords(groupKey) {
  if (groupKey === "identity") return ["identity", "signature", "self", "echo"];
  if (groupKey === "alignment") return ["alignment", "coherence", "harmony", "resonance"];
  if (groupKey === "behavior") return ["behavior", "conduct", "motion", "protocol"];
  if (groupKey === "invitation") return ["invitation", "threshold", "welcome", "pathway"];
  return ["ghost", "theghost", "haunt", "shadow", "mirror"];
}

function scoreNodeForGroup(node, groupKey) {
  const text = nodeText(node);
  let score = 0;
  groupKeywords(groupKey).forEach((keyword) => {
    if (text.includes(keyword)) {
      score += 2;
    }
  });
  if (text.includes("ethos") || text.includes("ethyl")) {
    score += 1;
  }
  return score;
}

function dedupeNodes(nodes) {
  const out = [];
  const seen = new Set();
  (nodes || []).forEach((node) => {
    const key = normalizeText(node?.path || node?.id || "");
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    out.push(node);
  });
  return out;
}

async function buildEthosChamberPayload(env, request, limit = 220) {
  const searchPayload = await loadSearchIndex(env, request);
  const nodes = Array.isArray(searchPayload?.nodes) ? searchPayload.nodes : [];
  const pngList = await loadPngIndex(env, request);

  const baseQueries = ["ethos", "path:ethyl", "path:ethos", "archetype", "resonance", "alignment", "invitation", "ghost"];
  const corpusRaw = [];
  baseQueries.forEach((query) => {
    searchNodes(nodes, query, limit).forEach((node) => corpusRaw.push(node));
  });

  const corpus = dedupeNodes(corpusRaw).filter((node) => isEthosNode(node));

  const groups = {};
  GROUPS.forEach((group) => {
    const picked = [];
    group.queries.forEach((query) => {
      searchNodes(nodes, query, limit).forEach((node) => picked.push(node));
    });

    const groupNodes = dedupeNodes(picked.concat(corpus))
      .filter((node) => scoreNodeForGroup(node, group.key) > 0)
      .map((node) => {
        const assets = resolveAssetsForNode(node, pngList, 8);
        return {
          id: node.id || "",
          title: node.title || "Untitled",
          path: node.path || "",
          excerpt: node.excerpt || "",
          tags: Array.isArray(node.tags) ? node.tags : [],
          links: Array.isArray(node.links) ? node.links : [],
          backlinks: Array.isArray(node.backlinks) ? node.backlinks : [],
          tokens: Array.isArray(node.tokens) ? node.tokens : [],
          score: scoreNodeForGroup(node, group.key),
          assets
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return normalizeText(a.title).localeCompare(normalizeText(b.title));
      });

    groups[group.key] = {
      key: group.key,
      label: group.label,
      count: groupNodes.length,
      items: groupNodes
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalEthosAlignedNodes: corpus.length,
    groups
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/progression" && request.method === "GET") {
      const progression = await verifyProgression(request, env.SEED_SECRET);
      return json({ seedPlanted: progression.seedPlanted === true });
    }

    if (url.pathname === "/api/seeds/plant" && request.method === "POST") {
      if (!env.SEED_SECRET) {
        return json({ error: "seed signing is not configured" }, 503);
      }
      const body = await request.json();
      const spoke = String(body?.spoke || "").replace(/[^a-z0-9-]/g, "");
      if (!spoke) {
        return json({ error: "spoke is required" }, 400);
      }
      const progression = { seedPlanted: true, plantedAt: Date.now(), spoke };
      return progressionResponse(progression, await signProgression(progression, env.SEED_SECRET));
    }

    if (url.pathname === "/api/nodes/activate" && request.method === "POST") {
      return activateNode(request, env);
    }

    if (url.pathname.startsWith("/api/nodes/assets/") && request.method === "GET") {
      return activateNodeAsset(url, env);
    }

    if (url.pathname === "/api/ethos/chamber") {
      try {
        const limit = Number(url.searchParams.get("limit") || 220);
        const payload = await buildEthosChamberPayload(env, request, limit);
        return json(payload, 200);
      } catch (error) {
        return json({ error: error?.message || "ethos chamber query failed" }, 500);
      }
    }

    if (url.pathname === "/api/ethos/search") {
      try {
        const query = url.searchParams.get("q") || "ethos";
        const limit = Number(url.searchParams.get("limit") || 120);
        const searchPayload = await loadSearchIndex(env, request);
        const nodes = Array.isArray(searchPayload?.nodes) ? searchPayload.nodes : [];
        const results = searchNodes(nodes, query, limit);
        return json({ query, count: results.length, results }, 200);
      } catch (error) {
        return json({ error: error?.message || "ethos search failed" }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
