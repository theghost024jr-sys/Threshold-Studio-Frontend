"""Binding Layer Integrity Index (BLII) as the vault defines it.

Vault source: theghost/01 - Physics/Binding/Binding Layer Integrity Index.md.
The note fixes the five components, the 0-1 scale, the weight ordering, the
interpretation bands and the failure signatures. Its numeric formula was lost
from the note, so weights are never defaulted here: the caller must supply
them and they are checked against the ordering the note does state.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from math import isclose, isfinite

COMPONENTS = ("BLS", "PC", "CDS", "PRH", "TOR")


class IntegrityBand(str, Enum):
    OPTIMAL = "optimal"
    STABLE_BUT_VULNERABLE = "stable_but_vulnerable"
    STRAINED = "strained"
    HIGH_INSTABILITY = "high_instability"
    CRITICAL_FAILURE = "critical_failure"


class CascadeProbability(str, Enum):
    NEGLIGIBLE = "negligible"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    EXTREME = "extreme"


FAILURE_SIGNATURES = {
    "BLS": "binding_collapse",
    "PC": "phase_collapse",
    "CDS": "corridor_collapse",
    "PRH": "pressure_collapse",
    "TOR": "organ_collapse",
}

_BANDS = (
    (0.85, IntegrityBand.OPTIMAL, CascadeProbability.NEGLIGIBLE),
    (0.70, IntegrityBand.STABLE_BUT_VULNERABLE, CascadeProbability.LOW),
    (0.55, IntegrityBand.STRAINED, CascadeProbability.MODERATE),
    (0.40, IntegrityBand.HIGH_INSTABILITY, CascadeProbability.HIGH),
    (0.0, IntegrityBand.CRITICAL_FAILURE, CascadeProbability.EXTREME),
)

# Binding Layer Upgrade Path: Tier 2 needs BLII > 0.55, Tier 4 needs BLII > 0.75.
TIER_2_MINIMUM = 0.55
TIER_4_MINIMUM = 0.75


@dataclass(frozen=True)
class BindingIntegrity:
    index: float
    band: IntegrityBand
    cascade_probability: CascadeProbability
    weakest_component: str
    failure_signature: str | None


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be finite and in the range [0, 1]")
    return value


def _validate_weights(weights: dict[str, float]) -> None:
    if set(weights) != set(COMPONENTS):
        raise ValueError(f"weights must define exactly {COMPONENTS}")
    for name in COMPONENTS:
        value = weights[name]
        if not isfinite(value) or value <= 0.0:
            raise ValueError(f"weight {name} must be finite and positive")
    if not isclose(sum(weights.values()), 1.0, abs_tol=1e-9):
        raise ValueError("weights must sum to 1")
    primary = min(weights["BLS"], weights["PC"])
    secondary = (weights["CDS"], weights["PRH"])
    if primary < max(secondary) or min(secondary) < weights["TOR"]:
        raise ValueError(
            "weights must keep BLS and PC above CDS and PRH, and TOR lowest, per the vault note"
        )


def classify(index: float) -> tuple[IntegrityBand, CascadeProbability]:
    _unit_interval("index", index)
    for minimum, band, probability in _BANDS:
        if index >= minimum:
            return band, probability
    raise AssertionError("unreachable")


def evaluate_binding_integrity(
    components: dict[str, float], weights: dict[str, float]
) -> BindingIntegrity:
    if set(components) != set(COMPONENTS):
        raise ValueError(f"components must define exactly {COMPONENTS}")
    for name in COMPONENTS:
        _unit_interval(name, components[name])
    _validate_weights(weights)

    index = sum(components[name] * weights[name] for name in COMPONENTS)
    band, probability = classify(index)
    weakest = min(COMPONENTS, key=lambda name: (components[name], COMPONENTS.index(name)))
    degraded = band in (
        IntegrityBand.STRAINED,
        IntegrityBand.HIGH_INSTABILITY,
        IntegrityBand.CRITICAL_FAILURE,
    )
    return BindingIntegrity(
        index=index,
        band=band,
        cascade_probability=probability,
        weakest_component=weakest,
        failure_signature=FAILURE_SIGNATURES[weakest] if degraded else None,
    )
