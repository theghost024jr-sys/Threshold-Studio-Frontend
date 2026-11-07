"""Topology-scoped pressure readings that reveal identity under explicit force."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from typing import Literal

IdentityPressureState = Literal["latent", "revealed", "overloaded"]


def _finite_non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be finite and non-negative")
    return value


def _non_empty(name: str, value: str) -> str:
    if not value.strip():
        raise ValueError(f"{name} must not be empty")
    return value


@dataclass(frozen=True)
class IdentityPressureSources:
    """Independent physical forces acting on one topology-scoped identity."""

    pressure: float
    drift: float
    collapse: float
    resonance: float
    migration: float

    def __post_init__(self) -> None:
        for name in ("pressure", "drift", "collapse", "resonance", "migration"):
            _finite_non_negative(name, getattr(self, name))


@dataclass(frozen=True)
class IdentityPressurePoint:
    """One identity's pressure sources at a declared basin location."""

    identity_id: str
    basin_id: str
    sources: IdentityPressureSources

    def __post_init__(self) -> None:
        _non_empty("identity_id", self.identity_id)
        _non_empty("basin_id", self.basin_id)


@dataclass(frozen=True)
class IdentityPressureEdge:
    """A directed topology relation used to expose local pressure gradients."""

    source_id: str
    target_id: str

    def __post_init__(self) -> None:
        _non_empty("source_id", self.source_id)
        _non_empty("target_id", self.target_id)
        if self.source_id == self.target_id:
            raise ValueError("source_id and target_id must differ")


@dataclass(frozen=True)
class IdentityPressureConfig:
    pressure_weight: float
    drift_weight: float
    collapse_weight: float
    resonance_weight: float
    migration_weight: float
    reveal_threshold: float
    overload_threshold: float

    def __post_init__(self) -> None:
        for name in (
            "pressure_weight",
            "drift_weight",
            "collapse_weight",
            "resonance_weight",
            "migration_weight",
            "reveal_threshold",
            "overload_threshold",
        ):
            _finite_non_negative(name, getattr(self, name))
        if self.overload_threshold <= self.reveal_threshold:
            raise ValueError("overload_threshold must exceed reveal_threshold")


@dataclass(frozen=True)
class IdentityPressureReading:
    """The resolved local pressure and exposure state for one identity."""

    identity_id: str
    basin_id: str
    total_pressure: float
    state: IdentityPressureState


@dataclass(frozen=True)
class IdentityPressureGradient:
    """Signed source-to-target pressure difference across one declared edge."""

    source_id: str
    target_id: str
    gradient: float


@dataclass(frozen=True)
class IdentityPressureMap:
    """A local identity-pressure field over declared topology points and edges."""

    readings: tuple[IdentityPressureReading, ...]
    gradients: tuple[IdentityPressureGradient, ...]


def build_identity_pressure_map(
    points: tuple[IdentityPressurePoint, ...],
    edges: tuple[IdentityPressureEdge, ...],
    config: IdentityPressureConfig,
) -> IdentityPressureMap:
    """Resolve pressure exposure and local gradients without mutating identity."""

    if not points:
        raise ValueError("points must not be empty")
    point_ids = [point.identity_id for point in points]
    if len(set(point_ids)) != len(point_ids):
        raise ValueError("identity_id values must be unique")

    readings = tuple(
        _reading_for(point, config)
        for point in points
    )
    pressures = {
        reading.identity_id: reading.total_pressure for reading in readings
    }
    gradients: list[IdentityPressureGradient] = []
    for edge in edges:
        if edge.source_id not in pressures or edge.target_id not in pressures:
            raise ValueError("edges must reference declared identity_id values")
        gradients.append(
            IdentityPressureGradient(
                source_id=edge.source_id,
                target_id=edge.target_id,
                gradient=pressures[edge.source_id] - pressures[edge.target_id],
            )
        )
    return IdentityPressureMap(readings=readings, gradients=tuple(gradients))


def _reading_for(
    point: IdentityPressurePoint,
    config: IdentityPressureConfig,
) -> IdentityPressureReading:
    sources = point.sources
    total = (
        sources.pressure * config.pressure_weight
        + sources.drift * config.drift_weight
        + sources.collapse * config.collapse_weight
        + sources.resonance * config.resonance_weight
        + sources.migration * config.migration_weight
    )
    if total > config.overload_threshold:
        state: IdentityPressureState = "overloaded"
    elif total > config.reveal_threshold:
        state = "revealed"
    else:
        state = "latent"
    return IdentityPressureReading(
        identity_id=point.identity_id,
        basin_id=point.basin_id,
        total_pressure=total,
        state=state,
    )
