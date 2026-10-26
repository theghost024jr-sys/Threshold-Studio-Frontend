"""Identity harmonic signatures and deterministic pairwise resonance interactions."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from typing import Literal

ResonanceInteractionMode = Literal[
    "alignment",
    "dissonance",
    "interference",
    "entrainment",
    "storm",
    "entrapment",
]


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be finite and in the range [0, 1]")
    return value


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be finite and non-negative")
    return value


def _finite(name: str, value: float) -> float:
    if not isfinite(value):
        raise ValueError(f"{name} must be finite")
    return value


@dataclass(frozen=True)
class IdentityResonanceSignature:
    """The harmonic fingerprint emitted by one identity."""

    amplitude: float
    frequency: float
    coherence: float
    symmetry: float
    collapse_shift: float

    def __post_init__(self) -> None:
        _non_negative("amplitude", self.amplitude)
        _non_negative("frequency", self.frequency)
        _unit_interval("coherence", self.coherence)
        _unit_interval("symmetry", self.symmetry)
        _finite("collapse_shift", self.collapse_shift)


@dataclass(frozen=True)
class CollapseHarmonicShift:
    """A selected collapse aftermath supplied by the collapse reconfiguration layer."""

    amplitude_delta: float
    frequency_delta: float
    coherence_delta: float
    symmetry_delta: float
    collapse_shift_delta: float

    def __post_init__(self) -> None:
        for name in (
            "amplitude_delta",
            "frequency_delta",
            "coherence_delta",
            "symmetry_delta",
            "collapse_shift_delta",
        ):
            _finite(name, getattr(self, name))


@dataclass(frozen=True)
class ResonanceInteractionConfig:
    """Flower-specific tolerances and dominance limits for harmonic interaction."""

    frequency_tolerance: float
    coherence_tolerance: float
    symmetry_tolerance: float
    storm_coherence_gap: float
    entrapment_amplitude_ratio: float

    def __post_init__(self) -> None:
        for name in (
            "frequency_tolerance",
            "coherence_tolerance",
            "symmetry_tolerance",
            "storm_coherence_gap",
        ):
            _non_negative(name, getattr(self, name))
        if (
            not isfinite(self.entrapment_amplitude_ratio)
            or self.entrapment_amplitude_ratio <= 1.0
        ):
            raise ValueError(
                "entrapment_amplitude_ratio must be finite and greater than 1"
            )


@dataclass(frozen=True)
class ResonanceInteraction:
    """The combined signature and deterministic relation between two identities."""

    mode: ResonanceInteractionMode
    combined: IdentityResonanceSignature
    frequency_distance: float
    coherence_distance: float
    symmetry_distance: float
    amplitude_ratio: float | None


def apply_collapse_harmonic_shift(
    signature: IdentityResonanceSignature,
    shift: CollapseHarmonicShift,
) -> IdentityResonanceSignature:
    """Apply explicit aftermath while preserving valid harmonic bounds."""

    return IdentityResonanceSignature(
        amplitude=max(0.0, signature.amplitude + shift.amplitude_delta),
        frequency=max(0.0, signature.frequency + shift.frequency_delta),
        coherence=min(1.0, max(0.0, signature.coherence + shift.coherence_delta)),
        symmetry=min(1.0, max(0.0, signature.symmetry + shift.symmetry_delta)),
        collapse_shift=signature.collapse_shift + shift.collapse_shift_delta,
    )


def interact_resonance(
    first: IdentityResonanceSignature,
    second: IdentityResonanceSignature,
    config: ResonanceInteractionConfig,
) -> ResonanceInteraction:
    """Resolve pairwise harmonic interaction with Flower-specific tolerances."""

    frequency_distance = abs(first.frequency - second.frequency)
    coherence_distance = abs(first.coherence - second.coherence)
    symmetry_distance = abs(first.symmetry - second.symmetry)
    amplitude_ratio = _amplitude_ratio(first.amplitude, second.amplitude)
    combined = _combine(first, second)

    if (
        frequency_distance <= config.frequency_tolerance
        and coherence_distance >= config.storm_coherence_gap
    ):
        mode: ResonanceInteractionMode = "storm"
    elif (
        symmetry_distance <= config.symmetry_tolerance
        and amplitude_ratio is not None
        and amplitude_ratio >= config.entrapment_amplitude_ratio
    ):
        mode = "entrapment"
    elif (
        frequency_distance <= config.frequency_tolerance
        and coherence_distance <= config.coherence_tolerance
    ):
        mode = "entrainment"
    elif symmetry_distance <= config.symmetry_tolerance:
        mode = "alignment"
    elif frequency_distance <= config.frequency_tolerance:
        mode = "interference"
    else:
        mode = "dissonance"
    return ResonanceInteraction(
        mode=mode,
        combined=combined,
        frequency_distance=frequency_distance,
        coherence_distance=coherence_distance,
        symmetry_distance=symmetry_distance,
        amplitude_ratio=amplitude_ratio,
    )


def _amplitude_ratio(first: float, second: float) -> float | None:
    lower = min(first, second)
    if lower == 0.0:
        return None
    return max(first, second) / lower


def _combine(
    first: IdentityResonanceSignature,
    second: IdentityResonanceSignature,
) -> IdentityResonanceSignature:
    amplitude = first.amplitude + second.amplitude
    if amplitude == 0.0:
        frequency = 0.0
    else:
        frequency = (
            first.frequency * first.amplitude + second.frequency * second.amplitude
        ) / amplitude
    return IdentityResonanceSignature(
        amplitude=amplitude,
        frequency=frequency,
        coherence=(first.coherence + second.coherence) / 2.0,
        symmetry=(first.symmetry + second.symmetry) / 2.0,
        collapse_shift=first.collapse_shift + second.collapse_shift,
    )
