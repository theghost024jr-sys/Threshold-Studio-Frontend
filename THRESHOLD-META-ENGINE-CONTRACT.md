# Threshold Meta-Engine Contract

**Status:** Draft 0.1  
**Scope:** Python engine primitives and future system-generation interfaces  
**Authority:** This contract defines engine architecture. It does not replace
[REPOSITORY_CONTRACT.md](REPOSITORY_CONTRACT.md), vault authority, build
boundaries, or source ownership.

## Purpose

Threshold is a deterministic engine whose current primitives can model local
world behavior. The meta-engine is the future capability to compose validated
primitives into new bounded systems without silently inventing physics,
authority, metadata, or narrative outcomes.

The contract distinguishes:

1. **implemented behavior** that callers may rely on now;
2. **design invariants** that future engine work must preserve; and
3. **target capabilities** that are not yet implemented.

No target capability may be described as live runtime behavior before it has a
schema, implementation, validation, and tests.

## Definitions

### Primitive

A deterministic, typed operation with explicit inputs, validation, and outputs.
Examples include pressure calculation, metabolic recovery, migration selection,
Warden activation, Boundary Elevation, refusal, unresolved fields, uncertainty,
and coherence recovery.

### System

A bounded composition of primitives with declared state, transition rules,
configuration, inputs, outputs, and validation rules.

### Meta-engine

The future layer that validates and assembles systems from registered
primitives. It does not generate arbitrary code, infer missing laws, or turn
creative statements into authoritative runtime values.

### Boundary state

A local condition in which a system has active forces but has not reached a
final resolution. Boundary states may be stable, unstable, unresolved,
deferred, refused, or recovering. They are not proof that a system is true,
correct, meaningful, or entitled to escalate.

### Resolution

A defined state transition, such as a contract result, topology rewrite,
collapse, era contribution, or Boundary Elevation. Resolution must be explicit;
the presence of force alone does not authorize it.

## Current Implemented Surface

The Python engine currently provides standalone, deterministic primitives for:

- node metabolism, pressure, slit dynamics, orbit movement, and resonance;
- migration, cluster capture, halo rotation, spirit effects, storms, basins,
  cascades, immunity, Flower interaction, Garden dynamics, and era mechanics;
- player force, contracts, capabilities, collective interference, and narrative
  classification;
- Warden identity fields, stance responses, local Warden activation, and
  zone-bound Boundary Elevation;
- `AgatagaSense` as a bounded player perception input distinct from the
  separate Agataga reliability product;
- active player refusal;
- unresolved fields, uncertainty stabilization, coherence recovery, soft
  Warden presentation, soft elevation, and Hesitation Zone resolution.

These modules are composable primitives. They are not evidence that the
repository currently runs one complete integrated world simulation, produces
new engines, hosts an authoritative multiplayer system, or publishes a
meta-engine API.

## Meta-Engine Input Contract

A future generated system must declare, at minimum:

```text
system_id
schema_version
registered_primitives
state_schema
input_schema
output_schema
transition_order
configuration_schema
validation_rules
failure_behavior
```

The system definition must identify every primitive by a registered, versioned
identifier. It must declare transition order rather than relying on import
order, object iteration, random values, or undocumented side effects.

Unrecognized primitives, unknown schema versions, cyclic transition
dependencies, invalid configurations, and incomplete required fields must
produce explicit validation failures before state mutation.

## Composition Invariants

Every generated system must preserve the following rules.

### Explicit authority

- Inputs are classified as authoritative state, validated intent, derived
  values, or presentation-only values.
- A caller cannot supply authoritative values where an engine resolver owns
  them.
- A generated system cannot treat vault titles, paths, or arbitrary prose as
  validated runtime metadata.

### Deterministic transitions

- Equal prior state, inputs, configuration, and transition order produce equal
  next state.
- Threshold comparisons, clamping, and tie-breaking rules are explicit.
- A rejected input does not partially mutate state.

### Locality

- A transition affects only its declared scope.
- Propagation across nodes, Flowers, zones, players, or sessions requires an
  explicit propagation rule.
- The existence of a signal in one scope does not imply that another scope
  adapts.

### No premature resolution

- Force does not require a narrative, identity, contract, elevation, topology,
  or era outcome.
- Unresolved, uncertainty, refusal, soft, and hesitation states are valid
  outcomes.
- A generated system must represent deferral explicitly rather than disguising
  it as a successful resolution or silently dropping state.

### Bounded uncertainty

- Uncertainty and coherence recovery are normalized drivers, not truth claims.
- Coherence recovery may stabilize behavior without declaring source signals
  resolved.
- A system must not convert uncertainty directly into collapse, rebirth, or an
  invented explanation unless that conversion is an explicit validated rule.

### Player agency

- A player may refuse a valid offered interaction.
- Refusal is active non-participation, not invalid input, absence, or failed
  alignment.
- Refusal cannot create Warden authority, a title, or a successor state.

### Metadata integrity

- Runtime mythology metadata must be resolved from an approved source or
  provided as validated input.
- The engine must not fabricate partial species, overlays, layers, or source
  claims to fill missing metadata.
- Soft Warden presentation may express partial activation while retaining the
  distinction between valid metadata and unknown metadata.

## Required Result Categories

Generated systems must be able to return results that are neither success nor
failure:

```text
resolved
deferred
refused
unresolved
soft
inactive
rejected
```

Each category must have explicit state and presentation semantics. In
particular, `deferred`, `unresolved`, and `refused` must not be represented as
null values, exceptions used for control flow, or successful results with
omitted effects.

## Current Boundary Laws

The following laws are current engine behavior and must be preserved when their
primitives are composed:

- Fully discharged metabolism has zero pressure.
- Normalized values are validated and clamped where their primitive requires
  it.
- Warden activation requires strict density and shimmer threshold crossings.
- Boundary Elevation is local and requires strict alignment, Agataga Sense,
  shimmer, and coherence-recovery gates.
- Player refusal hard-blocks Boundary Elevation.
- Unresolved force may be held without forced collapse or resolution.
- Coherence recovery stabilizes incomplete signals without erasing them.
- Soft elevation does not form a full contract, rewrite topology, lock
  identity, or contribute era drift.
- Hesitation Zones pause escalation rather than convert ambiguity into an
  error or collapse.

## Validation Contract

Every future system definition must be validated in this order:

```text
schema validation
-> primitive registry validation
-> configuration validation
-> transition dependency validation
-> authority validation
-> state/input validation
-> deterministic execution
-> output validation
```

Validation errors must identify the failed system field, primitive, or
transition. The meta-engine must not substitute defaults that create a
success-shaped result.

## Target Capabilities

The following are architectural targets, not current behavior:

- a versioned primitive registry;
- a declarative system-definition schema;
- a system composer and dependency resolver;
- generated-system snapshot/event schemas;
- a formal Echo propagation clock for generated systems;
- provenance records that identify the primitive/configuration versions used
  for each transition;
- tooling that detects contradictions between declared system constraints and
  generated configurations.

Each target requires its own design, implementation, tests, and documentation
before it may be considered part of the runtime.

## Non-Goals

This contract does not:

- claim that Threshold owns, replaces, or supersedes its concrete repository
  source ownership;
- define an intellectual-property, governance, or authorship policy;
- treat voice integrity as an executable property until a separate,
  testable definition exists;
- create arbitrary worlds, stories, or systems from prose;
- authorize browser clients to supply authoritative world state;
- imply network authority, multiplayer propagation, or an implemented Echo
  event transport.

## Relationship to Existing Contracts

- [REPOSITORY_CONTRACT.md](REPOSITORY_CONTRACT.md) governs canonical paths,
  source ownership, publication boundaries, and frontend/engine authority.
- [website/ECHO-EVENT-CONTRACT.md](website/ECHO-EVENT-CONTRACT.md) defines a
  target multiplayer boundary for Echo and explicitly distinguishes it from
  current local behavior.
- This contract governs the future composition of engine primitives into
  validated systems. It does not override either document.
