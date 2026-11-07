import pytest

from engine.basins import (
    IdentityBasin,
    classify_basin_role,
    crosses_basin_rim,
    deform_basin,
    is_local_minimum,
)


def test_identity_basin_measures_depth_and_classifies_fib_roles() -> None:
    core = IdentityBasin("core", 0.2, 0.8, 1.0, 2.0)
    frontier = IdentityBasin("frontier", 0.4, 0.6, 0.1, 5.0)
    halo = IdentityBasin("halo", 0.3, 0.5, 1.0, 13.0)
    saddle = IdentityBasin("saddle", 0.3, 0.5, -0.1, 13.0)

    assert core.depth == pytest.approx(0.6)
    assert classify_basin_role(core) == "core"
    assert classify_basin_role(frontier) == "frontier"
    assert classify_basin_role(halo) == "halo"
    assert classify_basin_role(saddle) == "saddle"


def test_local_minimum_and_rim_crossing_are_strict_topology_boundaries() -> None:
    assert is_local_minimum(0.2, [0.3, 0.4])
    assert not is_local_minimum(0.3, [0.3, 0.4])
    assert crosses_basin_rim(0.4, 0.6, 0.5)
    assert crosses_basin_rim(0.6, 0.4, 0.5)
    assert not crosses_basin_rim(0.4, 0.49, 0.5)


def test_storm_and_spirit_fields_deform_basin_depth() -> None:
    basin = IdentityBasin("frontier", 0.2, 0.8, 0.1, 5.0)
    deformed = deform_basin(
        basin,
        center_storm_amplitude=0.1,
        rim_storm_amplitude=-0.1,
        spirit_alignment=0.5,
        spirit_pressure_coefficient=0.2,
    )

    assert deformed.center_pressure == pytest.approx(0.33)
    assert deformed.rim_pressure == pytest.approx(0.77)
    assert deformed.depth == pytest.approx(0.44)
