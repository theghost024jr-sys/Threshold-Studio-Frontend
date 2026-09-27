A **global registry** is the strongest choice because it becomes the _single organ_ that holds the entire world’s embodiment logic in one place. That centralization is what allows resonance to operate across the whole system instead of being trapped inside individual files or scattered across scenes.

To make this concrete, here’s what a global registry actually gives you, how it behaves, and how it stays clean even as the world grows.

🌐 What a global registry actually is

It’s a **single data file** (JSON, YAML, `.tres`, or `.md` frontmatter) that contains:

- every entity’s canonical embodiment
- fallback embodiments
- variant embodiments
- resonance rules
- tags and roles
- context‑based overrides
- world‑state overrides

It becomes the **world’s embodiment map**.

The parser reads definitions.  
The registry maps definitions to bodies.  
The world layer instantiates the chosen body.

This keeps the architecture layered and clean.

🧱 Why global is cleaner than per‑entity files

A global registry avoids:

- duplicated logic
- scattered override rules
- inconsistent formats
- per‑entity drift
- “where does this rule live?” confusion
- circular dependencies

Instead, you get:

- one place to inspect the entire world’s embodiment logic
- one place to add new resonance rules
- one place to override scenes
- one place to debug embodiment mismatches
- one place to evolve the system

This is the **cleanest possible expression** of your “Obsidian is the source of truth” architecture.

🧬 The global registry sketch (expanded)

Here’s a more complete sketch of how the global registry might look in practice:

entities: Andy: scene: res://scenes/characters/andy/Andy.tscn fallback: res://scenes/generic/GenericCharacter.tscn tags: [character, sentient, protagonist] variants: ghost: res://scenes/characters/andy/AndyGhost.tscn memory: res://scenes/characters/andy/AndyMemory.tscn child: res://scenes/characters/andy/AndyChild.tscn rules: - if: mode=ghost use: ghost - if: context=memory use: memory - if: timeline=early use: child ForestBiome: scene: res://scenes/biomes/forest/Forest.tscn fallback: res://scenes/generic/GenericBiome.tscn tags: [biome, natural] variants: winter: res://scenes/biomes/forest/ForestWinter.tscn night: res://scenes/biomes/forest/ForestNight.tscn rules: - if: season=winter use: winter - if: time=night use: night

This is the **entire world’s embodiment logic** in one place.

🔮 Why global is the best choice for resonance

Resonance is not local.  
It’s not per‑entity.  
It’s not per‑scene.

Resonance is **contextual**, **systemic**, and **world‑state‑dependent**.

A global registry allows resonance to:

- override embodiments based on global mode
- shift variants based on world state
- select forms based on timeline
- choose embodiments based on relationships
- react to environmental conditions
- respond to player state
- respond to system mode

A per‑entity registry cannot do this cleanly.  
A global registry can.

🧠 Why this stays clean even as the world grows

The global registry is not a dumping ground.  
It’s a **semantic index** of embodiment.

It stays clean because:

- the parser never touches it
- scenes never touch it
- UI never touches it
- only the system layer reads it
- only the world layer receives its decisions

It becomes the **single source of embodiment truth**, just as Obsidian becomes the **single source of semantic truth**.

This is the cleanest possible architecture for a data‑driven world engine.

🧭 A natural next step

Do you want the global registry to support **inheritance** (e.g., “all characters share these defaults unless overridden”), or should each entity be fully explicit?