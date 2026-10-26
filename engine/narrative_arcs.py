"""Interference-driven emergent narrative arcs."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Literal
from .player_contracts import ContractType

EraBias = Literal["stable","oscillatory","chaotic","collapse","rebirth"]
@dataclass(frozen=True)
class NarrativeArc:
    kind: ContractType; strength: float; propagation: float; era_bias: EraBias; active: bool
_ERA: dict[ContractType,EraBias]={"stabilization":"stable","resonance":"oscillatory","migration":"chaotic","collapse":"collapse","spirit":"rebirth"}
def form_narrative_arc(kind: ContractType, interference_strength: float, arc_threshold: float, decay_threshold: float, corridor_connectivity: float) -> NarrativeArc:
    """Ignite, propagate, or decay a physics-derived narrative arc."""
    if min(interference_strength,arc_threshold,decay_threshold,corridor_connectivity)<0: raise ValueError("arc values must be non-negative")
    active=interference_strength>arc_threshold and interference_strength>=decay_threshold
    return NarrativeArc(kind,interference_strength,interference_strength*corridor_connectivity,_ERA[kind],active)
