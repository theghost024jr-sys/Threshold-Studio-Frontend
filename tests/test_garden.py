import pytest

from engine.garden import (
    GardenConfig,
    GardenFlowerState,
    calculate_garden_dynamics,
    is_macro_basin,
)
from engine.interactions import FlowerField


def test_garden_dynamics_superposes_world_physics() -> None:
    dynamics = calculate_garden_dynamics(
        [
            GardenFlowerState(FlowerField("a", 1.0, 1.0, 0.0, 0.3, 0.0), 0.4),
            GardenFlowerState(FlowerField("b", 0.5, 1.05, 0.0, -0.1, 0.0), 0.3),
            GardenFlowerState(FlowerField("c", 0.5, 1.3, 0.0, 0.2, 0.0), 0.1),
        ],
        migration_currents=[1.5, -0.5],
        collapse_wave_amplitude=1.1,
        macro_spirit_alignment=0.5,
        config=GardenConfig(0.1, 0.1, 0.5),
    )

    assert dynamics.pressure == pytest.approx(2.5)
    assert dynamics.rotation == pytest.approx(0.4)
    assert dynamics.immunity == pytest.approx(0.8)
    assert dynamics.remaining_collapse_wave == pytest.approx(0.3)
    assert dynamics.collapse_contagion
    assert dynamics.resonant_alliances == (("a", "b"),)
    assert dynamics.migration_current == pytest.approx(1.0)


def test_macro_basins_are_strict_pressure_minima() -> None:
    assert is_macro_basin(0.2, [0.3, 0.4])
    assert not is_macro_basin(0.3, [0.3, 0.4])
