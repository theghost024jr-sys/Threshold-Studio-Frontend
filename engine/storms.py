"""Environmental storm physics driven by pressure discontinuities."""

from __future__ import annotations

from dataclasses import dataclass
from math import exp, isfinite
from typing import Literal

Vector2 = tuple[float, float]
ClusterStormInteraction = Literal["binding", "shattering", "none"]


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
class StormConfig:
    """Thresholds and coefficients governing a Flower's storm field."""

    pressure_gradient_threshold: float
    amplification_coefficient: float
    decay_constant: float
    rotation_coefficient: float
    slit_coefficient: float
    migration_coefficient: float
    cluster_wave_tolerance: float

    def __post_init__(self) -> None:
        for name in (
            "pressure_gradient_threshold",
            "amplification_coefficient",
            "decay_constant",
            "rotation_coefficient",
            "slit_coefficient",
            "migration_coefficient",
            "cluster_wave_tolerance",
        ):
            _non_negative(name, getattr(self, name))


@dataclass(frozen=True)
class StormWave:
    """A directional wave burst emitted by a storm pressure discontinuity."""

    amplitude: float
    direction: Vector2

    def __post_init__(self) -> None:
        if not isfinite(self.amplitude):
            raise ValueError("amplitude must be finite")
        _vector("direction", self.direction)


@dataclass(frozen=True)
class StormEffects:
    """The composable downstream effects of a propagated storm wave."""

    wave: StormWave
    halo_angular_acceleration: float
    slit_delta: float
    migration_vector: Vector2
    cluster_interaction: ClusterStormInteraction


def ignite_storm(
    pressure_gradient: float,
    direction: Vector2,
    config: StormConfig,
) -> StormWave | None:
    """Emit a burst of ``amplification * |pressure_gradient|`` above threshold."""

    if not isfinite(pressure_gradient):
        raise ValueError("pressure_gradient must be finite")
    _vector("direction", direction)
    if abs(pressure_gradient) <= config.pressure_gradient_threshold:
        return None
    return StormWave(
        amplitude=config.amplification_coefficient * abs(pressure_gradient),
        direction=direction,
    )


def propagate_storm(
    wave: StormWave,
    source_resonance_field: float,
    distance: float,
    config: StormConfig,
) -> StormWave:
    """Propagate a storm wave via ``W * Rf * exp(-lambda * distance)``."""

    _unit_interval("source_resonance_field", source_resonance_field)
    _non_negative("distance", distance)
    return StormWave(
        amplitude=wave.amplitude
        * source_resonance_field
        * exp(-config.decay_constant * distance),
        direction=wave.direction,
    )


def classify_cluster_storm_interaction(
    wave_amplitude: float,
    cluster_wave_amplitude: float,
    tolerance: float,
) -> ClusterStormInteraction:
    """Classify synchronized waves as binding and opposing waves as shattering."""

    if not isfinite(wave_amplitude) or not isfinite(cluster_wave_amplitude):
        raise ValueError("wave amplitudes must be finite")
    _non_negative("tolerance", tolerance)
    if abs(wave_amplitude - cluster_wave_amplitude) < tolerance:
        return "binding"
    if abs(wave_amplitude + cluster_wave_amplitude) < tolerance:
        return "shattering"
    return "none"


def calculate_storm_effects(
    wave: StormWave,
    corridor_vector: Vector2,
    cluster_wave_amplitude: float,
    config: StormConfig,
) -> StormEffects:
    """Map a propagated wave to halo, slit, cluster, and migration effects."""

    _vector("corridor_vector", corridor_vector)
    if not isfinite(cluster_wave_amplitude):
        raise ValueError("cluster_wave_amplitude must be finite")
    return StormEffects(
        wave=wave,
        halo_angular_acceleration=config.rotation_coefficient * wave.amplitude,
        slit_delta=config.slit_coefficient * wave.amplitude,
        migration_vector=(
            corridor_vector[0]
            + config.migration_coefficient * wave.amplitude * wave.direction[0],
            corridor_vector[1]
            + config.migration_coefficient * wave.amplitude * wave.direction[1],
        ),
        cluster_interaction=classify_cluster_storm_interaction(
            wave.amplitude,
            cluster_wave_amplitude,
            config.cluster_wave_tolerance,
        ),
    )
