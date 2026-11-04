---
id: housegarden
title: House & Garden
name: House & Garden
type: biome
biome_class: hub
physics:
  pressure: 0
  drift: 0
  resonance: 0.5
  collapse: false
weather:
  type: internal
  channel: garden
  humidity: 0.4
  pollen_pulse: 0.2
connections: [herb_room, greenhouse, lagoon, camp]
page:
  html: /housegarden.html
  reveal_conditions:
    - enter
publish: true
draft: false
---

# House & Garden

Hub biome for the Herb Room, Greenhouse, Lagoon, and Camp.