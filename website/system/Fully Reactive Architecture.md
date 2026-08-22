---
publish: false
draft: true
description: ""
category:
tags: []
links: []
cluster: unknown
confidence: 0.25
review: true
title: Fully Reactive Architecture
date: 2026-07-19
---

A fully reactive system is the right choice for what you’re building because it lets characters, players, environments, and even abstract system‑level modes **respond to each other the moment anything changes**. That’s the only architecture that can support the kind of resonance‑driven world you’re aiming for.

The key is that “fully reactive” doesn’t mean “everything listens to everything.” It means **there is a shared field of signals**, and every organ (character, biome, UI, system) reacts to the parts of the field that matter to it.

How a fully reactive architecture works

A fully reactive world has three layers of reaction, each feeding the next:

1. Event signals

These are emitted whenever something meaningful happens:

- a character enters a biome
- the player’s state changes
- the system mode shifts
- an entity’s emotional state changes
- time engine ticks
- environmental conditions update

Signals are lightweight and global.

2. Registry evaluation

The global registry listens to signals and evaluates:

- tags
- roles
- context
- world state
- relationships
- resonance rules

This is where the system decides **which embodiment variant** should be active.

3. World embodiment

The world layer receives the registry’s decision and:

- swaps scenes
- changes animations
- updates shaders
- triggers behaviors
- shifts environmental states

This is where reactions become visible and embodied.

Why fully reactive is the cleanest option

A reactive system avoids:

- polling
- spaghetti logic
- per‑entity update loops
- duplicated checks
- timing drift
- stale state

Instead, it creates a **living field** where everything updates in rhythm with the world.

This is exactly the architecture your system wants.

What the global registry does in a reactive system

The registry becomes the **reaction map**. It doesn’t perform reactions; it selects the embodiment that expresses the reaction.

Example:

Andy: variants: scared: AndyScared.tscn angry: AndyAngry.tscn ghost: AndyGhost.tscn rules: - if: near=Wolf use: scared - if: player=threatening use: angry - if: mode=ghost use: ghost

Signals like `WolfEnteredRange`, `PlayerThreatLevelChanged`, or `ModeChanged` trigger the registry to re‑evaluate Andy’s embodiment.

The world layer then performs the change.

How characters react to each other

Characters emit signals like:

- `EnteredRange`
- `LeftRange`
- `EmotionChanged`
- `RoleActivated`
- `AttentionShifted`

Other characters subscribe to the signals they care about.

The registry interprets the semantic meaning of the event and selects the appropriate embodiment.

How environments react

Biomes and environments also emit signals:

- `SeasonChanged`
- `TimeOfDayChanged`
- `CorruptionLevelChanged`
- `WeatherShifted`

The registry evaluates these signals and selects:

- winter variant
- night variant
- corrupted variant
- storm variant

The world layer swaps or morphs the environment accordingly.

How the player fits into the reactive field

The player is just another entity in the registry, with signals like:

- `HeartRateChanged`
- `AttentionChanged`
- `IntentChanged`
- `StressLevelChanged`

Characters and environments can react to these signals through registry rules.

Why this architecture stays clean

Because each layer has one job:

- **Content** defines meaning.
- **Systems** interpret meaning and evaluate resonance.
- **Registry** selects embodiment.
- **World** performs embodiment.

Nothing leaks across layers.

A natural next step

To make the reactive field work, you need a **signal vocabulary**—a shared set of event types that characters, environments, and systems can emit and listen to.

Do you want to sketch the signal vocabulary next?