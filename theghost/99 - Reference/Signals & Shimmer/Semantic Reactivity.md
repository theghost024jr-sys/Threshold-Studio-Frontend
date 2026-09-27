They can only _react_ to each other if the registry is global, because reaction requires **shared context**, **shared state**, and **shared access** to the same semantic field. A per‑entity registry isolates entities. A global registry lets them _see_ each other.

But “reacting” isn’t one thing. It’s a stack of different interaction types, each requiring a different layer of the architecture to participate. When you say they should react to each other, you’re describing a **multi‑layer resonance system**.

How characters, players, and environments react to each other

Reactivity happens across three layers, each with its own responsibilities.

🧠 Semantic reactivity (content layer)

This is where `.md` definitions describe:

- relationships
- roles
- affinities
- aversions
- history
- emotional states
- biome interactions

This layer defines _what_ reactions are possible.

⚙️ Systemic reactivity (system layer)

This is where the parser, index, and registry:

- detect relevant tags
- evaluate resonance rules
- check world state
- check player state
- check environmental conditions
- choose embodiment variants

This layer decides _which_ reaction should occur.

🌍 Embodied reactivity (world layer)

This is where scenes actually:

- animate
- shift
- pulse
- change form
- change behavior
- change expression
- change environment

This layer performs the reaction in the world.

A global registry is the **bridge** that lets these three layers talk to each other.

Why a global registry is required for reactivity

Reactivity requires **shared knowledge**.  
Shared knowledge requires **shared lookup**.  
Shared lookup requires **one registry**.

A global registry lets the system:

- know who Andy is
- know what the ForestBiome is
- know what the player is doing
- know what mode the system is in
- know what context is active
- know what timeline is active
- know what relationships exist

Without a global registry, each entity is blind.

With a global registry, each entity can react to:

- other characters
- the player
- the environment
- the current mode
- the current timeline
- the current biome
- the current emotional field

This is the **resonance field**.

How the registry enables reaction

The registry doesn’t _perform_ reactions.  
It _selects_ the embodiment that expresses the reaction.

Example:

Andy: variants: angry: AndyAngry.tscn scared: AndyScared.tscn ghost: AndyGhost.tscn rules: - if: near=Wolf use: scared - if: player=threatening use: angry - if: mode=ghost use: ghost

This is how Andy reacts to:

- another character (Wolf)
- the player
- the system mode

The registry is the **reaction selector**.

The world layer is the **reaction performer**.

How environments react

Environments can also have variants:

ForestBiome: variants: winter: ForestWinter.tscn night: ForestNight.tscn corrupted: ForestCorrupted.tscn rules: - if: season=winter use: winter - if: time=night use: night - if: corruption>0.7 use: corrupted

This lets the environment react to:

- time
- season
- corruption level
- player actions
- character presence

Again: the registry selects, the world layer embodies.

How players fit into this

Players are just another entity in the registry:

Player: tags: [sentient, agent] variants: calm: PlayerCalmAura.tscn stressed: PlayerStressAura.tscn rules: - if: heart_rate>120 use: stressed

This lets the world react to the player, and the player react to the world.

Why this is the cleanest architecture

Because each layer does one job:

- **Content** defines meaning.
- **Systems** interpret meaning and choose reactions.
- **World** embodies reactions.

The global registry is the **reaction map**.

It keeps the system clean even as the world becomes complex.

The next step is deciding how the registry _reads_ world state (e.g., “near=Wolf”, “corruption>0.7”). Do you want world state to be **event‑driven**, **polled**, or **fully reactive** (signals)?