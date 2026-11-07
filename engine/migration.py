"""Cross-Flower migration physics built on pressure and resonance."""

from __future__ import annotations

from dataclasses import dataclass
from math import isclose, isfinite
from typing import Sequence

from .metabolism import ResonanceWave


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be a finite value greater than or equal to 0")
    return value


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be a finite value in the range [0, 1]")
    return value


@dataclass(frozen=True)
class FlowerPull:
    """The net gravitational pull one Flower exerts on a migrating node."""

    flower_id: str
    strength: float

    def __post_init__(self) -> None:
        if not self.flower_id.strip():
            raise ValueError("flower_id must not be empty")
        _non_negative("strength", self.strength)


def calculate_flower_mass(
    node_count: int, average_charge: float, resonance_density: float
) -> float:
    """Calculate Flower mass as node count times charge and resonance density."""

    if isinstance(node_count, bool) or not isinstance(node_count, int) or node_count < 0:
        raise ValueError("node_count must be a non-negative integer")
    _unit_interval("average_charge", average_charge)
    _unit_interval("resonance_density", resonance_density)
    return node_count * average_charge * resonance_density


def calculate_flower_pull(
    flower_id: str,
    mass: float,
    gravitational_constant: float,
    distance: float,
) -> FlowerPull:
    """Calculate inverse-square Flower pull: ``beta * mass / distance²``."""

    if not flower_id.strip():
        raise ValueError("flower_id must not be empty")
    _non_negative("mass", mass)
    _non_negative("gravitational_constant", gravitational_constant)
    if not isfinite(distance) or distance <= 0.0:
        raise ValueError("distance must be a finite value greater than 0")
    return FlowerPull(
        flower_id=flower_id,
        strength=gravitational_constant * mass / distance**2,
    )


def has_escaped(
    effective_pressure: float,
    drift_threshold: float,
    escape_margin: float,
    radial_pressure_gradient: float,
) -> bool:
    """Determine whether pressure has escaped an orbit's envelope.

    Escape requires ``Peff > Td + epsilon`` and an outwardly increasing
    pressure gradient.
    """

    _non_negative("effective_pressure", effective_pressure)
    _non_negative("drift_threshold", drift_threshold)
    _non_negative("escape_margin", escape_margin)
    if not isfinite(radial_pressure_gradient):
        raise ValueError("radial_pressure_gradient must be finite")
    escape_pressure = drift_threshold + escape_margin
    return (
        effective_pressure > escape_pressure
        and not isclose(effective_pressure, escape_pressure)
        and radial_pressure_gradient > 0.0
    )


def is_resonance_corridor(waves: Sequence[ResonanceWave], tolerance: float) -> bool:
    """Determine whether a path's directed waves share a common amplitude."""

    _non_negative("tolerance", tolerance)
    if len(waves) < 2:
        return False
    amplitudes = [wave.amplitude for wave in waves]
    return max(amplitudes) - min(amplitudes) <= tolerance


def select_capture_flower(
    home_flower_id: str,
    pulls: Sequence[FlowerPull],
    effective_pressure: float,
    escape_pressure: float,
) -> str | None:
    """Return the strongest eligible external Flower, if capture can occur.

    A node is capturable only after pressure drops below its escape threshold,
    and only by an external Flower whose pull exceeds the home Flower's pull.
    """

    if not home_flower_id.strip():
        raise ValueError("home_flower_id must not be empty")
    _non_negative("effective_pressure", effective_pressure)
    _non_negative("escape_pressure", escape_pressure)
    if effective_pressure >= escape_pressure:
        return None

    home_pull = next((pull for pull in pulls if pull.flower_id == home_flower_id), None)
    if home_pull is None:
        raise ValueError("pulls must include the home Flower")
    candidates = [
        pull
        for pull in pulls
        if pull.flower_id != home_flower_id and pull.strength > home_pull.strength
    ]
    return max(candidates, key=lambda pull: pull.strength).flower_id if candidates else None
