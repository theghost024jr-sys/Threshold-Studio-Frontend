"""Spirit-field effects that regulate Threshold node physics."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite

from .metabolism import MetabolicState, PressureReading

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
class SpiritField:
    """A spirit's alignment, frequency, and directional migration field."""

    alignment: float
    resonance_frequency: float
    migration_vector: Vector2

    def __post_init__(self) -> None:
        _unit_interval("alignment", self.alignment)
        _non_negative("resonance_frequency", self.resonance_frequency)
        _vector("migration_vector", self.migration_vector)


@dataclass(frozen=True)
class SpiritAlignmentConfig:
    """Coefficients governing a Flower's spirit-field effects."""

    slit_coefficient: float
    charge_coefficient: float
    resonance_coefficient: float
    pressure_coefficient: float
    frequency_tolerance: float
    migration_threshold: float
    migration_coefficient: float
    capture_coefficient: float
    rotation_coefficient: float

    def __post_init__(self) -> None:
        for name in (
            "slit_coefficient",
            "charge_coefficient",
            "resonance_coefficient",
            "pressure_coefficient",
            "frequency_tolerance",
            "migration_coefficient",
            "capture_coefficient",
            "rotation_coefficient",
        ):
            _non_negative(name, getattr(self, name))
        _unit_interval("migration_threshold", self.migration_threshold)


@dataclass(frozen=True)
class SpiritEffects:
    """The spirit-modified node state and downstream field effects."""

    state: MetabolicState
    charge_boost: float
    pressure: PressureReading
    frequency_locked: bool
    migration_active: bool
    migration_vector: Vector2
    capture_weight: float
    angular_velocity_multiplier: float


def apply_spirit_alignment(
    state: MetabolicState,
    pressure: PressureReading,
    node_resonance_frequency: float,
    corridor_vector: Vector2,
    field: SpiritField,
    config: SpiritAlignmentConfig,
) -> SpiritEffects:
    """Apply canonical spirit effects without bypassing the metabolism tick.

    The caller passes ``charge_boost`` to ``advance_metabolism`` so spirit
    energy enters charge recovery in the same phase as demand and intake.
    """

    _non_negative("node_resonance_frequency", node_resonance_frequency)
    _vector("corridor_vector", corridor_vector)

    alignment = field.alignment
    slit_openness = min(1.0, state.slit_openness * (1.0 + config.slit_coefficient * alignment))
    frequency_locked = (
        abs(field.resonance_frequency - node_resonance_frequency)
        < config.frequency_tolerance
    )
    resonance = state.resonance
    if frequency_locked:
        resonance = min(
            1.0,
            resonance * (1.0 + config.resonance_coefficient * alignment),
        )
    aligned_state = MetabolicState(
        charge=state.charge,
        slit_openness=slit_openness,
        resonance=resonance,
        circuit_mirror_gain=state.circuit_mirror_gain,
        target_charge=state.target_charge,
    )
    pressure_multiplier = 1.0 + config.pressure_coefficient * alignment
    amplified_pressure = PressureReading(
        demand=pressure.demand,
        base_pressure=pressure.base_pressure,
        total_pressure=pressure.total_pressure * pressure_multiplier,
    )
    migration_active = alignment > config.migration_threshold
    migration_vector = corridor_vector
    if migration_active:
        migration_vector = (
            corridor_vector[0] + config.migration_coefficient * field.migration_vector[0],
            corridor_vector[1] + config.migration_coefficient * field.migration_vector[1],
        )
    return SpiritEffects(
        state=aligned_state,
        charge_boost=config.charge_coefficient * alignment,
        pressure=amplified_pressure,
        frequency_locked=frequency_locked,
        migration_active=migration_active,
        migration_vector=migration_vector,
        capture_weight=config.capture_coefficient * alignment,
        angular_velocity_multiplier=1.0 + config.rotation_coefficient * alignment,
    )
