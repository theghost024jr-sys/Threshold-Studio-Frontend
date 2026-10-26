"""Collapse-cascade physics for propagating pressure failure."""

from __future__ import annotations

from dataclasses import dataclass, replace
from math import exp, isfinite
from typing import Sequence

from .basins import IdentityBasin
from .clusters import NodeOrbitProfile
from .metabolism import MetabolicState

Vector2 = tuple[float, float]


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
class CollapseCascadeConfig:
    """Coefficients for wave-driven collapse propagation and its field effects."""

    gradient_threshold: float
    wave_amplification: float
    decay_constant: float
    slit_failure: float
    charge_drain: float
    resonance_inversion: float
    migration_coefficient: float
    basin_curvature_loss: float
    halo_failure_threshold: float

    def __post_init__(self) -> None:
        for name in (
            "gradient_threshold",
            "wave_amplification",
            "decay_constant",
            "slit_failure",
            "charge_drain",
            "resonance_inversion",
            "migration_coefficient",
            "basin_curvature_loss",
            "halo_failure_threshold",
        ):
            _non_negative(name, getattr(self, name))
        _unit_interval("slit_failure", self.slit_failure)
        _unit_interval("charge_drain", self.charge_drain)
        _unit_interval("resonance_inversion", self.resonance_inversion)


@dataclass(frozen=True)
class CollapseWave:
    """A non-negative collapse pressure deficit traveling through a Flower."""

    amplitude: float
    direction: Vector2

    def __post_init__(self) -> None:
        _non_negative("amplitude", self.amplitude)
        _vector("direction", self.direction)


@dataclass(frozen=True)
class CollapseEffects:
    """The local metabolic and harmonic state caused by a collapse wave."""

    state: MetabolicState
    resonance_phase: float
    migration_vector: Vector2


def ignite_collapse_wave(
    collapsed_effective_pressure: float,
    collapse_threshold: float,
    neighbor_effective_pressure: float,
    direction: Vector2,
    config: CollapseCascadeConfig,
) -> CollapseWave | None:
    """Emit a wave when a collapsed node creates a critical neighbor gradient."""

    _non_negative("collapsed_effective_pressure", collapsed_effective_pressure)
    _non_negative("collapse_threshold", collapse_threshold)
    _non_negative("neighbor_effective_pressure", neighbor_effective_pressure)
    _vector("direction", direction)
    gradient = abs(neighbor_effective_pressure - collapsed_effective_pressure)
    if (
        collapsed_effective_pressure >= collapse_threshold
        or gradient <= config.gradient_threshold
    ):
        return None
    return CollapseWave(
        amplitude=config.wave_amplification * gradient,
        direction=direction,
    )


def propagate_collapse_wave(
    wave: CollapseWave,
    source_resonance_field: float,
    distance: float,
    config: CollapseCascadeConfig,
) -> CollapseWave:
    """Propagate a collapse deficit via resonance and exponential decay."""

    _unit_interval("source_resonance_field", source_resonance_field)
    _non_negative("distance", distance)
    return CollapseWave(
        amplitude=wave.amplitude
        * source_resonance_field
        * exp(-config.decay_constant * distance),
        direction=wave.direction,
    )


def collapses_from_wave(
    effective_pressure: float,
    wave: CollapseWave,
    collapse_threshold: float,
) -> bool:
    """Return whether a wave pressure deficit pushes a node below collapse."""

    _non_negative("effective_pressure", effective_pressure)
    _non_negative("collapse_threshold", collapse_threshold)
    return effective_pressure - wave.amplitude < collapse_threshold


def apply_collapse_effects(
    state: MetabolicState,
    wave: CollapseWave,
    corridor_vector: Vector2,
    config: CollapseCascadeConfig,
) -> CollapseEffects:
    """Apply slit failure, charge drain, inversion phase, and migration bias."""

    _vector("corridor_vector", corridor_vector)
    return CollapseEffects(
        state=MetabolicState(
            charge=max(0.0, state.charge - config.charge_drain),
            slit_openness=max(0.0, state.slit_openness - config.slit_failure),
            resonance=state.resonance,
            circuit_mirror_gain=state.circuit_mirror_gain,
            target_charge=state.target_charge,
        ),
        resonance_phase=-config.resonance_inversion,
        migration_vector=(
            corridor_vector[0]
            + config.migration_coefficient * wave.amplitude * wave.direction[0],
            corridor_vector[1]
            + config.migration_coefficient * wave.amplitude * wave.direction[1],
        ),
    )


def collapse_basin(
    basin: IdentityBasin,
    center_wave_amplitude: float,
    rim_wave_amplitude: float,
    config: CollapseCascadeConfig,
) -> IdentityBasin:
    """Reduce basin pressure samples and flatten curvature under collapse."""

    _non_negative("center_wave_amplitude", center_wave_amplitude)
    _non_negative("rim_wave_amplitude", rim_wave_amplitude)
    center_pressure = max(0.0, basin.center_pressure - center_wave_amplitude)
    rim_pressure = max(center_pressure, basin.rim_pressure - rim_wave_amplitude)
    curvature = basin.curvature * max(
        0.0,
        1.0 - config.basin_curvature_loss * center_wave_amplitude,
    )
    return replace(
        basin,
        center_pressure=center_pressure,
        rim_pressure=rim_pressure,
        curvature=curvature,
    )


def halo_has_collapsed(
    angular_velocity: float,
    wave: CollapseWave,
    halo_failure_threshold: float,
) -> bool:
    """Return whether rotational turbulence exceeds the halo-collapse boundary."""

    if not isfinite(angular_velocity):
        raise ValueError("angular_velocity must be finite")
    _non_negative("halo_failure_threshold", halo_failure_threshold)
    return abs(angular_velocity) * wave.amplitude > halo_failure_threshold


def order_cluster_collapse(members: Sequence[NodeOrbitProfile]) -> list[NodeOrbitProfile]:
    """Order a cluster's members from outermost orbit to core for collapse."""

    return sorted(members, key=lambda member: member.orbit_radius, reverse=True)
