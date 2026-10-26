"""Immutable worldstate output records."""
from dataclasses import dataclass
from enum import Enum
from typing import Mapping

class SymbolicWeather(str, Enum):
    CLEAR="clear"; OVERCAST="overcast"; STORM="storm"; FOG="fog"; FRACTURE="fracture"

@dataclass(frozen=True)
class FlowerStateSnapshot:
    flower_id: str; basin_geometry: Mapping[str, object]; pressure_profile: Mapping[str, float]
    resonance_profile: Mapping[str, float]; uncertainty_profile: Mapping[str, float]
    collapse_events: tuple[object, ...]; migration_flows: tuple[object, ...]

@dataclass(frozen=True)
class WorldPressureMap:
    pressure_by_flower: Mapping[str, float]; pressure_by_basin: Mapping[str, float]

@dataclass(frozen=True)
class WorldResonanceMap:
    resonance_by_flower: Mapping[str, float]; resonance_by_basin: Mapping[str, float]

@dataclass(frozen=True)
class WorldstateSnapshot:
    tick_id: str; era_id: str; flower_states: tuple[FlowerStateSnapshot, ...]
    world_pressure_map: WorldPressureMap; world_resonance_map: WorldResonanceMap
    symbolic_weather: SymbolicWeather; seasonal_resonance: float; astral_alignment: float
    turbulence: float; density: float; drift: float
