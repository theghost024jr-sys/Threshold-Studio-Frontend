"""Runtime Warden activation assembled from resolved local world and vault data."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from typing import Literal

from .agataga import AgatagaSense
from .boundary_elevation import (
    BoundaryElevation,
    BoundaryElevationConfig,
    evaluate_boundary_elevation,
)
from .coherence_recovery import CoherenceRecovery
from .warden import IdentityField
from .warden_stances import (
    Stance,
    StanceResponse,
    WardenIdentity,
    resolve_warden_stance,
)

WeatherPhase = Literal["Coherence", "Tension", "Collapse", "Void", "Renewal"]
Resonance = float | tuple[float, ...]


def _finite(name: str, value: float) -> float:
    if not isfinite(value):
        raise ValueError(f"{name} must be finite")
    return value


def _finite_non_negative(name: str, value: float) -> float:
    _finite(name, value)
    if value < 0.0:
        raise ValueError(f"{name} must be non-negative")
    return value


def _non_empty(name: str, value: str) -> str:
    if not value.strip():
        raise ValueError(f"{name} must not be empty")
    return value


@dataclass(frozen=True)
class WardenWorldstate:
    """Python representation of the existing local weather snapshot drivers."""

    weather_phase: WeatherPhase
    drift: tuple[float, ...]
    pressure: float
    resonance: Resonance
    density: float
    shimmer_level: float

    def __post_init__(self) -> None:
        if not self.drift:
            raise ValueError("drift must not be empty")
        for index, value in enumerate(self.drift):
            _finite(f"drift[{index}]", value)
        _finite("pressure", self.pressure)
        if isinstance(self.resonance, tuple):
            if not self.resonance:
                raise ValueError("resonance spectrum must not be empty")
            for index, value in enumerate(self.resonance):
                _finite(f"resonance[{index}]", value)
        else:
            _finite("resonance", self.resonance)
        _finite_non_negative("density", self.density)
        _finite_non_negative("shimmer_level", self.shimmer_level)


@dataclass(frozen=True)
class WardenPhenomena:
    environmental: str | None
    symbolic: str | None
    astral: str | None

    def __post_init__(self) -> None:
        for name in ("environmental", "symbolic", "astral"):
            value = getattr(self, name)
            if value is not None:
                _non_empty(name, value)


@dataclass(frozen=True)
class WardenMetadata:
    """Vault-resolved metadata; this module intentionally owns no mythology registry."""

    species: str
    elemental_overlay: str
    layer: str
    emotional_resonance: str

    def __post_init__(self) -> None:
        for name in (
            "species",
            "elemental_overlay",
            "layer",
            "emotional_resonance",
        ):
            _non_empty(name, getattr(self, name))


@dataclass(frozen=True)
class WardenActivationConfig:
    density_threshold: float
    shimmer_threshold: float

    def __post_init__(self) -> None:
        _finite_non_negative("density_threshold", self.density_threshold)
        _finite_non_negative("shimmer_threshold", self.shimmer_threshold)


@dataclass(frozen=True)
class WardenPlayerState:
    stance: Stance
    identity_field: IdentityField
    agataga_sense: AgatagaSense
    is_in_zone: bool
    refusal_active: bool = False

    @property
    def is_refusing(self) -> bool:
        return self.stance == "refusal" or self.refusal_active


@dataclass(frozen=True)
class WardenActivation:
    """A local Warden stimulus event with its complete player response."""

    zone_id: str
    flower_id: str | None
    worldstate: WardenWorldstate
    metadata: WardenMetadata
    stimulus_vector: tuple[float, ...]
    phenomena: WardenPhenomena
    warden_identity: WardenIdentity
    player_response: StanceResponse
    boundary_elevation: BoundaryElevation

    def __post_init__(self) -> None:
        _non_empty("zone_id", self.zone_id)
        if self.flower_id is not None:
            _non_empty("flower_id", self.flower_id)
        if not self.stimulus_vector:
            raise ValueError("stimulus_vector must not be empty")
        for index, value in enumerate(self.stimulus_vector):
            _finite(f"stimulus_vector[{index}]", value)


def build_warden_activation(
    *,
    zone_id: str,
    flower_id: str | None,
    worldstate: WardenWorldstate,
    metadata: WardenMetadata,
    phenomena: WardenPhenomena,
    stimulus_vector: tuple[float, ...],
    warden_identity: WardenIdentity,
    warden_field: IdentityField,
    player: WardenPlayerState,
    coherence_recovery: CoherenceRecovery,
    activation_config: WardenActivationConfig,
    elevation_config: BoundaryElevationConfig,
) -> WardenActivation | None:
    """Emit a Warden event only after the density and shimmer world gates pass."""

    if (
        worldstate.density <= activation_config.density_threshold
        or worldstate.shimmer_level <= activation_config.shimmer_threshold
    ):
        return None

    elevation = evaluate_boundary_elevation(
        zone_id=zone_id,
        warden=warden_field,
        player=player.identity_field,
        player_is_in_zone=player.is_in_zone,
        agataga_sense=player.agataga_sense,
        shimmer_level=worldstate.shimmer_level,
        coherence_recovery=coherence_recovery,
        config=elevation_config,
        player_refusing=player.is_refusing,
    )
    return WardenActivation(
        zone_id=zone_id,
        flower_id=flower_id,
        worldstate=worldstate,
        metadata=metadata,
        stimulus_vector=stimulus_vector,
        phenomena=phenomena,
        warden_identity=warden_identity,
        player_response=resolve_warden_stance(
            player.stance,
            warden_identity,
            refusal_active=player.refusal_active,
        ),
        boundary_elevation=elevation,
    )
