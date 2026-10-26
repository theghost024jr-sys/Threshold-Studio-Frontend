import pytest

from engine.immunity import ImmunityConfig, calculate_collapse_immunity


def test_collapse_immunity_sums_resilience_absorbs_waves_and_redirects_with_halo() -> None:
    result = calculate_collapse_immunity(
        basin_depth=0.5,
        cluster_cohesion=1.0,
        halo_angular_velocity=-2.0,
        resonance_field=0.5,
        spirit_alignment=0.5,
        collapse_wave_amplitude=1.0,
        config=ImmunityConfig(1.0, 0.2, 0.1, 0.2, 0.2, 0.3),
    )

    assert result.total == pytest.approx(1.3)
    assert result.remaining_wave == 0.0
    assert result.neutralized
    assert result.redirection_angle == pytest.approx(-0.6)
