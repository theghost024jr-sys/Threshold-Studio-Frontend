"""Hybrid time-step evolution for Flower identity topology."""

from __future__ import annotations

from dataclasses import dataclass, replace
from math import isfinite

from .basins import IdentityBasin


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


@dataclass(frozen=True)
class FlowerIdentity:
    basin: IdentityBasin
    resonance_frequency: float
    halo_angular_velocity: float
    migration_flow: float
    cluster_count: int

    def __post_init__(self) -> None:
        _non_negative("resonance_frequency", self.resonance_frequency)
        _finite("halo_angular_velocity", self.halo_angular_velocity)
        _finite("migration_flow", self.migration_flow)
        if isinstance(self.cluster_count, bool) or self.cluster_count < 0:
            raise ValueError("cluster_count must be a non-negative integer")


@dataclass(frozen=True)
class IdentityDelta:
    center_pressure: float = 0.0
    rim_pressure: float = 0.0
    curvature: float = 0.0
    resonance_frequency: float = 0.0
    halo_angular_velocity: float = 0.0
    migration_flow: float = 0.0
    cluster_count: int = 0

    def __post_init__(self) -> None:
        for name in (
            "center_pressure",
            "rim_pressure",
            "curvature",
            "resonance_frequency",
            "halo_angular_velocity",
            "migration_flow",
        ):
            _finite(name, getattr(self, name))
        if isinstance(self.cluster_count, bool):
            raise ValueError("cluster_count must be an integer")


@dataclass(frozen=True)
class IdentityEvolutionConfig:
    immunity_lock_threshold: float
    net_change_lock_tolerance: float
    spirit_pressure_coefficient: float

    def __post_init__(self) -> None:
        _non_negative("immunity_lock_threshold", self.immunity_lock_threshold)
        _non_negative("net_change_lock_tolerance", self.net_change_lock_tolerance)
        _non_negative("spirit_pressure_coefficient", self.spirit_pressure_coefficient)


@dataclass(frozen=True)
class IdentityEvolution:
    identity: FlowerIdentity
    net_change: float
    locked: bool


def evolve_identity(
    identity: FlowerIdentity,
    delta: IdentityDelta,
    *,
    storm_center_pressure: float = 0.0,
    storm_rim_pressure: float = 0.0,
    spirit_alignment: float = 0.0,
    immunity: float,
    config: IdentityEvolutionConfig,
) -> IdentityEvolution:
    """Advance identity using explicit deltas plus optional raw field effects."""

    _finite("storm_center_pressure", storm_center_pressure)
    _finite("storm_rim_pressure", storm_rim_pressure)
    _unit_interval("spirit_alignment", spirit_alignment)
    _non_negative("immunity", immunity)
    multiplier = 1.0 + config.spirit_pressure_coefficient * spirit_alignment
    center = max(0.0, (identity.basin.center_pressure + delta.center_pressure + storm_center_pressure) * multiplier)
    rim = max(center, (identity.basin.rim_pressure + delta.rim_pressure + storm_rim_pressure) * multiplier)
    next_identity = FlowerIdentity(
        basin=replace(identity.basin, center_pressure=center, rim_pressure=rim, curvature=identity.basin.curvature + delta.curvature),
        resonance_frequency=max(0.0, identity.resonance_frequency + delta.resonance_frequency),
        halo_angular_velocity=identity.halo_angular_velocity + delta.halo_angular_velocity,
        migration_flow=identity.migration_flow + delta.migration_flow,
        cluster_count=max(0, identity.cluster_count + delta.cluster_count),
    )
    net_change = sum(
        abs(value)
        for value in (
            delta.center_pressure + storm_center_pressure,
            delta.rim_pressure + storm_rim_pressure,
            delta.curvature,
            delta.resonance_frequency,
            delta.halo_angular_velocity,
            delta.migration_flow,
            float(delta.cluster_count),
        )
    )
    return IdentityEvolution(
        identity=next_identity,
        net_change=net_change,
        locked=(
            immunity >= config.immunity_lock_threshold
            and net_change <= config.net_change_lock_tolerance
        ),
    )
