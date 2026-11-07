"""Garden-scale aggregation of multi-Flower physics."""

from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations
from math import isfinite
from typing import Sequence

from .interactions import FlowerField


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be a finite value greater than or equal to 0")
    return value


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be a finite value in the range [0, 1]")
    return value


@dataclass(frozen=True)
class GardenFlowerState:
    """The world-scale contribution supplied by one Flower."""

    field: FlowerField
    immunity: float

    def __post_init__(self) -> None:
        _non_negative("immunity", self.immunity)


@dataclass(frozen=True)
class GardenConfig:
    """World-level interaction thresholds and spirit scaling."""

    resonance_tolerance: float
    collapse_threshold: float
    spirit_pressure_coefficient: float

    def __post_init__(self) -> None:
        _non_negative("resonance_tolerance", self.resonance_tolerance)
        _non_negative("collapse_threshold", self.collapse_threshold)
        _non_negative("spirit_pressure_coefficient", self.spirit_pressure_coefficient)


@dataclass(frozen=True)
class GardenDynamics:
    """The aggregate, scheduler-independent state of the Garden manifold."""

    pressure: float
    rotation: float
    immunity: float
    remaining_collapse_wave: float
    collapse_contagion: bool
    resonant_alliances: tuple[tuple[str, str], ...]
    migration_current: float


def is_macro_basin(center_pressure: float, neighboring_pressures: Sequence[float]) -> bool:
    """Return whether a sampled Garden pressure point is a strict macro minimum."""

    _non_negative("center_pressure", center_pressure)
    if not neighboring_pressures:
        raise ValueError("neighboring_pressures must not be empty")
    for pressure in neighboring_pressures:
        _non_negative("neighboring pressure", pressure)
    return all(center_pressure < pressure for pressure in neighboring_pressures)


def calculate_garden_dynamics(
    flowers: Sequence[GardenFlowerState],
    migration_currents: Sequence[float],
    collapse_wave_amplitude: float,
    macro_spirit_alignment: float,
    config: GardenConfig,
) -> GardenDynamics:
    """Superpose Flower fields into one Garden-scale pressure manifold."""

    if not flowers:
        raise ValueError("flowers must not be empty")
    _non_negative("collapse_wave_amplitude", collapse_wave_amplitude)
    _unit_interval("macro_spirit_alignment", macro_spirit_alignment)
    for current in migration_currents:
        if not isfinite(current):
            raise ValueError("migration currents must be finite")

    pressure = sum(flower.field.pressure for flower in flowers) * (
        1.0 + config.spirit_pressure_coefficient * macro_spirit_alignment
    )
    immunity = sum(flower.immunity for flower in flowers)
    remaining_collapse_wave = max(0.0, collapse_wave_amplitude - immunity)
    alliances = tuple(
        (first.field.flower_id, second.field.flower_id)
        for first, second in combinations(flowers, 2)
        if abs(
            first.field.resonance_frequency - second.field.resonance_frequency
        )
        < config.resonance_tolerance
    )
    return GardenDynamics(
        pressure=pressure,
        rotation=sum(flower.field.halo_angular_velocity for flower in flowers),
        immunity=immunity,
        remaining_collapse_wave=remaining_collapse_wave,
        collapse_contagion=remaining_collapse_wave > config.collapse_threshold,
        resonant_alliances=alliances,
        migration_current=sum(migration_currents),
    )
