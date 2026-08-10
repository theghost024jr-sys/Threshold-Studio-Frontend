export async function readObject(bucket, key, cacheControl) {
  if (!bucket) return Response.json({ error: "Vault storage unavailable" }, { status: 503 });
  const object = await bucket.get(key);
  if (!object) return Response.json({ error: "Object not found" }, { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata?.(headers);
  headers.set("cache-control", cacheControl);
  if (object.httpEtag || object.etag) headers.set("etag", object.httpEtag || object.etag);
  return new Response(object.body, { headers });
}

export async function readNodeObject(bucket, key, cacheControl) {
  const response = await readObject(bucket, key, cacheControl);
  if (!response.ok) return response;

  const node = await response.json();
  const normalized = {
    ...node,
    children: Array.isArray(node.children)
      ? node.children
      : Array.isArray(node.choices) ? node.choices : []
  };
  delete normalized.choices;
  return Response.json(normalized, { headers: response.headers });
}