from math import exp

import pytest

from engine.storms import (
    StormConfig,
    calculate_storm_effects,
    ignite_storm,
    propagate_storm,
)


def _config() -> StormConfig:
    return StormConfig(
        pressure_gradient_threshold=0.4,
        amplification_coefficient=2.0,
        decay_constant=0.25,
        rotation_coefficient=0.5,
        slit_coefficient=0.25,
        migration_coefficient=2.0,
        cluster_wave_tolerance=0.05,
    )


def test_storm_ignites_above_gradient_threshold_and_propagates_through_resonance() -> None:
    burst = ignite_storm(pressure_gradient=-0.5, direction=(1.0, 0.0), config=_config())

    assert burst is not None
    assert burst.amplitude == 1.0
    propagated = propagate_storm(
        burst,
        source_resonance_field=0.8,
        distance=2.0,
        config=_config(),
    )
    assert propagated.amplitude == pytest.approx(0.8 * exp(-0.5))
    assert ignite_storm(0.4, (1.0, 0.0), _config()) is None


def test_storm_effects_drive_halo_slit_cluster_and_migration_systems() -> None:
    burst = ignite_storm(pressure_gradient=0.5, direction=(1.0, -0.5), config=_config())

    assert burst is not None
    effects = calculate_storm_effects(
        burst,
        corridor_vector=(2.0, 1.0),
        cluster_wave_amplitude=1.02,
        config=_config(),
    )

    assert effects.halo_angular_acceleration == 0.5
    assert effects.slit_delta == 0.25
    assert effects.migration_vector == pytest.approx((4.0, 0.0))
    assert effects.cluster_interaction == "binding"


def test_opposing_storm_wave_shatters_cluster_harmonics() -> None:
    burst = ignite_storm(pressure_gradient=0.5, direction=(1.0, 0.0), config=_config())

    assert burst is not None
    effects = calculate_storm_effects(
        burst,
        corridor_vector=(0.0, 0.0),
        cluster_wave_amplitude=-1.02,
        config=_config(),
    )

    assert effects.cluster_interaction == "shattering"
