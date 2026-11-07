"""Collapse-wave resilience calculations for Flowers."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be a finite value greater than or equal to 0")
    return value


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be a finite value in the range [0, 1]")
    return value


@dataclass(frozen=True)
class ImmunityConfig:
    basin_coefficient: float
    cluster_coefficient: float
    halo_coefficient: float
    resonance_coefficient: float
    spirit_coefficient: float
    halo_redirection_coefficient: float

    def __post_init__(self) -> None:
        for name in (
            "basin_coefficient",
            "cluster_coefficient",
            "halo_coefficient",
            "resonance_coefficient",
            "spirit_coefficient",
            "halo_redirection_coefficient",
        ):
            _non_negative(name, getattr(self, name))


@dataclass(frozen=True)
class CollapseImmunity:
    basin: float
    cluster: float
    halo: float
    resonance: float
    spirit: float
    total: float
    remaining_wave: float
    neutralized: bool
    redirection_angle: float


def calculate_collapse_immunity(
    basin_depth: float,
    cluster_cohesion: float,
    halo_angular_velocity: float,
    resonance_field: float,
    spirit_alignment: float,
    collapse_wave_amplitude: float,
    config: ImmunityConfig,
) -> CollapseImmunity:
    """Absorb a collapse wave using the canonical summed resilience law."""

    _non_negative("basin_depth", basin_depth)
    _non_negative("cluster_cohesion", cluster_cohesion)
    if not isfinite(halo_angular_velocity):
        raise ValueError("halo_angular_velocity must be finite")
    _unit_interval("resonance_field", resonance_field)
    _unit_interval("spirit_alignment", spirit_alignment)
    _non_negative("collapse_wave_amplitude", collapse_wave_amplitude)
    basin = config.basin_coefficient * basin_depth
    cluster = config.cluster_coefficient * cluster_cohesion
    halo = config.halo_coefficient * halo_angular_velocity**2
    resonance = config.resonance_coefficient * resonance_field
    spirit = config.spirit_coefficient * spirit_alignment
    total = basin + cluster + halo + resonance + spirit
    return CollapseImmunity(
        basin=basin,
        cluster=cluster,
        halo=halo,
        resonance=resonance,
        spirit=spirit,
        total=total,
        remaining_wave=max(0.0, collapse_wave_amplitude - total),
        neutralized=collapse_wave_amplitude < total,
        redirection_angle=config.halo_redirection_coefficient * halo_angular_velocity,
    )
