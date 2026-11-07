"""Canonical Flower-specific dominant-contract weighting profiles."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Literal
from .player_contracts import ContractWeights

FlowerArchetype = Literal["threshold", "cloud", "food-fight", "underworld", "survival", "starship"]

CANONICAL_WEIGHTS: dict[FlowerArchetype, ContractWeights] = {
    "threshold": ContractWeights(.45,.25,.10,.05,.15),
    "cloud": ContractWeights(.20,.40,.10,.05,.25),
    "food-fight": ContractWeights(.35,.15,.25,.15,.10),
    "underworld": ContractWeights(.15,.30,.20,.20,.15),
    "survival": ContractWeights(.40,.10,.20,.20,.10),
    "starship": ContractWeights(.50,.20,.10,.15,.05),
}

@dataclass(frozen=True)
class WeightShift:
    pressure: float = 1.; resonance: float = 1.; corridor: float = 1.; collapse: float = 1.; spirit: float = 1.

def flower_weights(archetype: FlowerArchetype, era_shift: WeightShift = WeightShift(), identity_delta: ContractWeights | None = None) -> ContractWeights:
    """Apply configurable era multipliers and identity-evolution deltas."""
    base = CANONICAL_WEIGHTS[archetype]
    delta = identity_delta or ContractWeights(0.,0.,0.,0.,0.)
    return ContractWeights(
        max(0.,base.pressure*era_shift.pressure+delta.pressure),
        max(0.,base.resonance*era_shift.resonance+delta.resonance),
        max(0.,base.corridor*era_shift.corridor+delta.corridor),
        max(0.,base.collapse*era_shift.collapse+delta.collapse),
        max(0.,base.spirit*era_shift.spirit+delta.spirit),
    )
