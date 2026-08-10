export function route(request) {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/api/progression") return { type: "progression", url };
  if (request.method === "POST" && url.pathname === "/api/seeds/plant") return { type: "plant", url };
  if (request.method === "POST" && url.pathname === "/api/nodes/activate") return { type: "activate", url };
  const asset = url.pathname.match(/^\/api\/nodes\/assets\/([a-z0-9-]+)\/([A-Za-z0-9_-]+)\/([^/]+)$/);
  if (request.method === "GET" && asset) return { type: "asset", url, branch: asset[1], token: asset[2], name: asset[3] };
  return { type: "asset-fallback", url };
}