from engine.contract_worldstate import make_worldstate_contract_view
from engine.identity_migration import IdentityMigrationDecision
from engine.identity_pressure_map import CollapseState, IdentityPressureSnapshot, PressureState
from engine.identity_resonance import IdentityResonanceSignature
from engine.player_contracts import FlowerContractState, PlayerFlowerContract
from engine.worldstate_snapshot import SymbolicWeather, WorldPressureMap, WorldResonanceMap, WorldstateSnapshot


def _identity() -> IdentityPressureSnapshot:
    return IdentityPressureSnapshot(
        "identity", "basin", 1.0, 1.0, 2.0, PressureState.REVEALED,
        CollapseState.NONE, IdentityResonanceSignature(0.5, 1, 1, 1, 0),
        IdentityMigrationDecision(True, 0.5, "basin", "direct", ()),
        0.2, 0.8, False, False,
    )


def _world(weather: SymbolicWeather) -> WorldstateSnapshot:
    return WorldstateSnapshot(
        "tick", "era", (), WorldPressureMap({}, {}), WorldResonanceMap({}, {}),
        weather, 0.0, 0.0, 0.1, 0.2, 0.3,
    )


def _contract() -> PlayerFlowerContract:
    flower = FlowerContractState(0.1, 1, 0.2, 0.5, 0.4)
    return PlayerFlowerContract(True, ("resonance", "spirit"), "resonance", {"resonance": 1.0, "spirit": 0.5}, flower)


def test_worldstate_contract_view_preserves_contract_and_identity_fields():
    identity, contract, world = _identity(), _contract(), _world(SymbolicWeather.CLEAR)
    view = make_worldstate_contract_view(identity=identity, world=world, contract=contract, flower_id="flower")

    assert (view.identity_id, view.basin_id, view.flower_id) == ("identity", "basin", "flower")
    assert view.accepted is contract.accepted
    assert view.dominant_mode == contract.dominant_mode
    assert view.types == contract.types
    assert view.scores == contract.scores
    assert (view.weather, view.era_id, view.turbulence, view.density, view.drift) == ("clear", "era", 0.1, 0.2, 0.3)


def test_worldstate_changes_context_without_re_evaluating_contract():
    identity, contract = _identity(), _contract()
    clear = make_worldstate_contract_view(identity=identity, world=_world(SymbolicWeather.CLEAR), contract=contract, flower_id="flower")
    storm = make_worldstate_contract_view(identity=identity, world=_world(SymbolicWeather.STORM), contract=contract, flower_id="flower")

    assert clear.weather == "clear" and storm.weather == "storm"
    assert (clear.accepted, clear.dominant_mode, clear.types, clear.scores) == (storm.accepted, storm.dominant_mode, storm.types, storm.scores)
