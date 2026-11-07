"""Deterministic uncertainty, recovery, soft-mode, and hesitation-zone mechanics."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from typing import Literal

from .agataga import AgatagaSense
from .coherence_recovery import CoherenceRecovery
from .warden import IdentityField
from .warden_stances import WardenIdentity

InterferenceMode = Literal["normal", "ambiguous", "soft_alignment"]
WardenActivationMode = Literal["inactive", "full", "soft", "soft_coherent"]


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be finite and in the range [0, 1]")
    return value


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be finite and non-negative")
    return value


def _clamp(value: float) -> float:
    return min(1.0, max(0.0, value))


@dataclass(frozen=True)
class UncertaintyWorldstate:
    """Local drivers plus uncertainty, recovery, and retained misalignment memory."""

    pressure: float
    resonance: float
    flow: float
    density: float
    shimmer: float
    uncertainty: float
    coherence_recovery: float
    misalignment_memory: float

    def __post_init__(self) -> None:
        for name in ("pressure", "resonance", "flow", "density", "shimmer"):
            _non_negative(name, getattr(self, name))
        for name in ("uncertainty", "coherence_recovery", "misalignment_memory"):
            _unit_interval(name, getattr(self, name))


@dataclass(frozen=True)
class UncertaintyTickInputs:
    contradiction: float
    grief_weight: float
    refusal_active: bool
    hesitation_zone_proximity: float
    collapse_pressure: float
    resonance_instability: float

    def __post_init__(self) -> None:
        for name in (
            "contradiction",
            "grief_weight",
            "hesitation_zone_proximity",
            "collapse_pressure",
            "resonance_instability",
        ):
            _unit_interval(name, getattr(self, name))


def advance_uncertainty_worldstate(
    worldstate: UncertaintyWorldstate,
    inputs: UncertaintyTickInputs,
) -> UncertaintyWorldstate:
    """Advance both feedback drivers from the prior tick, then clamp to [0, 1]."""

    uncertainty = _clamp(
        worldstate.uncertainty
        + inputs.contradiction
        + worldstate.misalignment_memory * 0.2
        + inputs.grief_weight * 0.3
        + float(inputs.refusal_active) * 0.4
        + inputs.hesitation_zone_proximity * 0.5
        - worldstate.coherence_recovery * 0.6
    )
    recovery = _clamp(
        worldstate.coherence_recovery
        + worldstate.uncertainty * 0.4
        + inputs.hesitation_zone_proximity * 0.3
        + float(inputs.refusal_active) * 0.2
        - inputs.collapse_pressure * 0.5
        - inputs.resonance_instability * 0.4
    )
    return UncertaintyWorldstate(
        pressure=worldstate.pressure,
        resonance=worldstate.resonance,
        flow=worldstate.flow,
        density=worldstate.density,
        shimmer=worldstate.shimmer,
        uncertainty=uncertainty,
        coherence_recovery=recovery,
        misalignment_memory=worldstate.misalignment_memory,
    )


@dataclass(frozen=True)
class UncertaintyEffects:
    worldstate: UncertaintyWorldstate
    interference_mode: InterferenceMode
    warden_activation_mode: WardenActivationMode


def apply_uncertainty_effects(worldstate: UncertaintyWorldstate) -> UncertaintyEffects:
    """Apply canonical instability and recovery modifiers without erasing drivers."""

    uncertainty_active = worldstate.uncertainty > 0.5
    recovery_active = worldstate.coherence_recovery > 0.4
    pressure = worldstate.pressure
    resonance = worldstate.resonance
    flow = worldstate.flow
    density = worldstate.density
    shimmer = worldstate.shimmer
    memory = worldstate.misalignment_memory

    if uncertainty_active:
        pressure *= 1.0 - worldstate.uncertainty * 0.3
        resonance *= 1.0 - worldstate.uncertainty * 0.4
        flow *= 1.0 - worldstate.uncertainty * 0.2
        density *= 1.0 - worldstate.uncertainty * 0.1
        shimmer *= 1.0 + worldstate.uncertainty * 0.2
        memory = _clamp(memory + worldstate.uncertainty * 0.2)

    if recovery_active:
        pressure *= 1.0 + worldstate.coherence_recovery * 0.2
        resonance *= 1.0 + worldstate.coherence_recovery * 0.3
        flow *= 1.0 + worldstate.coherence_recovery * 0.2
        density *= 1.0 + worldstate.coherence_recovery * 0.1
        shimmer *= 1.0 - worldstate.coherence_recovery * 0.2
        memory = _clamp(memory * (1.0 - worldstate.coherence_recovery * 0.3))

    if recovery_active:
        interference_mode: InterferenceMode = "soft_alignment"
    elif uncertainty_active:
        interference_mode = "ambiguous"
    else:
        interference_mode = "normal"
    activation_mode = resolve_warden_activation_mode(
        warden_active=True,
        uncertainty=worldstate.uncertainty,
        coherence_recovery=worldstate.coherence_recovery,
    )
    return UncertaintyEffects(
        worldstate=UncertaintyWorldstate(
            pressure=pressure,
            resonance=resonance,
            flow=flow,
            density=density,
            shimmer=shimmer,
            uncertainty=worldstate.uncertainty,
            coherence_recovery=worldstate.coherence_recovery,
            misalignment_memory=memory,
        ),
        interference_mode=interference_mode,
        warden_activation_mode=activation_mode,
    )


def resolve_warden_activation_mode(
    *,
    warden_active: bool,
    uncertainty: float,
    coherence_recovery: float,
) -> WardenActivationMode:
    """Resolve full, soft, or soft-coherent activation from local feedback."""

    _unit_interval("uncertainty", uncertainty)
    _unit_interval("coherence_recovery", coherence_recovery)
    if not warden_active:
        return "inactive"
    if uncertainty > 0.5 and coherence_recovery < 0.4:
        return "soft"
    if coherence_recovery > 0.4:
        return "soft_coherent"
    return "full"


@dataclass(frozen=True)
class SoftWarden:
    """A partial presentation of a valid Warden, without fabricated vault metadata."""

    identity: WardenIdentity
    intensity: float
    stimulus_vector: tuple[float, ...]
    metadata_state: Literal["partial"]

    def __post_init__(self) -> None:
        _non_negative("intensity", self.intensity)
        if not self.stimulus_vector:
            raise ValueError("stimulus_vector must not be empty")
        for index, component in enumerate(self.stimulus_vector):
            if not isfinite(component):
                raise ValueError(f"stimulus_vector[{index}] must be finite")


def build_soft_warden(
    *,
    identity: WardenIdentity,
    density: float,
    shimmer: float,
    drift: tuple[float, ...],
    activation_mode: WardenActivationMode,
) -> SoftWarden | None:
    """Create a soft Warden only from an already-active soft activation mode."""

    _non_negative("density", density)
    _non_negative("shimmer", shimmer)
    if activation_mode != "soft":
        return None
    return SoftWarden(
        identity=identity,
        intensity=density * shimmer * 0.5,
        stimulus_vector=tuple(component * 0.5 for component in drift),
        metadata_state="partial",
    )


@dataclass(frozen=True)
class SoftElevationConfig:
    alignment_threshold: float
    agataga_threshold: float
    shimmer_threshold: float
    uncertainty_threshold: float
    coherence_recovery_threshold: float

    def __post_init__(self) -> None:
        for name in (
            "alignment_threshold",
            "agataga_threshold",
            "shimmer_threshold",
            "uncertainty_threshold",
            "coherence_recovery_threshold",
        ):
            _unit_interval(name, getattr(self, name))


@dataclass(frozen=True)
class SoftElevation:
    active: bool
    pressure_delta: Literal["small"]
    navigation_effect: Literal["gentle_coherence"]
    contract_effect: Literal["none"]
    memory_update: Literal["soft_reinforce"]
    identity_update: Literal["slight_strengthen"]
    topology_update: Literal["none"]
    era_drift: Literal["none"]


def evaluate_soft_elevation(
    *,
    warden_active: bool,
    warden: IdentityField,
    player: IdentityField,
    agataga_sense: AgatagaSense,
    shimmer_level: float,
    uncertainty: float,
    coherence_recovery: CoherenceRecovery,
    player_refusing: bool,
    config: SoftElevationConfig,
) -> SoftElevation:
    """Allow alignment without contract, topology, identity-lock, or era consequences."""

    _non_negative("shimmer_level", shimmer_level)
    _unit_interval("uncertainty", uncertainty)
    score = sum(
        warden_component * player_component
        for warden_component, player_component in zip(
            warden.values(), player.values()
        )
    )
    active = (
        warden_active
        and not player_refusing
        and score > config.alignment_threshold
        and agataga_sense.exceeds(config.agataga_threshold)
        and shimmer_level > config.shimmer_threshold
        and uncertainty > config.uncertainty_threshold
        and coherence_recovery.value > config.coherence_recovery_threshold
    )
    return SoftElevation(
        active=active,
        pressure_delta="small",
        navigation_effect="gentle_coherence",
        contract_effect="none",
        memory_update="soft_reinforce",
        identity_update="slight_strengthen",
        topology_update="none",
        era_drift="none",
    )


@dataclass(frozen=True)
class HesitationZone:
    active: bool
    contracts_disabled: bool
    elevation_disabled: bool
    topology_rewrite_disabled: bool
    era_drift_paused: bool
    warden_activation_mode: WardenActivationMode
    pressure: float
    resonance: float
    flow: float


def resolve_hesitation_zone(worldstate: UncertaintyWorldstate) -> HesitationZone:
    """Pause escalation in zones with high unresolved uncertainty and weak recovery."""

    active = (
        worldstate.uncertainty > 0.6
        and worldstate.coherence_recovery < 0.3
        and worldstate.misalignment_memory > 0.4
    )
    scale = 0.5 if active else 1.0
    return HesitationZone(
        active=active,
        contracts_disabled=active,
        elevation_disabled=active,
        topology_rewrite_disabled=active,
        era_drift_paused=active,
        warden_activation_mode="soft" if active else "full",
        pressure=worldstate.pressure * scale,
        resonance=worldstate.resonance * scale,
        flow=worldstate.flow * scale,
    )
