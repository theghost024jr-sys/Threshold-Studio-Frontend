"""Directed identity relocation across basins, Flowers, and eras."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from typing import Literal

from .identity_resonance import IdentityResonanceSignature

MigrationMode = Literal["basin", "flower", "era"]
CorridorGeometry = Literal["direct", "spiral", "liminal"]


def _unit(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be finite and in the range [0, 1]")
    return value


def _non_empty(name: str, value: str) -> str:
    if not value.strip():
        raise ValueError(f"{name} must not be empty")
    return value


@dataclass(frozen=True)
class IdentityMigrationLocation:
    flower_id: str
    basin_id: str
    era_id: str

    def __post_init__(self) -> None:
        _non_empty("flower_id", self.flower_id)
        _non_empty("basin_id", self.basin_id)
        _non_empty("era_id", self.era_id)


@dataclass(frozen=True)
class IdentityMigrationCandidate:
    location: IdentityMigrationLocation
    resonance: IdentityResonanceSignature
    corridor_accessibility: float
    flower_compatibility: float
    basin_adjacency: float
    corridor_geometry: CorridorGeometry

    def __post_init__(self) -> None:
        for name in (
            "corridor_accessibility",
            "flower_compatibility",
            "basin_adjacency",
        ):
            _unit(name, getattr(self, name))


@dataclass(frozen=True)
class IdentityMigrationConfig:
    collapse_shift_threshold: float
    frequency_tolerance: float
    symmetry_tolerance: float
    amplitude_threshold: float
    corridor_threshold: float
    flower_compatibility_threshold: float

    def __post_init__(self) -> None:
        for name in (
            "collapse_shift_threshold",
            "frequency_tolerance",
            "symmetry_tolerance",
            "amplitude_threshold",
            "corridor_threshold",
            "flower_compatibility_threshold",
        ):
            _unit(name, getattr(self, name))


@dataclass(frozen=True)
class IdentityMigrationDecision:
    permitted: bool
    probability: float
    mode: MigrationMode | None
    corridor_geometry: CorridorGeometry | None
    inhibitors: tuple[str, ...]


def evaluate_identity_migration(
    *,
    current: IdentityMigrationLocation,
    signature: IdentityResonanceSignature,
    candidate: IdentityMigrationCandidate,
    uncertainty: float,
    collapse_aftermath: float,
    config: IdentityMigrationConfig,
) -> IdentityMigrationDecision:
    """Evaluate the canonical collapse, harmonic, corridor, and uncertainty gates."""

    _unit("uncertainty", uncertainty)
    _unit("collapse_aftermath", collapse_aftermath)
    frequency_distance = abs(signature.frequency - candidate.resonance.frequency)
    symmetry_distance = abs(signature.symmetry - candidate.resonance.symmetry)
    probability = min(
        1.0,
        signature.amplitude
        * candidate.resonance.symmetry
        * candidate.corridor_accessibility
        * (1.0 - uncertainty),
    )
    inhibitors: list[str] = []
    if collapse_aftermath <= config.collapse_shift_threshold:
        inhibitors.append("no_collapse_aftermath")
    if frequency_distance > config.frequency_tolerance:
        inhibitors.append("frequency_mismatch")
    if symmetry_distance > config.symmetry_tolerance:
        inhibitors.append("symmetry_mismatch")
    if signature.amplitude <= config.amplitude_threshold:
        inhibitors.append("insufficient_amplitude")
    if candidate.corridor_accessibility <= config.corridor_threshold:
        inhibitors.append("corridor_closed")
    if candidate.flower_compatibility <= config.flower_compatibility_threshold:
        inhibitors.append("flower_incompatible")
    if candidate.basin_adjacency == 0.0:
        inhibitors.append("basin_not_adjacent")
    if inhibitors:
        return IdentityMigrationDecision(
            permitted=False,
            probability=probability,
            mode=None,
            corridor_geometry=None,
            inhibitors=tuple(inhibitors),
        )
    return IdentityMigrationDecision(
        permitted=True,
        probability=probability,
        mode=_migration_mode(current, candidate.location),
        corridor_geometry=candidate.corridor_geometry,
        inhibitors=(),
    )


def _migration_mode(
    current: IdentityMigrationLocation,
    destination: IdentityMigrationLocation,
) -> MigrationMode:
    if current.era_id != destination.era_id:
        return "era"
    if current.flower_id != destination.flower_id:
        return "flower"
    return "basin"
