A registry that supports resonance needs to be **simple enough to read**, **expressive enough to grow**, and **layered enough** that it never contaminates the parser or the world layer. The sketch below shows the _shape_ of that organ — not a final format, but the structural rhythm it needs to hold.

🧩 Purpose of the registry

The registry is the **bridge** between:

- semantic definitions (from Obsidian)
- embodiment options (scenes, variants, fallbacks)
- resonance rules (context, mode, world state)

It does not interpret `.md` files.  
It does not instantiate scenes.  
It simply **maps identity → embodiment options**, and provides a place for resonance to choose.

📘 Sketch of the registry (conceptual form)

This is a **data‑driven** structure, expressed in YAML‑like pseudocode for clarity. It could live as JSON, YAML, `.md` frontmatter, or a Godot Resource.

entities: Andy: scene: res://scenes/characters/andy/Andy.tscn fallback: res://scenes/generic/GenericCharacter.tscn tags: [character, sentient, protagonist] variants: ghost: res://scenes/characters/andy/AndyGhost.tscn memory: res://scenes/characters/andy/AndyMemory.tscn child: res://scenes/characters/andy/AndyChild.tscn rules: - if: mode=ghost use: ghost - if: context=memory use: memory - if: timeline=early use: child ForestBiome: scene: res://scenes/biomes/forest/Forest.tscn fallback: res://scenes/generic/GenericBiome.tscn tags: [biome, natural] variants: winter: res://scenes/biomes/forest/ForestWinter.tscn night: res://scenes/biomes/forest/ForestNight.tscn rules: - if: season=winter use: winter - if: time=night use: night

This sketch shows the **four essential organs**:

1. **scene**

The canonical embodiment.

2. **fallback**

Used when no scene exists or resonance rejects the canonical one.

3. **variants**

Alternative embodiments that can be selected dynamically.

4. **rules**

Resonance‑based selection logic:

- mode
- context
- timeline
- world state
- tags
- relationships

This is where the “both, depending on resonance” logic lives.

🧠 Why this structure works

It keeps the three layers clean:

Content layer

Obsidian `.md` files define:

- identity
- roles
- relationships
- metadata

System layer

Parser + index produce:

- semantic objects
- tags
- roles
- context

Registry

Maps semantic identity → embodiment options.

World layer

Instantiates the chosen scene.

No layer knows too much.  
No layer leaks into another.  
Resonance flows through the registry, not the parser.

🔄 How the system uses the registry at runtime

1. Parser reads `Andy.md` → produces semantic object.
2. Registry receives semantic object → checks:

- tags
- mode
- context
- world state

4. Registry selects:

- canonical scene
- variant scene
- fallback scene
- or data‑driven instantiation

6. World layer instantiates the chosen embodiment.

This is the **resonance engine** in action.

🧬 Why this sketch is enough to start building

You don’t need to finalize the format.  
You only need the **shape**:

- identity
- canonical embodiment
- fallback
- variants
- resonance rules

As long as the registry holds these organs, the system can grow without collapsing.

The next question is whether you want the registry to live as **one file** (global registry) or **many small files** (one registry entry per entity).