"""Canonical dominant-contract capability profiles."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Literal
from .player_contracts import ContractType

RiskProfile = Literal["low", "medium", "medium-high", "high", "variable"]

@dataclass(frozen=True)
class CapabilityProfile:
    movement: str
    corridors: str
    identity: str
    collapse: str
    spirit: str
    risk: RiskProfile

CAPABILITIES: dict[ContractType, CapabilityProfile] = {
    "stabilization": CapabilityProfile("smooth-predictable", "stable-safe", "strong-lock", "dampen", "weak", "low"),
    "resonance": CapabilityProfile("wave-surfing", "harmonic", "symbolic-lock", "invert-or-redirect", "medium", "medium"),
    "migration": CapabilityProfile("fast-directional", "bent-created", "basin-hopping", "can-trigger", "weak", "medium-high"),
    "collapse": CapabilityProfile("turbulent-powerful", "hazard", "identity-shedding", "surf-redirect", "weak", "high"),
    "spirit": CapabilityProfile("metaphysical-drift", "spirit-aligned", "amplified", "polarity-dependent", "strong", "variable"),
}

def get_capability_profile(mode: ContractType) -> CapabilityProfile:
    """Return the canonical gameplay affordances for a dominant contract mode."""
    return CAPABILITIES[mode]
