"""First-class player forces applied to Garden physics."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite


def _unit(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be a finite value in the range [0, 1]")
    return value


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be a finite value greater than or equal to 0")
    return value


@dataclass(frozen=True)
class PlayerForce:
    charge: float
    alignment: float
    resonance_frequency: float

    def __post_init__(self) -> None:
        _unit("charge", self.charge)
        _unit("alignment", self.alignment)
        _non_negative("resonance_frequency", self.resonance_frequency)


@dataclass(frozen=True)
class PlayerInfluenceConfig:
    pressure_coefficient: float
    resonance_coefficient: float
    slit_coefficient: float
    corridor_coefficient: float
    collapse_damping_coefficient: float
    rotation_coefficient: float
    identity_coefficient: float

    def __post_init__(self) -> None:
        for name in (
            "pressure_coefficient", "resonance_coefficient", "slit_coefficient",
            "corridor_coefficient", "collapse_damping_coefficient",
            "rotation_coefficient", "identity_coefficient",
        ):
            _non_negative(name, getattr(self, name))


@dataclass(frozen=True)
class PlayerInfluence:
    pressure_emission: float
    resonance_wave: float
    slit_openness: float
    garden_pressure: float
    basin_pressure: float
    corridor_curvature: float
    collapse_wave: float
    halo_angular_velocity: float
    identity_delta: float


def apply_player_influence(
    player: PlayerForce,
    config: PlayerInfluenceConfig,
    *,
    slit_openness: float,
    garden_pressure: float,
    basin_pressure: float,
    corridor_curvature: float,
    collapse_wave: float,
    halo_angular_velocity: float,
) -> PlayerInfluence:
    """Apply canonical player emissions to local Flower and Garden fields."""

    _unit("slit_openness", slit_openness)
    for name, value in (
        ("garden_pressure", garden_pressure), ("basin_pressure", basin_pressure),
        ("collapse_wave", collapse_wave),
    ):
        _non_negative(name, value)
    if not isfinite(corridor_curvature) or not isfinite(halo_angular_velocity):
        raise ValueError("corridor_curvature and halo_angular_velocity must be finite")
    pressure = config.pressure_coefficient * player.charge
    wave = config.resonance_coefficient * player.alignment
    return PlayerInfluence(
        pressure_emission=pressure,
        resonance_wave=wave,
        slit_openness=min(1.0, slit_openness * (1.0 + config.slit_coefficient * player.alignment)),
        garden_pressure=garden_pressure + pressure,
        basin_pressure=basin_pressure + pressure,
        corridor_curvature=corridor_curvature + config.corridor_coefficient * wave,
        collapse_wave=max(0.0, collapse_wave - config.collapse_damping_coefficient * player.charge),
        halo_angular_velocity=halo_angular_velocity + config.rotation_coefficient * wave,
        identity_delta=config.identity_coefficient * (pressure + wave),
    )
