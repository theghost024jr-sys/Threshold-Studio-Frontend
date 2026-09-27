# Core Properties

## Universal Properties (apply to all nodes)
- **id:** Unique identifier for the file. Auto-generated.
- **type:** The node’s category (Biome, Spirit, Mechanic, Entity, Artifact, etc.)
- **status:** Dormant | Active | Engaged
- **tier:** 1–5 (represents complexity, power, or depth)
- **tags:** Freeform tags for grouping and querying
- **summary:** One-sentence description of the node
- **updated:** Auto-filled timestamp

## Optional High-Leverage Properties
- **inputs:** What this node consumes or requires
- **outputs:** What this node produces or influences
- **signals:** Events, cues, or triggers associated with the node
- **spirit:** Associated spirit or animating force
- **alignment:** Directional or moral orientation
- **instability:** 0–10 measure of volatility
- **drift:** How the node changes over time

## Usage Notes
- Universal properties appear in every template.
- Optional properties appear only when relevant.
- Dataview queries rely on consistent naming.
- Metadata Menu enforces allowed values and types.