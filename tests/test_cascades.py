from math import exp

import pytest

from engine.basins import IdentityBasin
from engine.cascades import (
    CollapseCascadeConfig,
    apply_collapse_effects,
    collapse_basin,
    collapses_from_wave,
    halo_has_collapsed,
    ignite_collapse_wave,
    order_cluster_collapse,
    propagate_collapse_wave,
)
from engine.clusters import NodeOrbitProfile
from engine.metabolism import MetabolicState


def _config() -> CollapseCascadeConfig:
    return CollapseCascadeConfig(
        gradient_threshold=0.3,
        wave_amplification=2.0,
        decay_constant=0.25,
        slit_failure=0.2,
        charge_drain=0.3,
        resonance_inversion=0.8,
        migration_coefficient=2.0,
        basin_curvature_loss=0.5,
        halo_failure_threshold=0.2,
    )


def test_collapse_wave_ignites_from_collapsed_pressure_and_propagates() -> None:
    wave = ignite_collapse_wave(
        collapsed_effective_pressure=0.1,
        collapse_threshold=0.2,
        neighbor_effective_pressure=0.5,
        direction=(1.0, 0.0),
        config=_config(),
    )

    assert wave is not None
    assert wave.amplitude == pytest.approx(0.8)
    propagated = propagate_collapse_wave(wave, 0.5, 2.0, _config())
    assert propagated.amplitude == pytest.approx(0.4 * exp(-0.5))
    assert collapses_from_wave(0.3, wave, 0.2)


def test_collapse_effects_shut_down_metabolism_and_invert_harmonics() -> None:
    wave = ignite_collapse_wave(0.1, 0.2, 0.5, (1.0, -0.5), _config())

    assert wave is not None
    effects = apply_collapse_effects(
        MetabolicState(charge=0.4, slit_openness=0.5, resonance=0.6),
        wave,
        corridor_vector=(1.0, 2.0),
        config=_config(),
    )
    assert effects.state.charge == pytest.approx(0.1)
    assert effects.state.slit_openness == pytest.approx(0.3)
    assert effects.resonance_phase == pytest.approx(-0.8)
    assert effects.migration_vector == pytest.approx((2.6, 1.2))


def test_collapse_flattens_basins_breaks_halos_and_orders_outer_cluster_nodes_first() -> None:
    basin = collapse_basin(
        IdentityBasin("frontier", 0.2, 0.8, 1.0, 5.0),
        center_wave_amplitude=0.1,
        rim_wave_amplitude=0.2,
        config=_config(),
    )
    wave = ignite_collapse_wave(0.1, 0.2, 0.5, (1.0, 0.0), _config())
    members = [
        NodeOrbitProfile("core", 0.5, 0.0, 0.0, 0.5, 3.0, 0.0),
        NodeOrbitProfile("outer", 0.5, 0.0, 0.0, 0.5, 13.0, 0.0),
    ]

    assert basin.center_pressure == pytest.approx(0.1)
    assert basin.rim_pressure == pytest.approx(0.6)
    assert basin.curvature == pytest.approx(0.95)
    assert wave is not None
    assert halo_has_collapsed(0.5, wave, 0.2)
    assert [member.node_id for member in order_cluster_collapse(members)] == ["outer", "core"]
