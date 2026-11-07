# Circuit Mirror

The Circuit Mirror is the node's internal feedback loop. It does not decide
whether a slit-admitted signal is good. It determines whether that signal
completes, intensifies, distorts, or fails to resolve the node's local circuit.

## Position in the node pipeline

```text
Field -> Slit -> Circuit Mirror -> Internal State -> Output / Demand -> Field
```

The Field determines what reaches a node. The Slit determines what can enter.
The Circuit Mirror compares what entered with the node's internal state. Its
output is a changed local state and an unresolved difference; it does not
directly authorize migration, collapse, or another global outcome.

## Persistent state, events, and reflection

The normalized local condition is:

```text
M = (R, D, C, Phi, E)
```

- `R`: resonance
- `D`: deficit
- `C`: coherence
- `Phi`: phase relative to the surrounding Flower and Field
- `E`: evidence accumulated from meaningful contact

The persistent Mirror states are:

- `DORMANT`: no evidence has established a deficit. Demand is zero and no
  pressure may be derived from the Mirror; this is unknown, not satisfied.
- `SEEKING`: a meaningful unresolved difference has identified a deficit.
- `RESONANT`: an input is compatible with the active deficit but has not
  resolved it.
- `COHERENT`: an active discrepancy has been closed locally.
- `DISSONANT`: meaningful evidence conflicts with the current model.
- `FRACTURED`: sustained contradiction prevents a single coherent model.

`EXPOSED` is a transient evaluation phase between contact and output, not
stored Mirror state. `CONTACT`, `NOISE`, `REFLECTION`, `RESOLUTION`, and
`INVERSION` are events, not states. Noise returns to the preceding persistent
state without mutation. Inversion requires revision evidence while Dissonant
or Fractured; it emits an auditable model revision, then reevaluates the
deficit instead of preserving an invalid model.

For a signal `I` that has passed the Slit, reflection produces a normalized
discrepancy `Delta`. The Mirror emits demand only in an unresolved state:

```text
Demand = D * Delta
```

Demand is neither a designer-written node property nor persistent Mirror
state. Before meaningful contact, a node has potential but no demand.

## Transition rules

| Current state | Evidence/result | Next state |
| --- | --- | --- |
| DORMANT | meaningful contact and unresolved difference | SEEKING |
| SEEKING | compatible evidence | RESONANT |
| SEEKING or RESONANT | sufficient resolution | COHERENT |
| COHERENT | new unresolved difference | SEEKING |
| Any non-EXPOSED state | significant contradiction | DISSONANT |
| DISSONANT | sustained contradiction | FRACTURED |
| DISSONANT or FRACTURED | sufficient revision evidence | INVERSION -> SEEKING or COHERENT |
| Any EXPOSED state | noise | preceding persistent state |

## Conservation and boundary rules

1. All Circuit Mirror state values, reflected difference, and emitted values are
   normalized to `[0, 1]`.
2. Meaningful evidence is the only source of new deficit or demand. A dormant
   Mirror cannot manufacture either.
3. Resolution is the only ordinary transition that decreases an existing
   deficit. Inversion may replace a disproven model only when revision evidence
   crosses its explicit threshold.
4. Noise is non-mutating; it cannot manufacture evidence, meaning, or demand.
5. Every completed reflection emits immutable `MirrorOutput` metadata:
   reflection ID, node-local sequence, world tick, prior/resulting state,
   semantic transition, evidence provenance, discrepancy, optional demand,
   and optional model revision.
6. The Mirror emits demand, coherence delta, resonance, contradiction,
   novelty, and confidence. It does not own pressure, force, motion, anchoring,
   migration, or collapse.
7. Fib Flower physics may derive pressure only from unresolved emitted demand.
   Pressure alone does not authorize migration, capture, or collapse.
8. A Mirror result is local. Propagation to another node requires an explicit
   Field or resonance-wave rule.

## Integration

The implementation evaluates transient exposure within
`reflect_circuit_mirror()`. Its `MirrorOutput` can be deduplicated and applied
in node-local sequence order before the Fib Flower and metabolism layers
consume it through explicit integration rules. The Mirror does not call their
motion or topology primitives. This keeps the causal chain explicit:

```text
Contact -> Reflection -> Difference -> Demand -> Pressure -> Motion -> Structure
```

`engine.pressure.evaluate_pressure()` owns the Demand-to-Pressure boundary. It
accumulates only unresolved, provenance-bearing demand; exposes bounded
pressure from unbounded raw load; separates passive decay from active
resolution relief; and retains opposing polarities as independent loads unless
an explicit dimension-specific cancellation policy justifies reducing both. It
does not interpret evidence or prescribe a force, orbit, anchor, migration, or
collapse.

`engine.force.evaluate_force()` owns the Pressure-to-Force boundary. It derives
force only from dimension-matching, valid Field candidates; reports pressure
without a target as undirected load; and preserves gross force, resultant
force, directional bias, tension, and bounded Field resistance as distinct
readings. It does not update motion or topology.

`engine.node_physics.integrate_node()` owns the Force-to-Motion boundary. It
integrates Force results into constrained position and velocity using
semi-implicit Euler order, observes Drift from actual displacement, and reports
constraint-aware motion frustration. It does not evaluate Anchor, migration,
capture, Collapse, or other topology changes.

`engine.structural.evaluate_structure()` owns Structural Interpretation. It
combines persistent pressure, force, motion, relationship, and Flower
observations into evidence-backed proposals for topology authority. It can
observe regimes and propose relationship strengthening or weakening, Anchor,
orbit, capture, fracture, or Collapse candidates, but it never mutates the
Fib Flower itself and preserves competing proposals through conflict grouping.

`engine.topology.evaluate_topology()` is the only topology writer. It validates
batched Structural proposals against immutable, versioned topology; defers
ambiguous conflicts; validates the successor's global consistency; and commits
only atomic state transitions with immutable topology events.

## Canonical return-loop contracts

The return loop has three executable system contracts, covered together in
`tests/test_return_loop.py`.

1. **Insufficient evidence is quiescent.** An `INSUFFICIENT` Mirror result is
   an honest no-vote. It creates no demand, pressure contribution or relief,
   force, induced motion, structural proposal, topology event, or topology
   mutation. An evaluated zero force is valid; recovery must not substitute
   zero for unavailable force data.
2. **Supported evidence propagates with provenance.** A supported unresolved
   discrepancy may produce demand, pressure, Field-supported force, motion,
   and structural observation. The originating demand ID remains traceable
   through pressure and force. A single supported tick does not establish
   structural truth.
3. **Persistent evidence may become structure.** Only sustained mutual
   resolution and relationship support can make an Anchor proposal eligible.
   The proposal remains non-authoritative until Topology Authority validates
   and atomically commits it.
4. **Recovery preserves causality.** Recovery restores process integrity but
   does not establish world truth. Errors are not evidence; unavailable values
   cannot become zero values; stale output cannot become current output; and
   downstream needs cannot rewrite upstream causes. Recovery may reevaluate,
   rebuild declared derived state, quarantine an operational branch, abort an
   uncommitted transaction, or halt when authoritative integrity is
   untrustworthy. It cannot rewrite committed history.

```text
No evidence -> no invention
Supported evidence -> traceable physical consequence
Supported + persistent + authorized evidence -> structural truth
Failure -> preserve causality
```

## Links
[[Fib Flower]]
[[20 - Threshold/Motherboard/Board-I-Intelligence/Node Physics/Node Physics]]
[[20 - Threshold/Motherboard/Board-G-Geometry/Fib Flower/Migration Rules]]
[[20 - Threshold/Motherboard/Board-I-Intelligence/Intelligence/02 - Chambers/Ethos Chamber/Ethos Chamber]]
