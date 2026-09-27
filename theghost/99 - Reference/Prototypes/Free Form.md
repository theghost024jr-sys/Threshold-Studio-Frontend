Free‑form signals turn the world into a **living field** instead of a rigid event bus. They let characters, environments, the player, and the system emit _whatever they need to emit_ in the moment, without being forced into a predefined schema. That freedom is exactly what makes a resonance‑driven engine possible.

The key is giving the system a way to **interpret** free‑form signals without collapsing into chaos. That’s where the registry and the semantic layer step in.

🌀 What “free‑form” actually means in a reactive world

A free‑form signal is just a small packet of meaning:

{ "type": "EmotionChanged", "entity": "Andy", "value": "fear", "source": "Wolf", "distance": 3.2 }

Or:

{ "type": "EnvironmentalShift", "biome": "Forest", "weather": "fog", "intensity": 0.8 }

Or:

{ "type": "PlayerIntent", "intent": "confront", "target": "Andy" }

There is no schema.  
There is no enforced structure.  
There is only **meaning**, expressed as a loose object.

This is the same way Obsidian works: meaning first, structure second.

🌐 How the system stays coherent with free‑form signals

The system doesn’t need strict types because it has three stabilizing organs:

- **semantic layer** (Obsidian definitions)
- **registry** (embodiment rules)
- **reactive field** (signal listeners)

The parser extracts meaning from `.md`.  
The registry maps meaning to embodiment.  
The reactive field carries signals to whoever cares.

This keeps the world coherent even when signals are messy.

🧩 How the registry interprets free‑form signals

The registry doesn’t need strict schemas.  
It only needs to match **keys** and **values** that matter.

Example rule:

- if: near=Wolf use: scared

A free‑form signal like:

{ "type": "EnteredRange", "entity": "Wolf", "target": "Andy", "distance": 2.1 }

is enough for the registry to say:

- “Wolf is near Andy.”
- “Andy has a rule for near=Wolf.”
- “Use the scared variant.”

No schema required.  
Just meaning.

🌱 Why free‑form is the right choice for your world

Your world is not mechanical.  
It’s semantic, relational, contextual, and emergent.

Free‑form signals allow:

- new emotions
- new environmental states
- new player intents
- new character roles
- new biomes
- new world modes

without ever updating a schema.

This is the only architecture that can scale with an Obsidian vault full of unpredictable, evolving definitions.

🔄 How characters react to each other with free‑form signals

A character emits:

{ "type": "EmotionChanged", "entity": "Wolf", "value": "aggression" }

Another character receives it and checks the registry:

- if: near=Wolf AND Wolf.emotion=aggression use: terrified

The world layer swaps Andy into his terrified embodiment.

This is resonance in motion.

🌳 How environments react with free‑form signals

A biome emits:

{ "type": "CorruptionLevelChanged", "biome": "Forest", "value": 0.82 }

Registry rule:

- if: corruption>0.7 use: corrupted

The forest shifts into its corrupted variant.

No schema.  
No rigid types.  
Just meaning.

🎮 How the player fits into the free‑form field

Player emits:

{ "type": "PlayerStressChanged", "value": 0.9 }

Registry rule:

- if: player.stress>0.8 use: stressed

Characters and environments react accordingly.

🧠 Why this stays clean instead of chaotic

Because the system has **three stabilizers**:

- semantic definitions
- registry rules
- reactive field

Free‑form signals don’t create chaos.  
They create **possibility**.  
The registry creates **order**.

The next question is whether you want the registry to support **compound conditions** (e.g., “if Wolf is near AND player is stressed AND time is night”).