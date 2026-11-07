"""Configurable halo rotation mechanics driven by pressure and wave coherence."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite, tanh, tau
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
class HaloRotationConfig:
    """Per-Flower configuration for its configurable halo band."""

    minimum_orbit: float
    angular_sensitivity: float
    maximum_angular_speed: float
    coherence_damping: float
    wave_rotation_sensitivity: float = 0.0

    def __post_init__(self) -> None:
        _non_negative("minimum_orbit", self.minimum_orbit)
        _non_negative("angular_sensitivity", self.angular_sensitivity)
        _non_negative("maximum_angular_speed", self.maximum_angular_speed)
        _unit_interval("coherence_damping", self.coherence_damping)
        _non_negative("wave_rotation_sensitivity", self.wave_rotation_sensitivity)


@dataclass(frozen=True)
class HaloRotation:
    """The angular delta and resonance-coherence values for one halo update."""

    active: bool
    angular_delta: float
    wave_coherence: float
    coherence_multiplier: float


@dataclass(frozen=True)
class HaloState:
    """A halo node's angular state at a specific engine tick."""

    angular_velocity: float
    angular_position: float

    def __post_init__(self) -> None:
        if not isfinite(self.angular_velocity):
            raise ValueError("angular_velocity must be finite")
        if not isfinite(self.angular_position):
            raise ValueError("angular_position must be finite")


@dataclass(frozen=True)
class HaloUpdate:
    """The hybrid halo rotation result and its downstream rotational effects."""

    state: HaloState
    angular_acceleration: float
    net_wave: float
    coherence_multiplier: float
    rotational_force: float
    inner_angular_delta: float
    cluster_angular_delta: float
    corridor_curvature: float


def calculate_wave_coherence(waves: Sequence[ResonanceWave]) -> float:
    """Calculate signed wave alignment in the inclusive range [0, 1].

    The magnitude of the aggregate wave divided by the aggregate magnitude
    yields one for fully aligned signs and zero for perfectly opposing waves.
    An empty or silent set has no damping effect and is treated as coherent.
    """

    if not waves:
        return 1.0
    total_magnitude = sum(abs(wave.amplitude) for wave in waves)
    if total_magnitude == 0.0:
        return 1.0
    return abs(sum(wave.amplitude for wave in waves)) / total_magnitude


def calculate_halo_rotation(
    orbit_radius: float,
    angular_pressure_gradient: float,
    waves: Sequence[ResonanceWave],
    config: HaloRotationConfig,
) -> HaloRotation:
    """Calculate saturating angular motion for a node in a Flower's halo.

    Base motion follows a smooth saturation curve:
    ``maximum_angular_speed * tanh(angular_sensitivity * gradient / maximum)``.
    Opposing resonance waves damp it; fully aligned waves retain full speed.
    """

    _non_negative("orbit_radius", orbit_radius)
    if not isfinite(angular_pressure_gradient):
        raise ValueError("angular_pressure_gradient must be finite")
    if orbit_radius < config.minimum_orbit or config.maximum_angular_speed == 0.0:
        return HaloRotation(
            active=orbit_radius >= config.minimum_orbit,
            angular_delta=0.0,
            wave_coherence=1.0,
            coherence_multiplier=1.0,
        )
    wave_coherence = calculate_wave_coherence(waves)
    coherence_multiplier = 1.0 - config.coherence_damping * (1.0 - wave_coherence)
    base_angular_delta = config.maximum_angular_speed * tanh(
        config.angular_sensitivity
        * angular_pressure_gradient
        / config.maximum_angular_speed
    )
    return HaloRotation(
        active=True,
        angular_delta=base_angular_delta * coherence_multiplier,
        wave_coherence=wave_coherence,
        coherence_multiplier=coherence_multiplier,
    )


def advance_halo_rotation(
        state: HaloState,
        orbit_radius: float,
        node_mass: float,
        angular_pressure_gradient: float,
        waves: Sequence[ResonanceWave],
        config: HaloRotationConfig,
        *,
        inner_coupling: float = 0.0,
        cluster_coupling: float = 0.0,
        corridor_curvature_coefficient: float = 0.0,
) -> HaloUpdate:
        """Advance hybrid halo rotation and expose its Flower-wide effects.

        Pressure-gradient and net-wave torque update angular velocity. Wave
        coherence damps mismatched signals, and the resulting velocity is capped
        at the configured maximum. Position advances by that capped velocity.
        """

        _non_negative("orbit_radius", orbit_radius)
        _non_negative("node_mass", node_mass)
        if not isfinite(angular_pressure_gradient):
            raise ValueError("angular_pressure_gradient must be finite")
        _non_negative("inner_coupling", inner_coupling)
        _non_negative("cluster_coupling", cluster_coupling)
        _non_negative("corridor_curvature_coefficient", corridor_curvature_coefficient)

        if orbit_radius < config.minimum_orbit:
            return HaloUpdate(
                state=state,
                angular_acceleration=0.0,
                net_wave=0.0,
                coherence_multiplier=1.0,
                rotational_force=0.0,
                inner_angular_delta=0.0,
                cluster_angular_delta=0.0,
                corridor_curvature=0.0,
            )

        net_wave = sum(wave.amplitude for wave in waves)
        wave_coherence = calculate_wave_coherence(waves)
        coherence_multiplier = 1.0 - config.coherence_damping * (1.0 - wave_coherence)
        angular_acceleration = coherence_multiplier * (
            config.angular_sensitivity * angular_pressure_gradient
            + config.wave_rotation_sensitivity * net_wave
        )
        uncapped_velocity = state.angular_velocity + angular_acceleration
        angular_velocity = max(
            -config.maximum_angular_speed,
            min(config.maximum_angular_speed, uncapped_velocity),
        )
        next_state = HaloState(
            angular_velocity=angular_velocity,
            angular_position=(state.angular_position + angular_velocity) % tau,
        )
        rotational_force = node_mass * orbit_radius * angular_velocity**2
        return HaloUpdate(
            state=next_state,
            angular_acceleration=angular_acceleration,
            net_wave=net_wave,
            coherence_multiplier=coherence_multiplier,
            rotational_force=rotational_force,
            inner_angular_delta=inner_coupling * angular_velocity,
            cluster_angular_delta=cluster_coupling * angular_velocity,
            corridor_curvature=corridor_curvature_coefficient * angular_velocity,
        )
