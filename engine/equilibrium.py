"""Garden-scale equilibrium classification."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from typing import Literal, Sequence

GardenEquilibriumState = Literal["stable", "oscillatory", "chaotic"]


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be a finite value greater than or equal to 0")
    return value


@dataclass(frozen=True)
class EquilibriumConfig:
    stable_gradient_threshold: float
    chaos_gradient_threshold: float

    def __post_init__(self) -> None:
        _non_negative("stable_gradient_threshold", self.stable_gradient_threshold)
        _non_negative("chaos_gradient_threshold", self.chaos_gradient_threshold)
        if self.chaos_gradient_threshold <= self.stable_gradient_threshold:
            raise ValueError("chaos_gradient_threshold must exceed stable_gradient_threshold")


@dataclass(frozen=True)
class GardenEquilibrium:
    state: GardenEquilibriumState
    pressure_gradient: float
    collapse_wave: float
    immunity: float
    resonance_spread: float
    migration_turbulence: float


def classify_garden_equilibrium(
    pressure_gradient: float,
    collapse_wave: float,
    immunity: float,
    resonance_frequencies: Sequence[float],
    migration_currents: Sequence[float],
    config: EquilibriumConfig,
) -> GardenEquilibrium:
    """Classify Garden behavior as stable, oscillatory, or chaotic."""

    _non_negative("pressure_gradient", pressure_gradient)
    _non_negative("collapse_wave", collapse_wave)
    _non_negative("immunity", immunity)
    if not resonance_frequencies:
        raise ValueError("resonance_frequencies must not be empty")
    for frequency in resonance_frequencies:
        _non_negative("resonance frequency", frequency)
    for current in migration_currents:
        if not isfinite(current):
            raise ValueError("migration currents must be finite")
    resonance_spread = max(resonance_frequencies) - min(resonance_frequencies)
    migration_turbulence = (
        max(migration_currents) - min(migration_currents) if migration_currents else 0.0
    )
    if (
        pressure_gradient < config.stable_gradient_threshold
        and collapse_wave < immunity
    ):
        state: GardenEquilibriumState = "stable"
    elif (
        pressure_gradient > config.chaos_gradient_threshold
        and collapse_wave > immunity
    ):
        state = "chaotic"
    else:
        state = "oscillatory"
    return GardenEquilibrium(
        state=state,
        pressure_gradient=pressure_gradient,
        collapse_wave=collapse_wave,
        immunity=immunity,
        resonance_spread=resonance_spread,
        migration_turbulence=migration_turbulence,
    )
