"""Player navigation through Garden pressure topology."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite

Vector2 = tuple[float, float]


def _unit(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be a finite value in the range [0, 1]")
    return value


def _vector(name: str, value: Vector2) -> Vector2:
    if len(value) != 2 or not all(isfinite(component) for component in value):
        raise ValueError(f"{name} must contain two finite components")
    return value


@dataclass(frozen=True)
class PlayerTopologyPosition:
    pressure: float
    resonance: float
    slit_openness: float
    basin_id: str

    def __post_init__(self) -> None:
        _unit("pressure", self.pressure)
        _unit("resonance", self.resonance)
        _unit("slit_openness", self.slit_openness)
        if not self.basin_id.strip():
            raise ValueError("basin_id must not be empty")


@dataclass(frozen=True)
class NavigationResult:
    velocity: Vector2
    collapse_zone: bool
    crossed_basin_rim: bool


def navigate_garden(
    position: PlayerTopologyPosition,
    pressure_gradient: Vector2,
    corridor_vector: Vector2,
    rotational_vector: Vector2,
    spirit_alignment: float,
    spirit_speed_coefficient: float,
    effective_pressure: float,
    collapse_threshold: float,
    collapse_slowdown: float,
    previous_pressure: float,
    basin_rim_pressure: float,
) -> NavigationResult:
    """Calculate gradient-descent navigation with corridor, wind, and spirit effects."""

    _vector("pressure_gradient", pressure_gradient)
    _vector("corridor_vector", corridor_vector)
    _vector("rotational_vector", rotational_vector)
    _unit("spirit_alignment", spirit_alignment)
    if not isfinite(spirit_speed_coefficient) or spirit_speed_coefficient < 0.0:
        raise ValueError("spirit_speed_coefficient must be finite and non-negative")
    _unit("effective_pressure", effective_pressure)
    _unit("collapse_threshold", collapse_threshold)
    _unit("collapse_slowdown", collapse_slowdown)
    _unit("previous_pressure", previous_pressure)
    _unit("basin_rim_pressure", basin_rim_pressure)
    multiplier = 1.0 + spirit_speed_coefficient * spirit_alignment
    velocity = (
        (-pressure_gradient[0] + corridor_vector[0] + rotational_vector[0]) * multiplier,
        (-pressure_gradient[1] + corridor_vector[1] + rotational_vector[1]) * multiplier,
    )
    collapse_zone = effective_pressure < collapse_threshold
    if collapse_zone:
        velocity = (
            velocity[0] * (1.0 - collapse_slowdown),
            velocity[1] * (1.0 - collapse_slowdown),
        )
    crossed = (previous_pressure < basin_rim_pressure <= position.pressure) or (
        previous_pressure >= basin_rim_pressure > position.pressure
    )
    return NavigationResult(velocity, collapse_zone, crossed)
