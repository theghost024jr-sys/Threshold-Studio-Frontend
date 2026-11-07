# Threshold Weather Model

Version 0.1 — canonical data model, not a numeric weather law.

Weather is the perceptible expression of worldstate. The Engine keeps its
cycle phase, seasonal substrate, drivers, visible phenomena, and scope distinct
so that "weather" is not reduced to one overloaded state or enum.

## Model axes

### Cycle phase

`cyclePhase` is the qualitative worldstate loop:

- `Coherence`
- `Tension`
- `Collapse`
- `Void`
- `Renewal`

These are not seasons or weather phenomena. The transition sequence is
Coherence → Tension → Collapse → Void → Renewal → Coherence. Trigger values
and transition laws are not specified here.

### Seasonal substrate

`seasonState` is an independent substrate modifier:

- `Winter`
- `Spring`
- `Summer`
- `Autumn`

Seasonal effects influence substrate behavior; they do not replace or directly
rename `cyclePhase`. The corpus describes qualitative tendencies, not numeric
modifier values.

### Worldstate drivers

Drivers describe the conditions from which weather expressions are derived:

| Field | Meaning | Unresolved for implementation |
|---|---|---|
| `drift` | Direction and movement | Coordinate basis, dimensionality, and normalization |
| `pressure` | Intensity and strain | Units, range, and accumulation rule |
| `resonance` | Tone and coherence | Scalar versus spectrum, units, and combination rule |
| `density` | Concentration and turbulence | Units, range, and interaction with pressure |

No driver should be fabricated from a phenomenon label. These fields require
validated Engine inputs and explicit update laws before they can drive
transitions.

### Phenomenological output

`environmentalPhenomenon`, `symbolicPhenomenon`, and `astralPhenomenon`
describe what the player can perceive. They are outputs, not independent
forces. Examples in the corpus include a moving tree, fog, soup, eddies,
fronts, storms, vortices, astral fronts, and astral storms. The canonical
registries, derivation rules, and cross-layer mappings remain to be defined.

### Scope

Weather state is attached to an explicit scope:

```text
scope = { kind: "local" | "regional" | "world", id: string }
```

Local is the default. Only a node that receives Echo adapts locally. Regional
or world weather changes only when a validated propagation rule carries the
effect beyond the recipient. Scope is not inferred from phenomenon intensity.

## Runtime shape

The following is a conceptual contract; unresolved types and calculations are
deliberately marked rather than guessed:

```text
NodeWorldstate {
  substrateState: "Argon" | "Echo"
  weather: null | {
    cyclePhase: "Coherence" | "Tension" | "Collapse" | "Void" | "Renewal"
    seasonState: "Winter" | "Spring" | "Summer" | "Autumn"
    drivers: {
      drift: Vector<TBD>
      pressure: Number<TBD units and range>
      resonance: Number | Spectrum<TBD>
      density: Number<TBD units and range>
    }
    phenomena: {
      environmentalPhenomenon: Identifier<TBD registry>
      symbolicPhenomenon: Identifier<TBD registry>
      astralPhenomenon: Identifier<TBD registry>
    }
    scope: { kind: "local" | "regional" | "world", id: string }
  }
}
```

Argon has no active weather snapshot. Echo creates or changes weather only
within the recipients of that Echo. The Engine must not populate regional or
world scope as a side effect of a local signal.

## Evaluation direction

```text
Echo delivered to recipient
  → recipient's current worldstate and seasonal context
  → validated driver updates
  → cycle transition checks
  → symbolic and astral phenomena
  → local snapshot
  → optional, explicitly authorized propagation
```

This ordering is a boundary contract, not an implemented simulation. In
particular, the corpus does not yet define:

- how an action or Echo changes drift, pressure, resonance, or density
- numeric bounds, units, thresholds, or normalization
- how seasonal modifiers combine with cycle phase
- how drivers select symbolic or astral phenomena
- whether cycle transitions are automatic, player-triggered, or both
- propagation distance, delay, attenuation, or recipient selection
- whether local weather persists, decays, or resets when Echo ends

## Corpus mapping

The four categories organize, rather than replace, the existing note families:

- Cycle phases: [Cycle Weather Systems](../theghost/03%20-%20Organism/Organism/09%20Myth%20Cluster/02%20Cycles/Cycle%20Weather%20Systems.md) and [Cycle Weather Diagnostics](../theghost/03%20-%20Organism/Organism/09%20Myth%20Cluster/02%20Cycles/Cycle%20Weather%20Diagnostics.md).
- Seasonal substrate: [Seasonal Effects on Substrates](../theghost/02%20-%20World/06%20-%20World%20State/Seasonal%20Effects%20on%20Substrates.md) and [Seasonal Transitions](../theghost/02%20-%20World/06%20-%20World%20State/Seasonal%20Transitions.md).
- Phenomena: [Symbolic Weather](../theghost/02%20-%20World/06%20-%20World%20State/Symbolic%20Weather.md) and [Astral Weather](../theghost/02%20-%20World/06%20-%20World%20State/Astral%20Weather.md).
- Drivers and cross-layer behavior: [Worldstate Pressure Map](../theghost/02%20-%20World/06%20-%20World%20State/WorldState%20Pressure%20Map.md), [Worldstate Drift Map](../theghost/02%20-%20World/06%20-%20World%20State/WorldState%20Drift%20Map.md), and [Identity-Weather Mechanics](../theghost/01%20-%20Physics/Identity%20Layer%20Physics/Identity-Weather%20Mechanics.md).
- Traversal and hazards: [Threshold Weather Navigation](../theghost/20%20-%20Threshold/World/Threshold%20Weather%20Navigation/Threshold%20Weather%20Navigation.md) and [Collapse Weather Systems](../theghost/20%20-%20Threshold/World/Zones/Collapse%20Weather%20Systems.md).
- Moving-tree references: [Tree that follows You](../theghost/03%20-%20Organism/03%20-%20%20Motion/01%20-%20Substrates/Time%20Organ/02%20Form/13%20-%20Environments/Flora/Animated%20Trees/Tree%20that%20follows%20You.md) and [Tree that walks away when asked if it is following you](../theghost/03%20-%20Organism/03%20-%20%20Motion/01%20-%20Substrates/Time%20Organ/02%20Form/13%20-%20Environments/Flora/Animated%20Trees/Tree%20that%20walk%20away%20when%20you%20ask%20if%20it's%20following%20you.md). These notes contain image embeds rather than a written causal explanation. The observed behavior is modeled as `Following` → `Withdrawing` when the player asks if it is following. `Tree` as the Void cycle glyph is separate.

## Implementation status

`weather-model.js` validates immutable local weather snapshots and keeps the
cycle, season, numeric drivers, and environmental, symbolic, and astral
phenomena separate.
`ThresholdBranchEngine.applyWeatherState()` accepts a snapshot only for a node
whose substrate is already `Echo`; snapshots are cleared when that node
receives another accepted Echo, advances, or the Echo system resets. The
current local API does not calculate numeric drivers or select phenomena;
callers must provide those values explicitly.

`moving-tree-model.js` implements the observed following/withdrawal
interaction without assigning an undocumented cause. Its state can be recorded
as an environmental phenomenon; the movement does not automatically change
symbolic or astral weather. Numeric weather laws and regional/world
propagation remain unimplemented.
