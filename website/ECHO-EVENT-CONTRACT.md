# Echo Event Contract

This document defines the multiplayer boundary for Echo without changing the
rule that only nodes which receive Echo adapt. It is a target contract, not a
claim that network transport or authoritative multiplayer is implemented.

## Current local behavior

The local Engine accepts a signal for an explicit node through
`processEchoSignal(nodeId, signal)`. Each branch owns an `EchoNode`; system
resolution aggregates nodes that have received signals. There is no player or
session attribution, network transport, shared authoritative state, or
node-to-node propagation in this path.

## Event flow

```text
Authenticated player action
  -> server validates session membership and action
  -> server resolves the action into Echo
  -> server determines actual recipient nodes
  -> ordered authoritative event is committed
  -> only recipient nodes adapt
  -> revised snapshots are sent to session members
```

The initial game has one player in a session. The event contract permits more
than one player identity later; it does not require changing the Echo law.

## Client intent

A client submits an intent, not an authoritative Echo payload:

```json
{
  "type": "echo.emit",
  "requestId": "client-generated-id",
  "sessionId": "session-id",
  "originNodeId": "node-id",
  "action": {
    "type": "registered-action",
    "payload": {}
  }
}
```

The authenticated connection supplies the player identity. The server must
not trust a client-provided `playerId`, target list, boundary, pressure,
resonance, frequency, direction, sequence, or timestamp. The action payload
must be validated against a registered action schema; arbitrary payloads are
rejected.

## Authoritative Echo event

After validation and resolution, the authority records an immutable event:

```json
{
  "schemaVersion": 1,
  "eventId": "server-generated-id",
  "requestId": "client-generated-id",
  "sessionId": "session-id",
  "playerId": "authenticated-player-id",
  "sequence": 42,
  "tick": 18,
  "originNodeId": "node-id",
  "recipients": ["node-id"],
  "echo": {
    "pattern": ["validated", "features"],
    "charge": 1,
    "frequency": 1,
    "direction": 0,
    "boundary": ["node-id"]
  }
}
```

The authority derives `recipients` and Echo values from validated game state
and registered rules. For the first implementation, delivery is direct to the
selected node; propagation through other nodes, petals, or pressure fields is
not implied. A recipient changes only after the event is accepted and
committed. Non-recipients retain their prior state.

## Ordering and idempotency

- The server assigns a monotonically increasing `sequence` within the
  authoritative session or world stream. Client timestamps do not determine
  processing order.
- Events are applied in sequence order. A rejected event does not mutate node
  state or consume a sequence number.
- Repeating a `requestId` from the same authenticated player returns the
  original result rather than applying the Echo twice.
- Each committed event increments the affected state revision. Snapshots carry
  the revision and latest sequence so clients can detect gaps and request a
  refresh.

## Reset authorization

The current local `resetEchoSystem()` resets all branch Echo nodes in its
Engine instance. A shared authority must require an explicit reset scope and
authorize it before mutation:

- `node`: one node, for an authorized local reset.
- `session`: all Echo state owned by one session.
- `world`: shared state, restricted to an authorized world event or operator.

Player-, petal-, or cluster-scoped resets require ownership and canonical
membership rules before they can be exposed. A reset is itself an ordered
authoritative event; it must not silently erase another session's state.

## Rejections

Reject an intent before state mutation when the player is unauthenticated, is
not a member of the session, submits an unregistered action, references an
unavailable origin or target, or violates the current world rules. Return a
stable error code and the latest authoritative revision so the client can
recover without guessing.

## Decisions required before a shared server

- Whether sessions own isolated world copies or join shared world state.
- Whether Echo attribution remains visible in snapshots and for how long.
- The registered player-action schemas and their action-to-Echo mapping.
- Canonical recipient and propagation rules.
- Canonical petal identities and the laws that alter Echo.
- Whether one player's reset affects only their contribution or all session
  state.

Until these decisions are implemented, the local single-player API remains a
deterministic simulation and must not be represented as multiplayer
authority.
