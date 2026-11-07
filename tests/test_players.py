import pytest

from engine.players import PlayerForce, PlayerInfluenceConfig, apply_player_influence


def test_player_influence_is_a_first_class_garden_force() -> None:
    result = apply_player_influence(
        PlayerForce(0.5, 0.8, 1.0),
        PlayerInfluenceConfig(2.0, 0.5, 0.5, 2.0, 1.0, 0.25, 0.1),
        slit_openness=0.5, garden_pressure=1.0, basin_pressure=0.3,
        corridor_curvature=0.1, collapse_wave=0.8, halo_angular_velocity=0.2,
    )
    assert result.pressure_emission == pytest.approx(1.0)
    assert result.resonance_wave == pytest.approx(0.4)
    assert result.slit_openness == pytest.approx(0.7)
    assert result.garden_pressure == pytest.approx(2.0)
    assert result.basin_pressure == pytest.approx(1.3)
    assert result.collapse_wave == pytest.approx(0.3)
    assert result.halo_angular_velocity == pytest.approx(0.3)
    assert result.identity_delta == pytest.approx(0.14)
