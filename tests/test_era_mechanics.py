import pytest

from engine.era_mechanics import EraMechanicsProfile, apply_era_mechanics
from engine.players import PlayerInfluenceConfig


def test_configurable_era_profile_scales_navigation_and_player_forces() -> None:
    velocity, config = apply_era_mechanics(
        EraMechanicsProfile("collapse", 0.5, 0.2, 2.0, 0.3, 3.0, 4.0),
        (2.0, -1.0),
        PlayerInfluenceConfig(1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0),
    )
    assert velocity == pytest.approx((1.0, -0.5))
    assert config.pressure_coefficient == 3.0
    assert config.resonance_coefficient == 4.0
    assert config.corridor_coefficient == 0.2
    assert config.collapse_damping_coefficient == 2.0
