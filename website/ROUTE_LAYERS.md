# Route Layers

`config/route-layers.json` is the backend's single description of the public
route surface. It replaces the flat reading of `PUBLIC_ROUTE_AUDIT.md` with
seven ordered layers, one entry per addressable route, and every echo the
topology already declares.

The Worker serves it at `GET /api/routes` and consults it for nothing else. It
is a ledger, not a router: no page is gated, redirected or hidden because of a
layer. Behaviour still lives in `_worker.js`; the ledger records what that
behaviour adds up to.

## Query

```text
GET /api/routes                 -> revision, counts per layer and status, edge rules
GET /api/routes?url=/portal/beach -> the single entry, or found: false
```

The response is `no-store` and carries the usual `x-threshold-version` and
`x-request-id` headers.

## Layers

| Order | Layer | Count | Meaning |
|---|---|---|---|
| 0 | `edge` | 1 | Intercepted before assets: the `/portal/index.html` redirect alias. |
| 1 | `spine` | 5 | `canonicalEntryPath` - entry hub, house and garden, herb room, basin, old forest, in that order. |
| 2 | `configured` | 32 | Declared by world topology, spokes or living-pages configuration. |
| 3 | `portal` | 36 | Portal SPA routes sharing one document shell. |
| 4 | `world` | 8 | `/world*`, served the Portal shell from outside `website/portal`. |
| 5 | `legacy` | 12 | Retired constructs kept addressable. |
| 6 | `artifact` | 20 | Generated, template or inventory output inside the deploy root. |

Status is orthogonal to layer: 59 canonical, 40 experimental, 14 legacy, and
one redirect. A route can sit in `configured` and still be `legacy` - placement
says where it is served from, status says what the audit found there.

`edge` also records the sealed prefixes (`/portal-dist/`, `/generated-pages/`,
`/page-templates/`, `/echoes/inventory/`) and the retired `/hub-return.html`,
which is absent rather than redirected.

## Invariants

`tests/route-layers.test.mjs` holds the ledger to the rest of the backend:

- layer ids are unique and ordered; every route has exactly one entry;
- every place in `world-topology.json` is present, with its `returnsTo`
  resolved to a route as its echo;
- the `spine` layer matches `canonicalEntryPath` in declared order;
- every stage in `access-flow.json` is canonical;
- the Worker really performs the redirect, seals the prefixes and exposes
  `/api/routes`;
- artifacts sit under a sealed prefix;
- 34 routes remain unreturned - the one structural finding left, and no spine
  route is among them.

## Provenance

The file was generated once from the audit's tables plus the topology, then
committed as the source of truth:

- `PUBLIC_ROUTE_AUDIT.md` (rev 2026-11-03) for status, echoes and orphan marks;
- `config/world-topology.json` for nodes, routes, returns and passages;
- `config/access-flow.json` for the registered stages.

Entries carry `"audited": false` where the topology has moved on since the
audit - the cave corridor, plasma-bloom meadow, `spiral-reflection.html`, the
legacy construct set, and the portal world routes. Those are real routes the
audit did not see, not errors in the ledger.
