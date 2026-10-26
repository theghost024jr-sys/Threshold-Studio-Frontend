import pytest

from engine.navigation import PlayerTopologyPosition, navigate_garden


def test_navigation_combines_topology_fields_with_spirit_and_collapse_effects() -> None:
    result = navigate_garden(
        PlayerTopologyPosition(0.4, 0.5, 0.6, "basin"),
        pressure_gradient=(1.0, 0.0),
        corridor_vector=(0.5, 1.0),
        rotational_vector=(0.5, 0.0),
        spirit_alignment=0.5,
        spirit_speed_coefficient=1.0,
        effective_pressure=0.1,
        collapse_threshold=0.2,
        collapse_slowdown=0.5,
        previous_pressure=0.6,
        basin_rim_pressure=0.5,
    )

    assert result.velocity == pytest.approx((0.0, 0.75))
    assert result.collapse_zone
    assert result.crossed_basin_rim
