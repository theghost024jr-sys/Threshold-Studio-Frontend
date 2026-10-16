# Threshold Architecture Document — 2026 Edition

## 1. Purpose

Threshold is a reactive world-engine built on strict authority flow:

```text
Frontend Intent
    → Backend Authorization
        → Engine State Transition
            → Authoritative Snapshot
                → UI Rendering
```

This document defines the architecture that enforces that flow, the ontology that the engine operates on, and the contract that binds the frontend, backend, and UI into a single coherent system.

## 2. Ontology

### 2.1 Node

A node is any pressure-reactive entity in the world.

**Properties**

- Has canonical identity
- Has runtime state
- Can be selected
- Can be activated
- Cannot invent its own ontology

**Canonical Source**

Canonical node identity is defined exclusively in:

```text
threshold-vault.json
```

The backend loads this registry and rejects any ID not present.

### 2.2 Self

A self is the minimal system capable of treating its own state as information.

**Invariants**

- Represents its own state
- Updates itself based on that representation
- Distinguishes internal vs external change
- Maintains continuity across updates

A self is not required to be biological, conscious, or narrative-driven. It is defined purely by state-awareness and state-update.

### 2.3 Elf

An elf is a self whose identity is co-authored by environmental pressure.

**Properties**

- Is a node
- Is a self
- Adapts based on biome drift
- Maintains identity through environmental resonance

Elves are not fantasy creatures; they are environment-shaped intelligences.

## 3. Engine Architecture

### 3.1 Engine Authority

The engine is the sole authority for:

- node activation
- node runtime state
- world tick progression
- authoritative snapshots

The engine never accepts:

- UI-invented fields
- legacy activation fields (`click`, `active`)
- unknown node IDs
- arbitrary payloads

Only validated commands are accepted.

### 3.2 Engine Commands

The backend command union currently includes:

**Selection**

```json
{ "type": "node.select", "id": "<canonical-id>" }
```

**Activation**

```json
{ "type": "node.activate", "id": "<canonical-id>" }
```

**Tick Retrieval**

```json
{ "type": "engine.tick" }
```

**Pending Decision**

Whether selection is:

- a backend-recognized command
- or purely frontend presentation state

This must be resolved before backend schema hardening.

### 3.3 Engine State

The engine produces authoritative snapshots:

- canonical node set
- runtime node set
- activation state
- tick sequence
- timestamp
- world pressure

Snapshots are immutable and UI-safe.

## 4. Backend Architecture

### 4.1 Canonical Registry

The backend loads canonical node identity from:

```text
threshold-vault.json
```

This registry contains 135 canonical nodes, each with:

- id
- kind
- chamber
- metadata

Unknown IDs are rejected deterministically.

### 4.2 Runtime Materialization

Runtime state is created on demand:

- materialization does not alter ontology
- runtime nodes cannot invent canonical identity
- activation requires canonical ID

### 4.3 Backend Contract

The backend enforces:

- strict schema validation
- rejection of unsupported fields
- rejection of unknown IDs
- rejection of legacy activation fields
- acceptance only of validated commands

**Pending work:** reject arbitrary payloads for canonical nodes.

## 5. Frontend Architecture

### 5.1 Intent Contract

The frontend exposes only validated actions:

- selection
- activation
- tick retrieval

The raw intent sender is private.

Unsupported fields are rejected before reaching the backend.

### 5.2 Node Console

The Node Console:

- emits only validated activation intent
- never sends `click` or `active`
- never marks a node active optimistically
- displays `Active (engine)` only after authoritative confirmation

## 6. UI Feedback Architecture

The UI consumes engine feedback events:

- `threshold:engine-state`
- `threshold:engine-intent-accepted`
- `threshold:engine-rejection`

These update:

- accessible live region
- ephemeral feedback state
- non-authoritative UI hints

The UI never invents engine state.

## 7. Vault Architecture

### 7.1 Canonical Chambers

Vault simulations confirm:

- 5 canonical chambers
- pressure: `0.8125`
- states: collapsing, drifting, migrating
- Ethos and Migration migrate
- Anchor does not

### 7.2 Migration Threshold

Declared:

```yaml
threshold: 0.34
```

### 7.3 Phase 3b Work

- link rewrite validated
- rename script hardened
- revert script deprecated
- 24 qualified links updated

## 8. CI Architecture

Current CI:

- runs Node tests only
- does not run Python engine tests
- `.pytest_cache/` exists but is unused
- backend tests run only locally

**Required Fix**

Add Python test execution to CI:

```text
pip install -r requirements.txt
pytest
```

## 9. Pending Work

### 9.1 Backend Command Union

Define and enforce the complete backend command union:

- selection (if confirmed)
- activation
- tick retrieval

Reject everything else.

### 9.2 Production Endpoint

Replace:

```text
http://127.0.0.1:8000
```

with environment-configured endpoint or same-origin proxy.

### 9.3 Shared Copilot Page Conversion

Blocked until you provide:

- pasted conversation text
- uploaded export
- anonymously readable share link

## 10. Summary

Threshold now obeys strict authority flow:

```text
Frontend → Backend → Engine → UI
```

Canonical identity is enforced. Activation is explicit. Legacy fields are rejected. UI never invents state. Vault ontology is stable. Backend and frontend contracts are aligned. Engine feedback is accessible. Tests pass end-to-end.

The next architectural milestone is backend command union enforcement.

## 11. Verified Implementation Plan

This plan converts the architecture from mixed design/status material into actionable, testable, source-verified engineering work.

### 11.1 Claim Verification Table

Before any architecture becomes law, each claim must be reconciled with the actual codebase.

| Claim | Status | Source of Truth | Verification Test |
|---|---|---|---|
| Backend authorizes canonical IDs | implemented / pending | registry loader + `Graph` | unknown-ID rejection |
| `node.activate` schema | implemented / pending | API route + validator | activation acceptance/rejection |
| `node.select` backend semantics | resolved: frontend-only | frontend contract | no engine request from selection |
| Arbitrary payloads rejected | pending | backend command parser | unsupported-schema rejection |
| Python engine tests run in CI | pending | `.github/workflows/test.yml` | CI job result |

This table is the truth gate for every architectural statement in this document.

### 11.2 Selection Ownership

Selection is frontend-only presentation state.

- The UI highlights or focuses a node locally.
- Selection makes no backend request.
- Selection makes no engine state change.
- Selection adds no snapshot field.
- Selection emits no engine event.
- Selection has no backend command.

This avoids inventing backend semantics for a presentation-only interaction. Selection cannot be recorded, replayed, or synchronized across clients.

### 11.3 Backend Command Schema

The backend command union must accept only explicitly defined commands. With frontend-only selection, activation is the only node command currently admitted.

**Required acceptance tests**

- canonical ID + valid activation → accepted
- unknown ID + valid activation → rejected
- canonical ID + legacy fields (`click`, `active`) → rejected
- canonical ID + unsupported payload/action → rejected
- rejected command → no runtime mutation
- rejected command → no pending engine input

**Canonical transport shape**

Choose and enforce one activation transport shape:

```text
POST /<activation-route>/<canonical-id>
{ "type": "node.activate" }
```

Document the actual route name, then eliminate any competing activation shape.

### 11.4 Python Engine Tests in CI

The CI workflow must:

1. Install Python.
2. Install backend dependencies.
3. Run `pytest`.
4. Fail the build on backend test failures.

This protects backend authority the same way the JavaScript suite protects the frontend contract.

### 11.5 Production Engine Endpoint

The development endpoint:

```text
http://127.0.0.1:8000
```

is valid for local validation but must not ship.

Choose one production strategy:

1. **Same-origin proxy:** the frontend calls `/engine`, and the server proxies to the backend.
2. **Environment-injected engine URL:** the frontend reads `ENGINE_URL` at build time.
3. **Deployment variable:** the frontend reads the engine endpoint from deployment configuration.

No developer-machine endpoint belongs in deployed HTML.

### 11.6 One Executable World Capability

After the authority boundary is sealed, add one measurable world-state capability rather than a broad subsystem.

**Recommended candidate:** pressure / stability calculation, because pressure already appears in authoritative snapshots.

Define end-to-end:

1. Input schema.
2. Backend authoritative transition.
3. Engine event.
4. Snapshot fields.
5. UI consequence.
6. Rejection behavior.
7. Tests.

Do not add broad systems such as resonance, macro-cycle, or Prime Directive until each has measurable state and behavior.

### 11.7 Recommended Execution Order

1. Verify and reconcile document claims.
2. Enforce the backend command union.
3. Add backend tests to CI.
4. Configure the production engine endpoint.
5. Implement one measurable world capability.

This produces a stable authority boundary before expanding the world model.
