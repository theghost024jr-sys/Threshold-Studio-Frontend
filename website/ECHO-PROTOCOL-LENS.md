# Echo Protocol Lens

The Engine exposes Echo Protocol telemetry as an observational view. Inspecting
the Lens does not send signals, change node state, alter branch presentation, or
force Harmony.

Each existing branch receives a deterministic protocol node with the initial
pattern `["branch", branchId]`, boundary `threshold-branch`, frequency band
`[0.1, 10]`, tolerance `1`, flexibility `0.25`, and stability `4`. These are
simulation defaults, not measurements inferred from vault content.

Every node begins on the inert `Argon` substrate: no received Echo, pressure,
drift, anchor, or history. A valid targeted signal changes only its recipient
to the active `Echo` substrate. Nodes that do not receive a signal remain in
Argon and are excluded from active system resolution. `resetEchoSystem()`
returns every protocol node to that baseline without changing vault data.

`ThresholdEngine.inspectEchoes()` returns a read-only snapshot of system state,
node phases, resonance strength, pressure, drift vectors, anchors, and signal
counts. `processEchoSignal(nodeId, signal)` and `advanceEchoNode(nodeId)` update
the protocol and publish `threshold:echo-lens-update` with the resulting node
snapshot and system report.

Harmony has two cooperative modes:

- `resonant`: all active anchored nodes have the same feature set.
- `complementary`: the feature sets differ, but every pair shares at least one
  feature.

Anchored nodes with disjoint feature sets are `Fragmented`. These rules are
deterministic protocol semantics; they make no claim about physical quantum
entanglement.

The current runtime does not model bundle activation, orbit relevance,
chamber-driven changes, or ethos influence, so the Lens does not fabricate or
report those measurements.
