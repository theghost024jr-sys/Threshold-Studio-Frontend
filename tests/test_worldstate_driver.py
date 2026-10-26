from dataclasses import dataclass

import pytest

from engine.identity_migration import IdentityMigrationDecision
from engine.identity_pressure_map import CollapseState, IdentityPressureSnapshot, PressureState
from engine.identity_resonance import IdentityResonanceSignature
from engine.worldstate_driver import (
    BasinFlowerTopology,
    BasinTopology,
    FlowerTopology,
    WorldstateFields,
    advance_worldstate,
)
from engine.worldstate_snapshot import SymbolicWeather


@dataclass(frozen=True)
class Era:
    id: str = "era"
    resonance_baseline: float = 0.0
    drift_vector_magnitude: float = 2.0


class FlowerAdapter:
    def update_basin_geometry(self, flower_id, topology, pressure_profile, resonance_profile):
        return {basin_id: {"pressure": value} for basin_id, value in pressure_profile.items()}

    def resolve_collapse_events(self, flower_id, identity_snapshots, topology):
        return tuple(snapshot.identity_id for snapshot in identity_snapshots if topology.basins[snapshot.basin_id].flower_id == flower_id and snapshot.pressure_state is PressureState.OVERLOADED)

    def resolve_migration_flows(self, flower_id, identity_snapshots, topology):
        return tuple(snapshot.identity_id for snapshot in identity_snapshots if topology.basins[snapshot.basin_id].flower_id == flower_id and snapshot.migration_state.permitted)


class EraAdapter:
    def advance(self, era_state, flower_states, world_pressure_map, world_resonance_map):
        return Era(f"{era_state.id}-next", sum(world_resonance_map.resonance_by_flower.values()), era_state.drift_vector_magnitude)


def _snapshot(identity_id, basin_id, pressure, amplitude, state, permitted):
    return IdentityPressureSnapshot(
        identity_id, basin_id, pressure, pressure, 1.0, state, CollapseState.NONE,
        IdentityResonanceSignature(amplitude, 1.0, 1.0, 1.0, 0.0),
        IdentityMigrationDecision(permitted, 0.0, None, None, ()), 0.0, 1.0, False, False,
    )


def _topology():
    return BasinFlowerTopology(
        {"flower": FlowerTopology("flower", ("one", "two"))},
        {"one": BasinTopology("one", "flower", ("two",)), "two": BasinTopology("two", "flower", ("one",))},
    )


def _fields():
    return WorldstateFields(0.3, 0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0)


def test_worldstate_aggregates_snapshots_and_invokes_adapters():
    result = advance_worldstate(
        "tick", (
            _snapshot("one", "one", 0.2, 0.1, PressureState.LATENT, False),
            _snapshot("two", "two", 2.0, 0.5, PressureState.OVERLOADED, True),
        ), _topology(), FlowerAdapter(), EraAdapter(), Era(), _fields(),
    )
    assert result.era_id == "era-next"
    assert result.world_pressure_map.pressure_by_flower["flower"] == pytest.approx(2.2)
    assert result.world_resonance_map.resonance_by_flower["flower"] == pytest.approx(0.6)
    assert result.symbolic_weather is SymbolicWeather.STORM
    assert result.flower_states[0].collapse_events == ("two",)
    assert result.flower_states[0].migration_flows == ("two",)
    assert result.seasonal_resonance == pytest.approx(1.2)
    assert result.astral_alignment == pytest.approx(1.2)
    assert result.turbulence == 0.0 and result.density == 2.0 and result.drift == 1.0


def test_worldstate_rejects_unknown_snapshot_basin():
    with pytest.raises(ValueError, match="unknown snapshot basin"):
        advance_worldstate("tick", (_snapshot("bad", "missing", 0, 0, PressureState.LATENT, False),), _topology(), FlowerAdapter(), EraAdapter(), Era(), _fields())
