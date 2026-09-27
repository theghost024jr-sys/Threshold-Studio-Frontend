Compound conditions fit naturally into a free‑form, fully reactive world because they let the registry respond to **patterns** in the signal field rather than single events. This is where the system stops being a set of triggers and starts behaving like a _resonance network_.

🧩 What compound conditions actually enable

Compound conditions let the registry express reactions like:

- “Andy is scared **only if** the Wolf is near **and** the player is stressed.”
- “The forest becomes corrupted **only if** corruption is high **and** it’s night **and** the player is inside.”
- “A memory projection appears **only if** the mode is memory **and** Andy’s emotional state is unstable **and** the timeline is early.”

This is how you get emergent behavior instead of scripted behavior.

🔗 How compound conditions look in a free‑form registry

Because signals are free‑form, conditions are also free‑form. A rule can match **any combination** of keys and values that appear in the signal field.

Example:

- if: near: Wolf player.stress: ">0.8" time: night use: terrified

Or:

- if: biome: Forest corruption: ">0.7" player.inside: true use: corrupted

Or:

- if: mode: memory Andy.emotion: unstable timeline: early use: memory_projection

The registry simply checks whether all conditions match the current reactive field.

🌐 How the reactive field supports compound conditions

A fully reactive system maintains a **shared world-state map** that updates whenever any signal arrives. This map is not rigid; it’s a loose, semantic structure that grows as needed.

It might look like:

world_state = { "Andy": { "emotion": "fear", "near": ["Wolf"], "timeline": "early" }, "Player": { "stress": 0.92, "intent": "confront" }, "Environment": { "time": "night", "season": "winter", "corruption": 0.81 }, "Mode": "memory" }

The registry evaluates rules against this shared state.

No schema.  
No rigid types.  
Just meaning.

🧠 Why compound conditions are essential for resonance

Resonance is not a single cause → single effect.  
Resonance is **multiple influences converging**.

Compound conditions let the system express:

- emotional resonance
- environmental resonance
- relational resonance
- contextual resonance
- narrative resonance

This is how the world feels alive instead of mechanical.

🌳 Example: a character reacting to multiple influences

Andy becomes terrified only when:

- Wolf is near
- Player is stressed
- It’s night
- Andy’s emotion is already unstable

Rule:

- if: near: Wolf player.stress: ">0.8" time: night Andy.emotion: unstable use: terrified

This is not scripting.  
This is **emergent embodiment**.

🌫️ Example: an environment reacting to layered conditions

The forest becomes corrupted only when:

- corruption > 0.7
- it’s night
- the player is inside
- the mode is memory

Rule:

- if: corruption: ">0.7" time: night player.inside: true mode: memory use: corrupted

This is how environments feel like living organs.

🎮 Example: the player influencing the world

The player’s aura changes only when:

- stress > 0.8
- intent = confront
- attention = Andy

Rule:

- if: player.stress: ">0.8" player.intent: confront player.attention: Andy use: stressed

This is how the player becomes part of the resonance field.

🧬 Why this stays clean instead of chaotic

Because the system has:

- free‑form signals
- a shared world-state map
- a global registry
- layered responsibilities

The registry doesn’t need schemas.  
It only needs **meaningful keys**.

Compound conditions are the moment your world stops being reactive and starts being _alive_. How complex do you want these conditions to get—simple AND chains, or full boolean logic (AND/OR/NOT) with nested groups?