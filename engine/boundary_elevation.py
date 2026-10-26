"""Local, non-successive player alignment with a Warden boundary field."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite

from .agataga import AgatagaSense
from .coherence_recovery import CoherenceRecovery
from .warden import IdentityField


def _finite_non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be finite and non-negative")
    return value


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be finite and in the range [0, 1]")
    return value


@dataclass(frozen=True)
class BoundaryElevationConfig:
    """Thresholds and local effect scaling for one Flower or zone."""

    alignment_threshold: float
    agataga_threshold: float
    shimmer_threshold: float
    coherence_recovery_threshold: float
    saturation_score: float
    departure_decay: float
    collapse_immunity_coefficient: float
    corridor_shaping_coefficient: float
    basin_stabilization_coefficient: float
    identity_amplification_coefficient: float
    memory_imprint_coefficient: float
    weather_modulation_coefficient: float
    density_resistance_coefficient: float

    def __post_init__(self) -> None:
        _finite_non_negative("alignment_threshold", self.alignment_threshold)
        _unit_interval("agataga_threshold", self.agataga_threshold)
        _finite_non_negative("shimmer_threshold", self.shimmer_threshold)
        _unit_interval(
            "coherence_recovery_threshold", self.coherence_recovery_threshold
        )
        _finite_non_negative("saturation_score", self.saturation_score)
        if self.saturation_score <= self.alignment_threshold:
            raise ValueError("saturation_score must exceed alignment_threshold")
        _unit_interval("departure_decay", self.departure_decay)
        for name in (
            "collapse_immunity_coefficient",
            "corridor_shaping_coefficient",
            "basin_stabilization_coefficient",
            "identity_amplification_coefficient",
            "memory_imprint_coefficient",
            "weather_modulation_coefficient",
            "density_resistance_coefficient",
        ):
            _finite_non_negative(name, getattr(self, name))


@dataclass(frozen=True)
class BoundaryElevationEffects:
    """Local field modifications; none represent title, authority, or succession."""

    collapse_immunity: float
    corridor_shaping: float
    basin_stabilization: float
    identity_amplification: float
    memory_imprint: float
    weather_phase_modulation: float
    density_resistance: float


@dataclass(frozen=True)
class BoundaryElevation:
    """A player's zone-bound coherence with a Warden boundary field."""

    zone_id: str
    alignment_score: float
    agataga_sense: AgatagaSense
    shimmer_level: float
    coherence_recovery: CoherenceRecovery
    player_refusing: bool
    identity_aligned: bool
    agataga_perceived: bool
    shimmer_active: bool
    recovery_stable: bool
    coherence: float
    active: bool
    effects: BoundaryElevationEffects

    def __post_init__(self) -> None:
        if not self.zone_id:
            raise ValueError("zone_id must not be empty")
        _finite_non_negative("alignment_score", self.alignment_score)
        _finite_non_negative("shimmer_level", self.shimmer_level)
        _unit_interval("coherence", self.coherence)


def boundary_alignment_score(warden: IdentityField, player: IdentityField) -> float:
    """Return the canonical Warden-player dot product."""

    return sum(
        warden_value * player_value
        for warden_value, player_value in zip(warden.values(), player.values())
    )


def evaluate_boundary_elevation(
    *,
    zone_id: str,
    warden: IdentityField,
    player: IdentityField,
    player_is_in_zone: bool,
    agataga_sense: AgatagaSense,
    shimmer_level: float,
    coherence_recovery: CoherenceRecovery,
    config: BoundaryElevationConfig,
    player_refusing: bool = False,
) -> BoundaryElevation:
    """Create elevation when local identity, perception, and shimmer gates pass."""

    _finite_non_negative("shimmer_level", shimmer_level)
    score = boundary_alignment_score(warden, player)
    identity_aligned = score > config.alignment_threshold
    agataga_perceived = agataga_sense.exceeds(config.agataga_threshold)
    shimmer_active = shimmer_level > config.shimmer_threshold
    recovery_stable = (
        coherence_recovery.value > config.coherence_recovery_threshold
    )
    active = (
        player_is_in_zone
        and not player_refusing
        and identity_aligned
        and agataga_perceived
        and shimmer_active
        and recovery_stable
    )
    coherence = (
        min(
            1.0,
            (score - config.alignment_threshold)
            / (config.saturation_score - config.alignment_threshold),
        )
        if active
        else 0.0
    )
    return BoundaryElevation(
        zone_id=zone_id,
        alignment_score=score,
        agataga_sense=agataga_sense,
        shimmer_level=shimmer_level,
        coherence_recovery=coherence_recovery,
        player_refusing=player_refusing,
        identity_aligned=identity_aligned,
        agataga_perceived=agataga_perceived,
        shimmer_active=shimmer_active,
        recovery_stable=recovery_stable,
        coherence=coherence,
        active=active,
        effects=_effects_for(coherence, config),
    )


def decay_boundary_elevation(
    elevation: BoundaryElevation,
    config: BoundaryElevationConfig,
) -> BoundaryElevation:
    """Decay departed-zone coherence while disabling every local effect."""

    coherence = elevation.coherence * (1.0 - config.departure_decay)
    return BoundaryElevation(
        zone_id=elevation.zone_id,
        alignment_score=elevation.alignment_score,
        agataga_sense=elevation.agataga_sense,
        shimmer_level=elevation.shimmer_level,
        coherence_recovery=elevation.coherence_recovery,
        player_refusing=elevation.player_refusing,
        identity_aligned=elevation.identity_aligned,
        agataga_perceived=elevation.agataga_perceived,
        shimmer_active=elevation.shimmer_active,
        recovery_stable=elevation.recovery_stable,
        coherence=coherence,
        active=False,
        effects=_effects_for(0.0, config),
    )


def _effects_for(
    coherence: float, config: BoundaryElevationConfig
) -> BoundaryElevationEffects:
    return BoundaryElevationEffects(
        collapse_immunity=coherence * config.collapse_immunity_coefficient,
        corridor_shaping=coherence * config.corridor_shaping_coefficient,
        basin_stabilization=coherence * config.basin_stabilization_coefficient,
        identity_amplification=coherence
        * config.identity_amplification_coefficient,
        memory_imprint=coherence * config.memory_imprint_coefficient,
        weather_phase_modulation=coherence * config.weather_modulation_coefficient,
        density_resistance=coherence * config.density_resistance_coefficient,
    )
