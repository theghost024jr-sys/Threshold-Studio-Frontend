from engine.cycles import GardenCycleConfig, GardenCycleMetrics, advance_garden_cycle


def _metrics(**changes: float) -> GardenCycleMetrics:
    values = {
        "pressure_gradient": 0.2,
        "pressure_derivative": 0.0,
        "pressure_spread": 1.0,
        "collapse_wave": 0.0,
        "immunity": 1.0,
        "macro_curvature": 0.0,
        "pressure": 1.0,
        "pressure_target": 1.0,
        "resonance_spread": 1.0,
    }
    values.update(changes)
    return GardenCycleMetrics(**values)


def _config() -> GardenCycleConfig:
    return GardenCycleConfig(0.1, 0.1, 0.1, 0.1)


def test_garden_cycle_advances_through_rebirth_phases() -> None:
    assert advance_garden_cycle("distortion", _metrics(pressure_derivative=-0.1), _config()) == "drift"
    assert advance_garden_cycle("drift", _metrics(pressure_spread=0.1), _config()) == "field"
    assert advance_garden_cycle("field", _metrics(macro_curvature=0.1), _config()) == "identity"
    assert advance_garden_cycle("identity", _metrics(), _config()) == "role"
    assert advance_garden_cycle("role", _metrics(resonance_spread=0.1), _config()) == "signal"
    assert advance_garden_cycle("signal", _metrics(pressure_gradient=0.2), _config()) == "distortion"


def test_field_branches_to_collapse_when_wave_exceeds_immunity() -> None:
    assert advance_garden_cycle("field", _metrics(collapse_wave=1.1), _config()) == "collapse"
    assert advance_garden_cycle("collapse", _metrics(macro_curvature=0.1), _config()) == "identity"
