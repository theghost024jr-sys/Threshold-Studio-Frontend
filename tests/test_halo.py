from math import tanh, tau

import pytest

from engine.halo import (
    HaloRotationConfig,
    HaloState,
    advance_halo_rotation,
    calculate_halo_rotation,
    calculate_wave_coherence,
)
from engine.metabolism import ResonanceWave


def _config() -> HaloRotationConfig:
    return HaloRotationConfig(
        minimum_orbit=13.0,
        angular_sensitivity=2.0,
        maximum_angular_speed=0.5,
        coherence_damping=0.5,
        wave_rotation_sensitivity=0.5,
    )


def test_halo_rotation_uses_a_saturating_pressure_gradient_response() -> None:
    rotation = calculate_halo_rotation(
        orbit_radius=13.0,
        angular_pressure_gradient=0.5,
        waves=[ResonanceWave("a", "b", 0.2), ResonanceWave("b", "c", 0.3)],
        config=_config(),
    )

    assert rotation.active
    assert rotation.wave_coherence == 1.0
    assert rotation.coherence_multiplier == 1.0
    assert rotation.angular_delta == pytest.approx(0.5 * tanh(2.0))


def test_opposing_waves_damp_halo_rotation() -> None:
    rotation = calculate_halo_rotation(
        orbit_radius=13.0,
        angular_pressure_gradient=0.5,
        waves=[ResonanceWave("a", "b", 0.2), ResonanceWave("b", "c", -0.2)],
        config=_config(),
    )

    assert rotation.wave_coherence == 0.0
    assert rotation.coherence_multiplier == 0.5
    assert rotation.angular_delta == pytest.approx(0.25 * tanh(2.0))


def test_configurable_halo_boundary_prevents_inner_orbit_rotation() -> None:
    rotation = calculate_halo_rotation(
        orbit_radius=12.9,
        angular_pressure_gradient=0.5,
        waves=[],
        config=_config(),
    )

    assert not rotation.active
    assert rotation.angular_delta == 0.0
    assert calculate_wave_coherence([]) == 1.0


def test_hybrid_halo_rotation_accumulates_torque_with_cap_and_downstream_effects() -> None:
    update = advance_halo_rotation(
        HaloState(angular_velocity=0.4, angular_position=6.2),
        orbit_radius=13.0,
        node_mass=0.8,
        angular_pressure_gradient=0.5,
        waves=[ResonanceWave("a", "b", 0.2), ResonanceWave("b", "c", 0.3)],
        config=_config(),
        inner_coupling=0.2,
        cluster_coupling=0.3,
        corridor_curvature_coefficient=0.4,
    )

    assert update.net_wave == 0.5
    assert update.angular_acceleration == pytest.approx(1.25)
    assert update.state.angular_velocity == 0.5
    assert update.state.angular_position == pytest.approx((6.2 + 0.5) % tau)
    assert update.rotational_force == pytest.approx(2.6)
    assert update.inner_angular_delta == pytest.approx(0.1)
    assert update.cluster_angular_delta == pytest.approx(0.15)
    assert update.corridor_curvature == pytest.approx(0.2)


def test_hybrid_halo_rotation_damps_opposing_waves() -> None:
    update = advance_halo_rotation(
        HaloState(angular_velocity=0.0, angular_position=0.0),
        orbit_radius=13.0,
        node_mass=1.0,
        angular_pressure_gradient=0.5,
        waves=[ResonanceWave("a", "b", 0.2), ResonanceWave("b", "c", -0.2)],
        config=_config(),
    )

    assert update.coherence_multiplier == 0.5
    assert update.angular_acceleration == pytest.approx(0.5)
    assert update.state.angular_velocity == pytest.approx(0.5)
