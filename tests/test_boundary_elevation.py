import pytest

from engine.agataga import AgatagaSense
from engine.boundary_elevation import (
    BoundaryElevationConfig,
    decay_boundary_elevation,
    evaluate_boundary_elevation,
)
from engine.coherence_recovery import CoherenceRecovery
from engine.warden import IdentityField


def _config() -> BoundaryElevationConfig:
    return BoundaryElevationConfig(
        alignment_threshold=0.5,
        agataga_threshold=0.5,
        shimmer_threshold=0.5,
        coherence_recovery_threshold=0.5,
        saturation_score=1.5,
        departure_decay=0.25,
        collapse_immunity_coefficient=2.0,
        corridor_shaping_coefficient=3.0,
        basin_stabilization_coefficient=4.0,
        identity_amplification_coefficient=5.0,
        memory_imprint_coefficient=6.0,
        weather_modulation_coefficient=7.0,
        density_resistance_coefficient=8.0,
    )


def _recovery(value: float = 0.75) -> CoherenceRecovery:
    return CoherenceRecovery(value, value, value, value, value, value)


def test_boundary_elevation_is_local_and_scales_from_alignment_surplus() -> None:
    elevation = evaluate_boundary_elevation(
        zone_id="survival-frontier",
        warden=IdentityField(1, 0, 0, 0, 0),
        player=IdentityField(1, 0, 0, 0, 0),
        player_is_in_zone=True,
        agataga_sense=AgatagaSense(0.75),
        shimmer_level=0.75,
        coherence_recovery=_recovery(),
        config=_config(),
    )

    assert elevation.active is True
    assert elevation.agataga_perceived is True
    assert elevation.shimmer_active is True
    assert elevation.recovery_stable is True
    assert elevation.coherence == pytest.approx(0.5)
    assert elevation.effects.collapse_immunity == pytest.approx(1.0)
    assert elevation.effects.weather_phase_modulation == pytest.approx(3.5)


def test_boundary_elevation_requires_strict_threshold_and_presence() -> None:
    absent = evaluate_boundary_elevation(
        zone_id="survival-frontier",
        warden=IdentityField(1, 0, 0, 0, 0),
        player=IdentityField(1, 0, 0, 0, 0),
        player_is_in_zone=False,
        agataga_sense=AgatagaSense(0.75),
        shimmer_level=0.75,
        coherence_recovery=_recovery(),
        config=_config(),
    )
    threshold = evaluate_boundary_elevation(
        zone_id="survival-frontier",
        warden=IdentityField(0.5, 0, 0, 0, 0),
        player=IdentityField(1, 0, 0, 0, 0),
        player_is_in_zone=True,
        agataga_sense=AgatagaSense(0.75),
        shimmer_level=0.75,
        coherence_recovery=_recovery(),
        config=_config(),
    )

    assert absent.active is False
    assert absent.effects.density_resistance == 0.0
    assert threshold.active is False


def test_boundary_elevation_requires_agataga_sense_and_shimmer() -> None:
    low_agataga = evaluate_boundary_elevation(
        zone_id="survival-frontier",
        warden=IdentityField(1, 0, 0, 0, 0),
        player=IdentityField(1, 0, 0, 0, 0),
        player_is_in_zone=True,
        agataga_sense=AgatagaSense(0.5),
        shimmer_level=0.75,
        coherence_recovery=_recovery(),
        config=_config(),
    )
    low_shimmer = evaluate_boundary_elevation(
        zone_id="survival-frontier",
        warden=IdentityField(1, 0, 0, 0, 0),
        player=IdentityField(1, 0, 0, 0, 0),
        player_is_in_zone=True,
        agataga_sense=AgatagaSense(0.75),
        shimmer_level=0.5,
        coherence_recovery=_recovery(),
        config=_config(),
    )

    assert low_agataga.identity_aligned is True
    assert low_agataga.agataga_perceived is False
    assert low_agataga.active is False
    assert low_shimmer.shimmer_active is False
    assert low_shimmer.active is False


def test_boundary_elevation_requires_coherence_recovery() -> None:
    elevation = evaluate_boundary_elevation(
        zone_id="survival-frontier",
        warden=IdentityField(1, 0, 0, 0, 0),
        player=IdentityField(1, 0, 0, 0, 0),
        player_is_in_zone=True,
        agataga_sense=AgatagaSense(0.75),
        shimmer_level=0.75,
        coherence_recovery=_recovery(0.5),
        config=_config(),
    )

    assert elevation.recovery_stable is False
    assert elevation.active is False


def test_refusal_hard_blocks_boundary_elevation() -> None:
    elevation = evaluate_boundary_elevation(
        zone_id="survival-frontier",
        warden=IdentityField(1, 0, 0, 0, 0),
        player=IdentityField(1, 0, 0, 0, 0),
        player_is_in_zone=True,
        agataga_sense=AgatagaSense(1.0),
        shimmer_level=1.0,
        coherence_recovery=_recovery(),
        config=_config(),
        player_refusing=True,
    )

    assert elevation.identity_aligned is True
    assert elevation.agataga_perceived is True
    assert elevation.shimmer_active is True
    assert elevation.player_refusing is True
    assert elevation.active is False


def test_departure_decays_coherence_but_never_leaves_effects_active() -> None:
    elevation = evaluate_boundary_elevation(
        zone_id="survival-frontier",
        warden=IdentityField(1, 0, 0, 0, 0),
        player=IdentityField(1.5, 0, 0, 0, 0),
        player_is_in_zone=True,
        agataga_sense=AgatagaSense(0.75),
        shimmer_level=0.75,
        coherence_recovery=_recovery(),
        config=_config(),
    )

    departed = decay_boundary_elevation(elevation, _config())

    assert departed.active is False
    assert departed.coherence == pytest.approx(0.75)
    assert departed.effects.basin_stabilization == 0.0


def test_boundary_elevation_rejects_invalid_saturation_range() -> None:
    with pytest.raises(ValueError, match="saturation_score"):
        BoundaryElevationConfig(
            alignment_threshold=1.0,
            agataga_threshold=0.5,
            shimmer_threshold=0.5,
            coherence_recovery_threshold=0.5,
            saturation_score=1.0,
            departure_decay=0.1,
            collapse_immunity_coefficient=1.0,
            corridor_shaping_coefficient=1.0,
            basin_stabilization_coefficient=1.0,
            identity_amplification_coefficient=1.0,
            memory_imprint_coefficient=1.0,
            weather_modulation_coefficient=1.0,
            density_resistance_coefficient=1.0,
        )
