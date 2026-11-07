import pytest

from engine.metabolism import MetabolicState, advance_metabolism, calculate_pressure
from engine.spirit import (
    SpiritAlignmentConfig,
    SpiritField,
    apply_spirit_alignment,
)


def _config() -> SpiritAlignmentConfig:
    return SpiritAlignmentConfig(
        slit_coefficient=0.5,
        charge_coefficient=0.2,
        resonance_coefficient=0.5,
        pressure_coefficient=0.5,
        frequency_tolerance=0.1,
        migration_threshold=0.6,
        migration_coefficient=2.0,
        capture_coefficient=0.8,
        rotation_coefficient=0.5,
    )


def test_spirit_alignment_modulates_metabolism_force_and_navigation() -> None:
    state = MetabolicState(
        charge=0.5,
        slit_openness=0.5,
        resonance=0.4,
        circuit_mirror_gain=0.0,
    )
    effects = apply_spirit_alignment(
        state,
        calculate_pressure(state),
        node_resonance_frequency=1.0,
        corridor_vector=(1.0, 2.0),
        field=SpiritField(0.8, 1.05, (0.5, -0.25)),
        config=_config(),
    )

    assert effects.state.slit_openness == pytest.approx(0.7)
    assert effects.frequency_locked
    assert effects.state.resonance == pytest.approx(0.56)
    assert effects.charge_boost == pytest.approx(0.16)
    assert effects.pressure.total_pressure == pytest.approx(0.49)
    assert effects.migration_active
    assert effects.migration_vector == pytest.approx((2.0, 1.5))
    assert effects.capture_weight == pytest.approx(0.64)
    assert effects.angular_velocity_multiplier == pytest.approx(1.4)


def test_spirit_charge_boost_enters_recovery_pending_tick() -> None:
    tick = advance_metabolism(
        MetabolicState(
            charge=0.0,
            slit_openness=0.5,
            resonance=0.0,
            circuit_mirror_gain=0.0,
        ),
        recovery_coefficient=0.0,
        spirit_charge=0.2,
    )

    assert tick.recovered_state.charge == pytest.approx(0.2)


def test_unlocked_spirit_does_not_amplify_resonance_or_activate_migration() -> None:
    state = MetabolicState(
        charge=0.5,
        slit_openness=0.5,
        resonance=0.4,
        circuit_mirror_gain=0.0,
    )
    effects = apply_spirit_alignment(
        state,
        calculate_pressure(state),
        node_resonance_frequency=1.0,
        corridor_vector=(1.0, 2.0),
        field=SpiritField(0.6, 1.2, (0.5, -0.25)),
        config=_config(),
    )

    assert not effects.frequency_locked
    assert effects.state.resonance == 0.4
    assert not effects.migration_active
    assert effects.migration_vector == (1.0, 2.0)
