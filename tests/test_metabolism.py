from math import exp

import pytest

from engine.metabolism import (
    MetabolicState,
    OrbitThresholds,
    ResonanceWave,
    advance_metabolism,
    apply_resonance_wave,
    calculate_angular_motion,
    calculate_orbit_motion,
    calculate_radial_motion,
    calculate_slit_dynamics,
    emit_resonance_wave,
    calculate_pressure,
    evaluate_orbit_pressure,
    pressure_gradient,
    is_harmonic_cluster,
)


def test_pressure_follows_charge_slit_resonance_and_demand_product() -> None:
    reading = calculate_pressure(
        MetabolicState(
            charge=0.5,
            slit_openness=0.8,
            resonance=0.25,
            circuit_mirror_gain=0.5,
            target_charge=0.9,
        )
    )

    assert reading.demand == pytest.approx(0.2)
    assert reading.base_pressure == pytest.approx(0.5)
    assert reading.total_pressure == pytest.approx(0.6)


def test_discharged_node_has_no_pressure_regardless_of_hunger() -> None:
    reading = calculate_pressure(
        MetabolicState(
            charge=0.0,
            slit_openness=1.0,
            resonance=1.0,
            circuit_mirror_gain=0.5,
        )
    )

    assert reading.demand == 0.5
    assert reading.total_pressure == 0.0


def test_recovery_pending_tick_turns_hunger_into_charge_before_pressure() -> None:
    tick = advance_metabolism(
        MetabolicState(
            charge=0.0,
            slit_openness=0.0,
            resonance=0.0,
            circuit_mirror_gain=0.5,
            target_charge=1.0,
        ),
        recovery_coefficient=0.5,
        slit_openness=0.8,
        resonance=0.25,
    )

    assert tick.demand == 0.5
    assert tick.recovered_state.charge == 0.25
    assert tick.next_demand == pytest.approx(0.375)
    assert tick.pressure.total_pressure == pytest.approx(0.34375)


def test_slit_dynamics_link_alignment_to_intake_resonance_and_charge() -> None:
    slit = calculate_slit_dynamics(
        alignment=0.5,
        environmental_energy=0.8,
        neighbor_coupling=0.8,
        resonance_sensitivity=0.5,
    )
    tick = advance_metabolism(
        MetabolicState(
            charge=0.0,
            slit_openness=0.0,
            resonance=0.0,
            circuit_mirror_gain=0.5,
        ),
        recovery_coefficient=0.5,
        slit_openness=slit.slit_openness,
        resonance=slit.resonance,
        intake=slit.intake,
        intake_efficiency=0.5,
    )

    assert slit.slit_openness == pytest.approx(0.25)
    assert slit.intake == pytest.approx(0.2)
    assert slit.resonance == pytest.approx(0.1)
    assert tick.recovered_state.charge == pytest.approx(0.35)
    assert tick.pressure.total_pressure == pytest.approx(0.12753125)


def test_metabolism_caps_charge_at_normalized_capacity() -> None:
    tick = advance_metabolism(
        MetabolicState(charge=0.9, slit_openness=1.0, resonance=0.0),
        recovery_coefficient=1.0,
        intake=1.0,
        intake_efficiency=1.0,
    )

    assert tick.recovered_state.charge == 1.0


def test_orbit_multiplier_and_thresholds_classify_drift_and_collapse() -> None:
    thresholds = OrbitThresholds(drift=0.7, collapse=0.4, multiplier=1.2)
    drifting = evaluate_orbit_pressure(
        calculate_pressure(
            MetabolicState(charge=0.5, slit_openness=0.8, resonance=0.25, circuit_mirror_gain=0.5, target_charge=0.9)
        ),
        thresholds,
    )
    collapsing = evaluate_orbit_pressure(
        calculate_pressure(MetabolicState(charge=0.1, slit_openness=0.1, resonance=0.0)),
        thresholds,
    )

    assert drifting.effective_pressure == pytest.approx(0.72)
    assert drifting.state == "drift"
    assert collapsing.state == "collapse"


def test_pressure_gradient_is_signed_between_neighboring_nodes() -> None:
    higher = calculate_pressure(
        MetabolicState(charge=1.0, slit_openness=1.0, resonance=0.0)
    )
    lower = calculate_pressure(
        MetabolicState(charge=0.5, slit_openness=1.0, resonance=0.0)
    )

    assert pressure_gradient(higher, lower) == pytest.approx(0.25)
    assert pressure_gradient(lower, higher) == pytest.approx(-0.25)


def test_resonance_wave_emits_above_threshold_then_decays_with_distance() -> None:
    source = calculate_pressure(
        MetabolicState(
            charge=1.0,
            slit_openness=1.0,
            resonance=0.0,
            circuit_mirror_gain=0.0,
        )
    )
    neighbor = calculate_pressure(
        MetabolicState(
            charge=0.5,
            slit_openness=1.0,
            resonance=0.0,
            circuit_mirror_gain=0.0,
        )
    )
    wave = emit_resonance_wave(
        "source",
        "neighbor",
        source,
        neighbor,
        source_resonance_field=0.8,
        wave_threshold=0.2,
        propagation_coefficient=0.5,
        distance=2.0,
        decay_constant=0.25,
    )

    assert wave is not None
    assert wave.amplitude == pytest.approx(0.2 * exp(-0.5))
    assert (
        emit_resonance_wave(
            "source",
            "neighbor",
            source,
            neighbor,
            source_resonance_field=0.8,
            wave_threshold=0.5,
            propagation_coefficient=0.5,
            distance=2.0,
            decay_constant=0.25,
        )
        is None
    )


def test_resonance_wave_modulates_charge_and_slit_with_normalized_bounds() -> None:
    wave = ResonanceWave(source_id="source", target_id="target", amplitude=0.4)
    modulated = apply_resonance_wave(
        MetabolicState(charge=0.7, slit_openness=0.8, resonance=0.5),
        wave,
        charge_coefficient=1.0,
        slit_coefficient=1.0,
    )
    drained = apply_resonance_wave(
        MetabolicState(charge=0.1, slit_openness=0.1, resonance=0.5),
        ResonanceWave(source_id="source", target_id="target", amplitude=-0.4),
        charge_coefficient=1.0,
        slit_coefficient=1.0,
    )

    assert modulated.charge == 1.0
    assert modulated.slit_openness == 1.0
    assert drained.charge == 0.0
    assert drained.slit_openness == 0.0


def test_cluster_harmonics_compare_wave_amplitudes_with_tolerance() -> None:
    waves = [
        ResonanceWave("a", "b", 0.2),
        ResonanceWave("b", "c", 0.23),
    ]

    assert is_harmonic_cluster(waves, tolerance=0.05)
    assert not is_harmonic_cluster(waves, tolerance=0.02)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("charge", -0.01),
        ("resonance", 1.01),
        ("circuit_mirror_gain", -0.01),
    ],
)
def test_metabolic_state_rejects_invalid_values(field: str, value: float) -> None:
    values = {
        "charge": 1.0,
        "slit_openness": 1.0,
        "resonance": 1.0,
        "circuit_mirror_gain": 1.0,
        "target_charge": 1.0,
    }
    values[field] = value

    with pytest.raises(ValueError):
        MetabolicState(**values)


def test_orbit_thresholds_require_a_stable_band_between_collapse_and_drift() -> None:
    with pytest.raises(ValueError, match="drift threshold"):
        OrbitThresholds(drift=0.4, collapse=0.4, multiplier=1.0)


def test_radial_motion_uses_quadratic_collapse_and_square_root_drift() -> None:
    thresholds = OrbitThresholds(drift=0.7, collapse=0.4, multiplier=1.0)
    collapsed = evaluate_orbit_pressure(
        calculate_pressure(
            MetabolicState(
                charge=0.2,
                slit_openness=1.0,
                resonance=0.0,
                circuit_mirror_gain=0.0,
            )
        ),
        thresholds,
    )
    stable = evaluate_orbit_pressure(
        calculate_pressure(
            MetabolicState(
                charge=0.5,
                slit_openness=1.0,
                resonance=0.0,
                circuit_mirror_gain=0.0,
            )
        ),
        thresholds,
    )
    drifting = evaluate_orbit_pressure(
        calculate_pressure(
            MetabolicState(
                charge=1.0,
                slit_openness=1.0,
                resonance=0.0,
                circuit_mirror_gain=0.0,
            )
        ),
        thresholds,
    )

    assert calculate_radial_motion(collapsed, thresholds, 2.0, 3.0) == pytest.approx(-0.08)
    assert calculate_radial_motion(stable, thresholds, 2.0, 3.0) == 0.0
    assert calculate_radial_motion(drifting, thresholds, 2.0, 3.0) == pytest.approx(
        3.0 * 0.3**0.5
    )


def test_orbit_motion_includes_angular_pressure_gradient() -> None:
    thresholds = OrbitThresholds(drift=0.7, collapse=0.4, multiplier=1.0)
    orbit_pressure = evaluate_orbit_pressure(
        calculate_pressure(MetabolicState(charge=1.0, slit_openness=1.0, resonance=0.0)),
        thresholds,
    )
    motion = calculate_orbit_motion(
        orbit_pressure,
        thresholds,
        collapse_sensitivity=2.0,
        drift_sensitivity=3.0,
        angular_pressure_gradient=-0.4,
        angular_sensitivity=0.5,
    )

    assert motion.radial_delta == pytest.approx(3.0 * 0.3**0.5)
    assert motion.angular_delta == pytest.approx(-0.2)
    assert calculate_angular_motion(0.4, 0.5) == pytest.approx(0.2)


def test_recovery_coefficient_is_normalized() -> None:
    state = MetabolicState(charge=0.0, slit_openness=0.0, resonance=0.0)

    with pytest.raises(ValueError, match="recovery_coefficient"):
        advance_metabolism(state, recovery_coefficient=1.01)


def test_slit_dynamics_requires_valid_normalized_inputs() -> None:
    with pytest.raises(ValueError, match="alignment"):
        calculate_slit_dynamics(-0.1, 1.0, 1.0, 1.0)
