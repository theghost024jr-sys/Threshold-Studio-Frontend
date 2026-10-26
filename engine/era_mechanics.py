"""Configurable era-dependent player and field mechanics."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from typing import Literal

from .players import PlayerInfluenceConfig

EraMechanic = Literal["stable", "oscillatory", "chaotic", "collapse", "rebirth"]


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be a finite value greater than or equal to 0")
    return value


@dataclass(frozen=True)
class EraMechanicsProfile:
    era: EraMechanic
    navigation_multiplier: float
    corridor_multiplier: float
    collapse_multiplier: float
    halo_multiplier: float
    player_pressure_multiplier: float
    player_resonance_multiplier: float

    def __post_init__(self) -> None:
        for name in (
            "navigation_multiplier", "corridor_multiplier", "collapse_multiplier",
            "halo_multiplier", "player_pressure_multiplier",
            "player_resonance_multiplier",
        ):
            _non_negative(name, getattr(self, name))


def apply_era_mechanics(
    profile: EraMechanicsProfile,
    velocity: tuple[float, float],
    player_config: PlayerInfluenceConfig,
) -> tuple[tuple[float, float], PlayerInfluenceConfig]:
    """Scale navigation and player force coefficients with an era profile."""

    if not all(isfinite(component) for component in velocity):
        raise ValueError("velocity must contain finite components")
    return (
        (velocity[0] * profile.navigation_multiplier, velocity[1] * profile.navigation_multiplier),
        PlayerInfluenceConfig(
            pressure_coefficient=player_config.pressure_coefficient * profile.player_pressure_multiplier,
            resonance_coefficient=player_config.resonance_coefficient * profile.player_resonance_multiplier,
            slit_coefficient=player_config.slit_coefficient,
            corridor_coefficient=player_config.corridor_coefficient * profile.corridor_multiplier,
            collapse_damping_coefficient=player_config.collapse_damping_coefficient * profile.collapse_multiplier,
            rotation_coefficient=player_config.rotation_coefficient * profile.halo_multiplier,
            identity_coefficient=player_config.identity_coefficient,
        ),
    )
