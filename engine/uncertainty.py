"""Stabilizing deferral derived from unresolved local world-state signals."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite

from .unresolved import UnresolvedField


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be finite and in the range [0, 1]")
    return value


@dataclass(frozen=True)
class UncertaintyStabilizationConfig:
    """How unresolved conditions defer conclusions without removing force."""

    deferment_threshold: float
    contract_damping_coefficient: float
    elevation_damping_coefficient: float
    topology_damping_coefficient: float
    era_drift_damping_coefficient: float

    def __post_init__(self) -> None:
        for name in (
            "deferment_threshold",
            "contract_damping_coefficient",
            "elevation_damping_coefficient",
            "topology_damping_coefficient",
            "era_drift_damping_coefficient",
        ):
            _unit_interval(name, getattr(self, name))


@dataclass(frozen=True)
class UncertaintyStabilization:
    """A local instruction to defer resolution while preserving world-state force."""

    unresolved: float
    defers_resolution: bool
    contract_damping: float
    elevation_damping: float
    topology_damping: float
    era_drift_damping: float

    def __post_init__(self) -> None:
        _unit_interval("unresolved", self.unresolved)
        for name in (
            "contract_damping",
            "elevation_damping",
            "topology_damping",
            "era_drift_damping",
        ):
            _unit_interval(name, getattr(self, name))


def stabilize_uncertainty(
    unresolved: UnresolvedField,
    config: UncertaintyStabilizationConfig,
) -> UncertaintyStabilization:
    """Convert unresolved force into bounded, non-destructive resolution damping."""

    value = unresolved.value
    return UncertaintyStabilization(
        unresolved=value,
        defers_resolution=value > config.deferment_threshold,
        contract_damping=value * config.contract_damping_coefficient,
        elevation_damping=value * config.elevation_damping_coefficient,
        topology_damping=value * config.topology_damping_coefficient,
        era_drift_damping=value * config.era_drift_damping_coefficient,
    )
