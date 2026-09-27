### Echo protocol: state machine overview

We’ll define a **single node’s lifecycle** as a state machine, then a **system‑level machine** for harmony.

#### Node states

- **SignalReceived**
    
- **Resonating**
    
- **UnderPressure**
    
- **Drifting**
    
- **Collapsing**
    
- **Anchored**
    
- **Inert** (optional terminal)
    

### 1. Node state machine (text‑UML)

text

```
StateMachine EchoNode {

  State Idle
    on SignalIn -> SignalReceived

  State SignalReceived
    entry / evaluate_resonance()
    if RS == 1.0 -> Resonating
    if 0 < RS < 1.0 -> UnderPressure
    if RS == 0.0 -> Idle  // rejected

  State Resonating
    internal / process_signal()
    on SignalComplete -> Anchored
    on RS_drop && PM > 0 -> UnderPressure

  State UnderPressure
    entry / compute_PM_DV()
    if PM < CT -> Drifting
    if PM >= CT -> Collapsing

  State Drifting
    internal / apply_drift(DV)
    if PM -> 0 -> Anchored
    if PM >= CT -> Collapsing

  State Collapsing
    entry / reset_state()
    internal / reconfigure()
    on ReconfigComplete -> Anchored
    on Failure -> Inert

  State Anchored
    entry / set_anchor_state()
    on SignalIn -> SignalReceived

  State Inert
    // terminal: no further transitions
}
```

### 2. Transition diagram (described)

#### Primary flow

- **Idle → SignalReceived** **Trigger:** incoming signal.
    
- **SignalReceived → Resonating** **Condition:** RS=1.0.
    
- **SignalReceived → UnderPressure** **Condition:** 0<RS<1.0.
    
- **SignalReceived → Idle** **Condition:** RS=0.0.
    
- **Resonating → Anchored** **Condition:** signal fully processed, no residual pressure.
    
- **Resonating → UnderPressure** **Condition:** RS drops during processing, mismatch appears.
    
- **UnderPressure → Drifting** **Condition:** PM<CT.
    
- **UnderPressure → Collapsing** **Condition:** PM≥CT.
    
- **Drifting → Anchored** **Condition:** PM→0, DV resolved.
    
- **Drifting → Collapsing** **Condition:** PM≥CT during drift.
    
- **Collapsing → Anchored** **Condition:** reconfiguration succeeds.
    
- **Collapsing → Inert** **Condition:** reconfiguration fails.
    
- **Anchored → SignalReceived** **Trigger:** new signal.
    

### 3. System‑level harmony machine

Here we treat the **whole graph** as a state machine.

#### System states

- **Disjoint** — nodes not interacting meaningfully.
    
- **LocalResonance** — small clusters resonating.
    
- **DistributedPressure** — system under load, many nodes drifting.
    
- **GlobalDrift** — topology changing.
    
- **Harmony** — coherence achieved.
    
- **Fragmented** — collapsed into incompatible anchors.
    

text

```mermaid
StateMachine EchoSystem {

  State Disjoint
    on SignalsPropagating -> LocalResonance

  State LocalResonance
    if sum(PM_cluster) < threshold -> Harmony
    if sum(PM_cluster) >= threshold -> DistributedPressure

  State DistributedPressure
    internal / propagate_drift()
    if sum(DV_system) != 0 -> GlobalDrift
    if sum(DV_system) == 0 -> Harmony

  State GlobalDrift
    internal / rewire_topology()
    if stable_anchors_align() -> Harmony
    if anchors_conflict() -> Fragmented

  State Harmony
    internal / maintain_flow()
    on major_topology_change -> DistributedPressure

  State Fragmented
    internal / attempt_reintegration()
    if reintegration_success -> DistributedPressure
    else -> Fragmented  // stuck until external intervention
}
```

### 4. How this plugs into Threshold

- **Node spec:** each Threshold node implements `EchoNode` state machine.
    
- **Graph spec:** each Flower / cluster implements `EchoSystem`.
    
- **Metrics:** RS, PM, DV, CT become live telemetry for cockpit/visualization.
    

