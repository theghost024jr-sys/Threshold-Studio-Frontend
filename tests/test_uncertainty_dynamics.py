import pytest

from engine.agataga import AgatagaSense
from engine.coherence_recovery import CoherenceRecovery
from engine.uncertainty_dynamics import (
    SoftElevationConfig,
    UncertaintyTickInputs,
    UncertaintyWorldstate,
    apply_uncertainty_effects,
    build_soft_warden,
    evaluate_soft_elevation,
    advance_uncertainty_worldstate,
    resolve_hesitation_zone,
)
from engine.warden import IdentityField


def _worldstate(**changes: float) -> UncertaintyWorldstate:
    values = {
        "pressure": 1.0,
        "resonance": 1.0,
        "flow": 1.0,
        "density": 1.0,
        "shimmer": 1.0,
        "uncertainty": 0.0,
        "coherence_recovery": 0.0,
        "misalignment_memory": 0.0,
    }
    values.update(changes)
    return UncertaintyWorldstate(**values)


def test_tick_updates_uncertainty_and_recovery_from_prior_state() -> None:
    next_state = advance_uncertainty_worldstate(
        _worldstate(uncertainty=0.2, coherence_recovery=0.1, misalignment_memory=0.5),
        UncertaintyTickInputs(
            contradiction=0.1,
            grief_weight=0.0,
            refusal_active=False,
            hesitation_zone_proximity=0.0,
            collapse_pressure=0.0,
            resonance_instability=0.0,
        ),
    )

    assert next_state.uncertainty == pytest.approx(0.34)
    assert next_state.coherence_recovery == pytest.approx(0.18)


def test_uncertainty_and_recovery_apply_the_canonical_driver_effects() -> None:
    effects = apply_uncertainty_effects(
        _worldstate(
            uncertainty=0.6,
            coherence_recovery=0.5,
            misalignment_memory=0.2,
        )
    )

    assert effects.worldstate.pressure == pytest.approx(0.82 * 1.1)
    assert effects.worldstate.resonance == pytest.approx(0.76 * 1.15)
    assert effects.worldstate.flow == pytest.approx(0.88 * 1.1)
    assert effects.worldstate.density == pytest.approx(0.94 * 1.05)
    assert effects.worldstate.shimmer == pytest.approx(1.12 * 0.9)
    assert effects.worldstate.misalignment_memory == pytest.approx(0.32 * 0.85)
    assert effects.interference_mode == "soft_alignment"
    assert effects.warden_activation_mode == "soft_coherent"


def test_soft_warden_and_soft_elevation_are_partial_without_escalation() -> None:
    soft_warden = build_soft_warden(
        identity="survivor",
        density=2.0,
        shimmer=0.5,
        drift=(2.0, -2.0),
        activation_mode="soft",
    )
    elevation = evaluate_soft_elevation(
        warden_active=True,
        warden=IdentityField(1.0, 0.0, 0.0, 0.0, 0.0),
        player=IdentityField(1.0, 0.0, 0.0, 0.0, 0.0),
        agataga_sense=AgatagaSense(0.75),
        shimmer_level=0.75,
        uncertainty=0.75,
        coherence_recovery=CoherenceRecovery(0.75, 0, 0, 0, 0, 0),
        player_refusing=False,
        config=SoftElevationConfig(0.5, 0.5, 0.5, 0.5, 0.5),
    )

    assert soft_warden is not None
    assert soft_warden.intensity == pytest.approx(0.5)
    assert soft_warden.stimulus_vector == (1.0, -1.0)
    assert elevation.active is True
    assert elevation.contract_effect == "none"
    assert elevation.topology_update == "none"
    assert elevation.era_drift == "none"


def test_hesitation_zone_pauses_escalation_and_halves_local_drivers() -> None:
    zone = resolve_hesitation_zone(
        _worldstate(
            pressure=2.0,
            resonance=4.0,
            flow=6.0,
            uncertainty=0.7,
            coherence_recovery=0.2,
            misalignment_memory=0.5,
        )
    )

    assert zone.active is True
    assert zone.contracts_disabled is True
    assert zone.elevation_disabled is True
    assert zone.topology_rewrite_disabled is True
    assert zone.era_drift_paused is True
    assert zone.warden_activation_mode == "soft"
    assert (zone.pressure, zone.resonance, zone.flow) == (1.0, 2.0, 3.0)
