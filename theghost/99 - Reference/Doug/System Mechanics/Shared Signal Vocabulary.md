A fully reactive world needs a **shared signal vocabulary** so every organ—characters, environments, the player, the system—can emit and respond to the same kinds of events. This vocabulary becomes the _language of the world_, the medium through which resonance flows. The registry listens to these signals, evaluates rules, and selects embodiments; the world layer performs the reactions.

🌱 Core world-state signals

These describe the global conditions that everything can react to.

- **TimeOfDayChanged** — morning, noon, dusk, night; drives biome and character variants.
- **SeasonChanged** — winter, spring, summer, fall; affects biomes and environmental forms.
- **WeatherChanged** — rain, storm, fog, clear; influences mood and visibility.
- **CorruptionLevelChanged** — a scalar that can trigger corrupted variants.
- **ModeChanged** — ghost mode, memory mode, combat mode; affects characters and UI.
- **TimelineShifted** — early, middle, late; supports age or form changes.

These signals define the _ambient field_ the world reacts to.

🧍 Character-to-character signals

These allow characters to react to each other’s presence, state, and intent.

- **EnteredRange(entity)** — someone came close enough to matter.
- **LeftRange(entity)** — someone moved out of influence.
- **AttentionShifted(target)** — a character’s focus changed.
- **EmotionChanged(new_emotion)** — fear, anger, joy, confusion.
- **RoleActivated(role)** — healer, guardian, predator, guide.
- **ThreatLevelChanged(level)** — used for fear/anger variants.
- **AffinityChanged(entity, value)** — relationship shifts.

These signals let characters behave as if they _feel_ each other.

🎮 Player-state signals

The player is just another entity in the reactive field.

- **PlayerIntentChanged(intent)** — explore, flee, confront, observe.
- **PlayerAttentionChanged(target)** — what the player is focusing on.
- **PlayerStressChanged(level)** — used for aura or environment reactions.
- **PlayerActionPerformed(action)** — interact, attack, speak, examine.
- **PlayerEnteredBiome(biome)** — triggers biome reactions.

These signals let the world respond to the player’s internal and external state.

🌳 Environment and biome signals

Biomes and environments emit signals that characters and systems can react to.

- **BiomeEntered(entity)** — someone entered a biome.
- **BiomeLeft(entity)** — someone left a biome.
- **EnvironmentalHazardChanged(type, level)** — heat, cold, toxicity.
- **LightLevelChanged(level)** — dark, dim, bright.
- **SoundscapeChanged(type)** — quiet, tense, chaotic.

These signals let the environment behave as a living organ.

⚙️ System-level signals

These are emitted by the engine itself.

- **Tick(delta)** — the time engine’s heartbeat.
- **ContextChanged(context)** — memory, dream, real, echo.
- **NarrativeBeatReached(beat)** — story rhythm.
- **RegistryUpdated** — new rules or mappings loaded.

These signals keep the system coherent and synchronized.

🔗 How the registry uses these signals

The registry listens to signals and evaluates rules like:

- if: near=Wolf use: scared - if: player=threatening use: angry - if: season=winter use: winter - if: corruption>0.7 use: corrupted - if: mode=ghost use: ghost

Signals trigger rule evaluation.  
Rules select embodiments.  
The world layer performs the change.

This is the **resonance engine** in motion.

🧭 A question to refine the system

Do you want these signals to be **typed** (strict schema, known fields) or **open** (free-form payloads that the registry interprets dynamically)?