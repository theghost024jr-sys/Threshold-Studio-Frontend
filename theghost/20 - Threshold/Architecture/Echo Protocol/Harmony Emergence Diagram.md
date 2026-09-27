# **Harmony Emergence Diagram (Mermaid)**

markdown
```mermaid
stateDiagram-v2
    [*] --> LocalResonance

    LocalResonance --> Harmony: CPM < threshold
    LocalResonance --> DistributedPressure: CPM >= threshold

    DistributedPressure --> Harmony: SDV == 0
    DistributedPressure --> GlobalDrift: SDV != 0

    GlobalDrift --> Harmony: anchors_align()
    GlobalDrift --> Fragmented: anchors_conflict()

    Fragmented --> DistributedPressure: reintegration_success
    Fragmented --> Fragmented: reintegration_fail

    Harmony --> DistributedPressure: major_topology_change
```
````

## **What this diagram represents (quick recap)**

**Harmony emerges** when:

- **Cluster Pressure Metric (CPM)** is below threshold
    
- **System Drift Vector (SDV)** resolves to zero
    
- **Anchors align** during global drift
    

And **Harmony collapses** when:

- topology changes
    
- pressure spikes
    
- anchors conflict
    
- reintegration fails
    

This diagram shows the **exact pathways** into and out of Harmony — the “stable orbit” state of a Flower or cluster.