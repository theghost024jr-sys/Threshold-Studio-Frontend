"""Pairwise Flower field interactions for a multi-Flower ecosystem."""

from __future__ import annotations

from dataclasses import dataclass
from math import isclose, isfinite

Vector2 = tuple[float, float]


def _finite(name: str, value: float) -> float:
    if not isfinite(value):
        raise ValueError(f"{name} must be finite")
    return value


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be a finite value greater than or equal to 0")
    return value


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be a finite value in the range [0, 1]")
    return value


def _vector(name: str, value: Vector2) -> Vector2:
    if len(value) != 2 or not all(isfinite(component) for component in value):
        raise ValueError(f"{name} must contain two finite components")
    return value


@dataclass(frozen=True)
class FlowerField:
    """The local properties one Flower projects into a shared world region."""

    flower_id: str
    pressure: float
    resonance_frequency: float
    basin_pressure: float
    halo_angular_velocity: float
    spirit_alignment: float

    def __post_init__(self) -> None:
        if not self.flower_id.strip():
            raise ValueError("flower_id must not be empty")
        _non_negative("pressure", self.pressure)
        _non_negative("resonance_frequency", self.resonance_frequency)
        _non_negative("basin_pressure", self.basin_pressure)
        _finite("halo_angular_velocity", self.halo_angular_velocity)
        _unit_interval("spirit_alignment", self.spirit_alignment)


@dataclass(frozen=True)
class FlowerInteractionConfig:
    """Thresholds and couplings for pairwise Flower interaction."""

    frequency_tolerance: float
    basin_overlap_tolerance: float
    halo_coupling: float
    collapse_cross_threshold: float
    spirit_pressure_coefficient: float

    def __post_init__(self) -> None:
        for name in (
            "frequency_tolerance",
            "basin_overlap_tolerance",
            "halo_coupling",
            "collapse_cross_threshold",
            "spirit_pressure_coefficient",
        ):
            _non_negative(name, getattr(self, name))


@dataclass(frozen=True)
class FlowerInteraction:
    """The measurable relationship between two Flower fields."""

    net_pressure: float
    harmonized: bool
    basin_conflict: bool
    halo_angular_delta: float
    collapse_contagion: bool
    source_effective_pressure: float
    target_effective_pressure: float


def calculate_migration_flow(
    migration_vector: Vector2,
    corridor_normal: Vector2,
    node_density: float,
    area: float,
) -> float:
    """Approximate ``integral(v_migration dot rho_nodes dA)`` over one region."""

    _vector("migration_vector", migration_vector)
    _vector("corridor_normal", corridor_normal)
    _non_negative("node_density", node_density)
    _non_negative("area", area)
    return (
        migration_vector[0] * corridor_normal[0]
        + migration_vector[1] * corridor_normal[1]
    ) * node_density * area


def evaluate_flower_interaction(
    source: FlowerField,
    target: FlowerField,
    collapse_wave_amplitude: float,
    config: FlowerInteractionConfig,
) -> FlowerInteraction:
    """Evaluate the canonical pressure, harmonic, basin, halo, and collapse laws."""

    _non_negative("collapse_wave_amplitude", collapse_wave_amplitude)
    source_effective_pressure = source.pressure * (
        1.0 + config.spirit_pressure_coefficient * source.spirit_alignment
    )
    target_effective_pressure = target.pressure * (
        1.0 + config.spirit_pressure_coefficient * target.spirit_alignment
    )
    return FlowerInteraction(
        net_pressure=source_effective_pressure + target_effective_pressure,
        harmonized=(
            abs(source.resonance_frequency - target.resonance_frequency)
            < config.frequency_tolerance
        ),
        basin_conflict=(
            abs(source.basin_pressure - target.basin_pressure)
            <= config.basin_overlap_tolerance
            or isclose(
                abs(source.basin_pressure - target.basin_pressure),
                config.basin_overlap_tolerance,
            )
        ),
        halo_angular_delta=config.halo_coupling
        * (source.halo_angular_velocity - target.halo_angular_velocity),
        collapse_contagion=collapse_wave_amplitude > config.collapse_cross_threshold,
        source_effective_pressure=source_effective_pressure,
        target_effective_pressure=target_effective_pressure,
    )
