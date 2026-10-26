"""Cluster binding physics for aligned node orbits."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from typing import Sequence


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
class NodeOrbitProfile:
    """The node values used to compare and bind it to a cluster orbit."""

    node_id: str
    pressure: float
    wave_amplitude: float
    radial_velocity: float
    slit_openness: float
    orbit_radius: float
    demand: float

    def __post_init__(self) -> None:
        if not self.node_id.strip():
            raise ValueError("node_id must not be empty")
        _non_negative("pressure", self.pressure)
        _finite("wave_amplitude", self.wave_amplitude)
        _finite("radial_velocity", self.radial_velocity)
        _unit_interval("slit_openness", self.slit_openness)
        _non_negative("orbit_radius", self.orbit_radius)
        _unit_interval("demand", self.demand)


@dataclass(frozen=True)
class ClusterProfile:
    """The shared pressure, resonance, slit, and orbit signature of a cluster."""

    cluster_id: str
    pressure: float
    wave_amplitude: float
    slit_openness: float
    orbit_radius: float

    def __post_init__(self) -> None:
        if not self.cluster_id.strip():
            raise ValueError("cluster_id must not be empty")
        _non_negative("pressure", self.pressure)
        _finite("wave_amplitude", self.wave_amplitude)
        _unit_interval("slit_openness", self.slit_openness)
        _non_negative("orbit_radius", self.orbit_radius)


@dataclass(frozen=True)
class CaptureTolerances:
    """Maximum deltas that permit a node to enter a cluster orbit."""

    pressure: float
    wave_amplitude: float
    radial_velocity: float
    slit_openness: float

    def __post_init__(self) -> None:
        _non_negative("pressure", self.pressure)
        _non_negative("wave_amplitude", self.wave_amplitude)
        _non_negative("radial_velocity", self.radial_velocity)
        _non_negative("slit_openness", self.slit_openness)


def is_cluster_capturable(
    node: NodeOrbitProfile,
    cluster: ClusterProfile,
    tolerances: CaptureTolerances,
) -> bool:
    """Return whether all canonical pressure, wave, velocity, and slit locks align."""

    return (
        abs(node.pressure - cluster.pressure) < tolerances.pressure
        and abs(node.wave_amplitude - cluster.wave_amplitude)
        < tolerances.wave_amplitude
        and abs(node.radial_velocity) < tolerances.radial_velocity
        and abs(node.slit_openness - cluster.slit_openness) < tolerances.slit_openness
    )


def bind_to_cluster(node: NodeOrbitProfile, cluster: ClusterProfile) -> NodeOrbitProfile:
    """Snap a captured node into the cluster's shared orbit and metabolic rhythm."""

    return NodeOrbitProfile(
        node_id=node.node_id,
        pressure=cluster.pressure,
        wave_amplitude=cluster.wave_amplitude,
        radial_velocity=0.0,
        slit_openness=cluster.slit_openness,
        orbit_radius=cluster.orbit_radius,
        demand=0.0,
    )


def calculate_cluster_cohesion(members: Sequence[NodeOrbitProfile]) -> float:
    """Calculate cohesion as the cluster's total member pressure."""

    if not members:
        raise ValueError("members must not be empty")
    return sum(member.pressure for member in members)


def can_merge_clusters(
    first: ClusterProfile,
    second: ClusterProfile,
    pressure_tolerance: float,
    wave_tolerance: float,
) -> bool:
    """Return whether two cluster signatures meet the canonical merge conditions."""

    _non_negative("pressure_tolerance", pressure_tolerance)
    _non_negative("wave_tolerance", wave_tolerance)
    return (
        abs(first.pressure - second.pressure) < pressure_tolerance
        and abs(first.wave_amplitude - second.wave_amplitude) < wave_tolerance
    )
