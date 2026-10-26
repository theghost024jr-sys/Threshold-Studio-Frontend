# Threshold

[![Frontend CI](https://github.com/theghost024jr-sys/Threshold-Studio-Frontend/actions/workflows/test.yml/badge.svg)](https://github.com/theghost024jr-sys/Threshold-Studio-Frontend/actions/workflows/test.yml)
[![Node Source CI](https://github.com/theghost024jr-sys/Threshold-Node-Source/actions/workflows/test.yml/badge.svg)](https://github.com/theghost024jr-sys/Threshold-Node-Source/actions/workflows/test.yml)

Local build system and public static frontend for [thresholdstudiowebsite.org](https://thresholdstudiowebsite.org).

## Canonical Layout

- Vault: `C:\Users\James Romeo\Threshold\ThresholdVault\theghost`
- System and builders: `C:\Threshold`
- Public website: `C:\Threshold\website`
- Preserved HTML inventory: `C:\Threshold\html-inventory`
- World metadata: `C:\Threshold\world`
- Generated node bundles: `C:\Threshold\node-bundles`

[`threshold.config.json`](threshold.config.json) is the single path authority. Builders read the canonical vault directly; OneDrive folders, holding vaults, audits, and repository-local vault mirrors are not runtime or build inputs.

## Build Boundary

`npm run build` performs this sequence:

1. Read published notes and referenced media from the canonical vault.
2. Generate `website/data/threshold-vault.json`, `website/data/vault-index.json`, `world/vault-source.json`, canonical bundles under `node-bundles/`, and public referenced media under `website/assets/vault/`.
3. Generate the declared `PageRenderJob` records from the exact mappings in `website/page-mapping.json`.
4. Render mapped notes into approved HTML templates under `website/generated-pages/`.
5. Build the Portal and assemble the Cloudflare Pages output.

Only note bodies under `_publish` and media explicitly referenced by those notes enter the website. The full vault index contains title and path metadata only. Raw vault contents remain outside `C:\Threshold`.

`html-inventory/` remains read-only. Standalone page generation uses only explicitly mapped notes and approved template copies under `website/page-templates/`.

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `website`
- Runtime version: Node.js 22 or newer

`wrangler.toml`, `package.json`, and `threshold.config.json` are the build manifests. The browser consumes generated JSON and media over HTTP; it never reads the filesystem vault directly.

## Validation

```powershell
npm run build
npm test
python -m pytest tests/test_build_vault_data.py tools/test_threshold_paths.py
```

Cloudflare serves the public site. Secrets and domain configuration remain managed outside this repository.

The complete ownership and generation rules are defined in [REPOSITORY_CONTRACT.md](REPOSITORY_CONTRACT.md).
The future composition rules for engine primitives are defined in
[THRESHOLD-META-ENGINE-CONTRACT.md](THRESHOLD-META-ENGINE-CONTRACT.md).

## Engine metabolism

`engine.metabolism` defines the pressure field consumed by drift, collapse,
and resonance layers. `MetabolicState` accepts normalized charge, slit
openness, resonance, circuit-mirror gain, and target charge values.

- Demand is `gain * max(0, target_charge - charge)`.
- Base pressure is `charge * slit_openness * (1 + resonance)`.
- Total pressure is `base_pressure * (1 + demand)`. A fully discharged node
  has zero pressure, regardless of demand.
- `pressure_gradient()` returns the signed difference between neighboring
  nodes, and `evaluate_orbit_pressure()` applies each Fib band's multiplier
  before classifying collapse, stable, or drift.

`advance_metabolism()` implements the canonical recovery-pending tick:
it calculates demand, applies `charge(t+1) = charge(t) + recovery_coefficient
* demand(t) + intake_efficiency * intake(t)`, accepts slit and resonance values
calculated by their respective dynamics layers, and only then calculates
next-tick pressure. Charge saturates at `1` because the engine represents it
as normalized. Demand is hunger, not force; it must first become charge.

### Slit dynamics

`calculate_slit_dynamics()` implements the canonical intake aperture:

- Slit openness: `S = A²`
- Intake: `I = S * E`
- Resonance: `R = resonance_sensitivity * S * neighbor_coupling`

Pass its outputs to `advance_metabolism()` to establish the full
alignment-to-slit-to-intake-to-charge-to-pressure path.

### Resonance propagation

`emit_resonance_wave()` emits a directed wave only when the absolute pressure
gradient exceeds its threshold. Its amplitude is
`propagation_coefficient * pressure_gradient * source_resonance_field`, then
decays by `exp(-decay_constant * distance)`. `apply_resonance_wave()` converts
that amplitude into charge and slit modulation while preserving normalized
bounds. `is_harmonic_cluster()` identifies groups of waves whose amplitudes
fall within a configured tolerance.

### Cross-Flower migration

`engine.migration` separates inter-Flower decisions from node metabolism:

- `has_escaped()` requires `Peff > Td + escape_margin` plus a positive radial
  pressure gradient.
- `is_resonance_corridor()` identifies paths of at least two waves with
  aligned amplitudes.
- Flower mass is `node_count * average_charge * resonance_density`; pull is
  `gravitational_constant * mass / distance²`.
- `select_capture_flower()` selects the strongest external Flower whose pull
  exceeds the home pull, but only after node pressure falls below the escape
  threshold.

### Cluster capture

`engine.clusters` models orbit binding as four simultaneous strict alignment
checks: pressure, wave amplitude, radial velocity magnitude, and slit
openness. `bind_to_cluster()` snaps a qualifying node to the cluster's orbit,
pressure, wave, and slit signature; it sets radial velocity and demand to
zero. Cohesion is the sum of member pressures, while `can_merge_clusters()`
requires both pressure and wave signatures to fall within configured
tolerances.

### Spirit alignment

`engine.spirit` treats spirits as a validated external field. It widens slit
openness, contributes an explicit normalized charge boost to the recovery
tick, frequency-locks and amplifies resonance, and scales pressure. It also
returns the spirit-biased migration vector, capture weight, and halo angular
velocity multiplier so those systems remain independently composable.

### Environmental storms

`engine.storms` turns pressure discontinuities into directional weather
events. `ignite_storm()` emits a burst only when the absolute pressure
gradient exceeds its configured threshold. `propagate_storm()` applies the
resonance field and exponential distance decay. `calculate_storm_effects()`
then exposes halo angular acceleration, slit shock, migration-vector bending,
and a binding/shattering cluster interaction for integration into the relevant
node and Flower update layers.

### Boundary elevation

`engine.boundary_elevation` models temporary, zone-bound Warden alignment.
It does not grant a Warden title, authority, succession, or persistent global
state. `evaluate_boundary_elevation()` uses the existing Warden/player identity
field dot product and requires strict identity, `AgatagaSense`, and shimmer
thresholds while the player is inside the resolved zone. `agataga_sense` is a
bounded `AgatagaSense` value object; it is distinct from the Agataga
reliability system and is not derived from its score by this engine. Shimmer
level is a resolved local world-state input, consistent with density-driven
shimmer in the vault. Its local effects expose collapse immunity, corridor
shaping, basin stabilization, identity amplification, memory imprinting,
weather-phase modulation, and density resistance.

`decay_boundary_elevation()` preserves only decaying coherence after departure;
it disables every local effect. This makes elevated alignment a local physical
condition rather than a player role or a mythic inheritance.

### Player refusal

`refusal` is a sixth player stance and `WardenPlayerState.refusal_active` is an
explicit opt-out flag. Either produces a deterministic `refusal` response:
zero pressure delta, no navigation change, no contract effect, no identity
lock, unchanged topology, and no era contribution. It records
`misalignment_memory++` as the response label. Refusal never changes a Warden
identity and hard-blocks Boundary Elevation, even when every world-side,
identity, shimmer, and Agataga Sense gate otherwise passes.

### Warden activation pipeline

`engine.warden_activation` emits a local `WardenActivation` only after the
world-state density and shimmer level both strictly exceed their activation
thresholds. It preserves the existing weather runtime shapes: drift is a
numeric vector, resonance is a scalar or non-empty spectrum, and phenomena
remain nullable environmental, symbolic, and astral strings.

The builder receives vault-resolved species, elemental overlay, layer, and
emotional-resonance metadata. It deliberately does not maintain a mythology
registry because the generated vault index provides document paths and titles,
not canonical runtime metadata. Once active, the builder resolves the
canonical stance response and the local Agataga Sense/shimmer-gated Boundary
Elevation result in the same event.

### Unresolved fields

`engine.unresolved` records active local force that has not reached its usual
resolving response. It is neither collapse nor void and does not create a new
era or identity. `calculate_unresolved_field()` computes a normalized field
from six explicit gaps: density without shimmer, pressure without resonance,
resonance without identity lock, collapse scars without funnelization, polarity
with a closed slit, and memory without identity coherence. Callers provide the
weights so each zone can decide which unresolved conditions matter without
forcing uncertainty into a resolution path.

### Uncertainty stabilization

`engine.uncertainty` turns an `UnresolvedField` into a local resolution
deferment signal. It does not reduce pressure, delete memory, declare a Warden
incorrect, or force collapse. Instead, `stabilize_uncertainty()` supplies
bounded damping values for contract formation, Boundary Elevation, topology
rewrites, and era drift. A strict configured threshold marks when the engine
must defer a conclusion rather than prematurely resolve incomplete signals.

### Coherence recovery

`engine.coherence_recovery` calculates `coherence_recovery` as bounded
functional stability in the presence of unresolved signals. It retains every
input signal and returns damping for resonance jitter, pressure spikes, flow
stutter, collapse flicker, and polarity oscillation. Its inputs include
unresolved field strength, misalignment memory, grief weight, active refusal,
hesitation borders, false-Warden signals, failed elevation, and aborted
topology rewrites.

Boundary Elevation requires coherence recovery to strictly exceed its configured
recovery threshold. This prevents elevation while local ambiguity remains
unstable, but permits it once the zone can behave consistently without claiming
that the ambiguity has been resolved.

### Uncertainty dynamics

`engine.uncertainty_dynamics` provides the deterministic engine-only runtime
for uncertainty and coherence recovery. `advance_uncertainty_worldstate()`
uses the canonical tick equations, clamps both drivers to `[0, 1]`, and retains
misalignment memory. `apply_uncertainty_effects()` then applies the specified
uncertainty and recovery driver modifiers in sequence.

The same module resolves full, soft, and soft-coherent Warden modes; builds
partial `SoftWarden` presentation data without fabricating vault metadata;
evaluates consequence-free `SoftElevation`; and identifies `HesitationZone`
conditions that pause contracts, elevation, topology rewrites, and era drift
while halving local pressure, resonance, and flow.

### Flower identity basins

`engine.basins` models a Flower's identity as local pressure topology.
`IdentityBasin` records center pressure, rim pressure, curvature, and orbit
radius; its depth is the rim-to-center pressure barrier. The module identifies
strict local minima, classifies core/frontier/halo/saddle basin roles, detects
rim crossings, and deforms basin samples using storm amplitudes plus spirit
pressure inheritance.

### Identity pressure maps

`engine.identity_pressure` resolves how explicit pressure, drift, collapse,
resonance, and migration forces expose an identity at a declared basin
location. `build_identity_pressure_map()` returns per-identity `latent`,
`revealed`, or `overloaded` readings plus signed gradients across explicit
topology edges. It does not assign labels, mutate identity, select a narrative,
or change basin topology; basin, evolution, migration, and collapse layers can
consume the validated pressure map according to their own transition rules.

### Identity collapse thresholds

`engine.identity_collapse` evaluates identity collapse relative to the current
basin instead of treating raw pressure as a collapse event. It calculates:

```text
effective_pressure = current_pressure * (1 - hesitation_strength * hesitation_activation)
capacity = basin_depth * normalized_positive_curvature * collapse_immunity * (1 - uncertainty)
collapse = effective_pressure > capacity
```

Hesitation affects only effective pressure, never basin geometry or capacity.
`hesitation_strength` is constrained below `1` so it delays collapse without
becoming a shield. The result exposes capacity, overload, and trigger state;
it deliberately does not choose shedding, reconfiguration, or re-anchoring
because those modes need their own canonical selection rule.

### Identity resonance signatures

`engine.identity_resonance` models an identity's harmonic fingerprint as
amplitude, frequency, coherence, symmetry, and cumulative collapse shift.
Collapse aftermath is supplied explicitly through `CollapseHarmonicShift`, so
the engine does not invent an unapproved collapse mode. Flower-specific
interaction configuration resolves two signatures into alignment, dissonance,
interference, entrainment, storm, or entrapment, with the combined signature
preserved as a typed result.

### Identity migration paths

`engine.identity_migration` evaluates directed identity relocation from a
declared basin/Flower/era location to a candidate location. Migration requires
strict collapse aftermath, frequency and symmetry compatibility, amplitude,
corridor accessibility, Flower compatibility, and non-zero basin adjacency.
Its probability follows `amplitude * destination_symmetry *
corridor_accessibility * (1 - uncertainty)`. A decision returns the resulting
basin, Flower, or era mode, selected corridor geometry, or explicit inhibitors
that represent identity stasis rather than failure.

### Collapse cascades

`engine.cascades` implements collapse as propagating pressure deficit. A node
below its collapse threshold emits a wave only when its neighbor gradient
exceeds the cascade threshold. The wave propagates through the resonance field
with exponential decay and collapses a target when its amplitude pushes target
pressure below threshold. Collapse effects drain charge, narrow slits, and
expose a negative resonance phase without violating normalized resonance
storage. The module also supplies basin flattening, halo-failure detection,
outer-to-core cluster collapse ordering, and directional cross-Flower bias.

### Collapse immunity

`engine.immunity` sums basin depth, cluster cohesion, squared halo velocity,
resonance field, and spirit alignment into a Flower's active collapse
resilience. It returns the absorbed remainder of a collapse wave, a
neutralization decision, and halo-driven wave-redirection angle.

### Garden-scale dynamics

`engine.garden` aggregates Flower field snapshots into a world-level pressure
manifold. It applies macro-spirit pressure scaling, finds resonance alliances,
sums migration currents and halo rotation, pools Flower immunity against
collapse waves, and exposes sampled strict macro-basin detection.

### Identity evolution

`engine.evolution` applies hybrid identity time steps: explicit upstream
deltas for basin topology, resonance, halo motion, migration, and clusters can
be combined with raw storm pressure and spirit scaling. Identity locks only
when both configured immunity and net-change bounds are met.

### Garden equilibrium

`engine.equilibrium` classifies the Garden as stable, oscillatory, or chaotic
from pressure-gradient and collapse-versus-immunity boundaries. It also reports
resonance spread and migration-current turbulence as macro-attractor
diagnostics.

### World cycles

`engine.cycles` implements the ordered Garden metabolism:
distortion, drift, field, collapse, identity, role, and signal. Each transition
is tied to the stated pressure, uniformity, collapse, curvature, target, or
resonance trigger; field can branch directly to collapse when waves exceed
immunity.

### Garden navigation

`engine.navigation` moves players through pressure topology rather than a
separate coordinate model. It combines negative pressure gradients, resonance
corridors, rotational drift, spirit speed, collapse slowdown, and basin-rim
crossing into one deterministic navigation result.

### Narrative emergence

`engine.narrative` classifies tension, migration, identity, collapse, rebirth,
and player arcs from Garden signals. Its hybrid thresholds detect either
explicit divergence or baseline-relative shifts, without authored plot events.

### Era transitions

`engine.eras` detects thresholded epoch resets from global pressure divergence,
resonance drift, basin inversion, migration surge, collapse-immunity failure,
or spirit-alignment shifts. It advances the canonical distortion-to-signal era
phase loop and starts a new transition only after a signal-phase ignition.

### Era-specific mechanics

`engine.era_mechanics` uses configurable profiles rather than fixed era
numbers. A profile scales navigation and the player pressure, resonance,
corridor, collapse, and halo force coefficients for stable, oscillatory,
chaotic, collapse, or rebirth eras.

### Player influence

`engine.players` treats a player as a first-class pressure and resonance
source. It applies player emissions to Garden/basin pressure, slit openness,
corridor curvature, collapse damping, halo rotation, and Flower identity
evolution without bypassing their engine invariants.

### Flower-to-Flower interactions

`engine.interactions` evaluates two Flowers in a shared world region. It
superposes spirit-scaled pressure, identifies resonance harmonics and basin
overlap conflicts, calculates halo rotational shear, checks collapse-wave
contagion, and approximates migration flow by projecting a migration vector
through a corridor normal over node density and area.

### Halo rotation

`engine.halo` applies configurable halo activation per Flower. Above the
configured minimum orbit, `advance_halo_rotation()` combines pressure-gradient
and net-wave torque to advance angular velocity and position. Wave coherence
damps opposing signals, while `maximum_angular_speed` caps storm velocity.
The update also exposes rotational force (`mass * radius * angular_velocity²`),
inward and cluster angular deltas, and migration-corridor curvature. The
earlier `calculate_halo_rotation()` helper remains available for a
single-gradient, saturating response.

### Orbit motion

`calculate_radial_motion()` maps effective pressure to radial movement:

- Below collapse threshold: `-collapse_sensitivity * (collapse - Peff)^2`
- Within the stable band: `0`
- Above drift threshold: `drift_sensitivity * sqrt(Peff - drift)`

`calculate_orbit_motion()` combines that radial result with
`calculate_angular_motion()`, which applies angular sensitivity to a signed
pressure gradient. Each Fib band supplies its own thresholds, pressure
multiplier, and motion sensitivities.