"""Pure adapter-driven worldstate orchestration."""
from dataclasses import dataclass
from math import isfinite
from typing import Mapping, Protocol
from .identity_pressure_map import IdentityPressureSnapshot
from .worldstate_snapshot import FlowerStateSnapshot, SymbolicWeather, WorldPressureMap, WorldResonanceMap, WorldstateSnapshot

@dataclass(frozen=True)
class BasinTopology:
    basin_id: str; flower_id: str; neighbors: tuple[str, ...]
@dataclass(frozen=True)
class FlowerTopology:
    flower_id: str; basin_ids: tuple[str, ...]
@dataclass(frozen=True)
class BasinFlowerTopology:
    flowers: Mapping[str, FlowerTopology]; basins: Mapping[str, BasinTopology]

@dataclass(frozen=True)
class WorldstateFields:
    clear_threshold: float; storm_collapse_threshold: int; overcast_pressure_threshold: float
    seasonal_resonance_gain: float; astral_alignment_scale: float; turbulence_scale: float; density_scale: float; drift_scale: float

class FlowerWorldstateAdapter(Protocol):
    def update_basin_geometry(self, flower_id: str, topology: BasinFlowerTopology, pressure_profile: Mapping[str,float], resonance_profile: Mapping[str,float]) -> Mapping[str,object]: ...
    def resolve_collapse_events(self, flower_id: str, identity_snapshots: tuple[IdentityPressureSnapshot,...], topology: BasinFlowerTopology) -> tuple[object,...]: ...
    def resolve_migration_flows(self, flower_id: str, identity_snapshots: tuple[IdentityPressureSnapshot,...], topology: BasinFlowerTopology) -> tuple[object,...]: ...
class EraWorldstateAdapter(Protocol):
    def advance(self, era_state: object, flower_states: tuple[FlowerStateSnapshot,...], world_pressure_map: WorldPressureMap, world_resonance_map: WorldResonanceMap) -> object: ...

def advance_worldstate(tick_id: str, identity_snapshots: tuple[IdentityPressureSnapshot,...], topology: BasinFlowerTopology, flower_adapter: FlowerWorldstateAdapter, era_adapter: EraWorldstateAdapter, era_state: object, world_fields: WorldstateFields) -> WorldstateSnapshot:
    pressure_by_basin: dict[str,float]={}; pressure_by_flower: dict[str,float]={}; resonance_by_basin: dict[str,float]={}; resonance_by_flower: dict[str,float]={}; uncertainty: dict[str,float]={}
    for snap in identity_snapshots:
        try: flower=topology.basins[snap.basin_id].flower_id
        except KeyError as error: raise ValueError(f"unknown snapshot basin: {snap.basin_id}") from error
        pressure_by_basin[snap.basin_id]=pressure_by_basin.get(snap.basin_id,0)+snap.effective_pressure; pressure_by_flower[flower]=pressure_by_flower.get(flower,0)+snap.effective_pressure
        resonance_by_basin[snap.basin_id]=resonance_by_basin.get(snap.basin_id,0)+snap.resonance_state.amplitude; resonance_by_flower[flower]=resonance_by_flower.get(flower,0)+snap.resonance_state.amplitude; uncertainty[flower]=uncertainty.get(flower,0)+snap.uncertainty
    pressure=WorldPressureMap(pressure_by_flower,pressure_by_basin); resonance=WorldResonanceMap(resonance_by_flower,resonance_by_basin); flowers=[]
    for flower_id, flower in topology.flowers.items():
        profiles={b:pressure_by_basin.get(b,0) for b in flower.basin_ids}; harmonics={b:resonance_by_basin.get(b,0) for b in flower.basin_ids}
        flowers.append(FlowerStateSnapshot(flower_id,flower_adapter.update_basin_geometry(flower_id,topology,profiles,harmonics),profiles,harmonics,{flower_id:uncertainty.get(flower_id,0)},tuple(flower_adapter.resolve_collapse_events(flower_id,identity_snapshots,topology)),tuple(flower_adapter.resolve_migration_flows(flower_id,identity_snapshots,topology))))
    flower_states=tuple(flowers); era=era_adapter.advance(era_state,flower_states,pressure,resonance)
    values=list(pressure_by_flower.values()); average=sum(values)/len(values) if values else 0; collapse_count=sum(len(f.collapse_events) for f in flower_states)
    weather=SymbolicWeather.CLEAR if collapse_count==0 and average<world_fields.clear_threshold else SymbolicWeather.STORM if collapse_count>world_fields.storm_collapse_threshold else SymbolicWeather.OVERCAST if average>world_fields.overcast_pressure_threshold else SymbolicWeather.FOG
    total_resonance=sum(resonance_by_flower.values()); baseline=getattr(era,"resonance_baseline",0); magnitude=getattr(era,"drift_vector_magnitude",1); turbulence=(sum((v-average)**2 for v in values)/len(values) if values else 0)*world_fields.turbulence_scale
    return WorldstateSnapshot(tick_id,getattr(era,"id"),flower_states,pressure,resonance,weather,baseline+world_fields.seasonal_resonance_gain*total_resonance,world_fields.astral_alignment_scale*total_resonance*magnitude,turbulence,(sum(len(f.basin_geometry) for f in flower_states)/len(flower_states) if flower_states else 0)*world_fields.density_scale,sum(len(f.migration_flows) for f in flower_states)*world_fields.drift_scale)
