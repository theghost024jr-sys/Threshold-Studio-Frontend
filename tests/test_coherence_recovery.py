import pytest

from engine.coherence_recovery import (
    CoherenceRecoveryConfig,
    CoherenceRecoverySignals,
    calculate_coherence_recovery,
)
from engine.unresolved import UnresolvedField


def _unresolved(value: float) -> UnresolvedField:
    return UnresolvedField(value, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)


def _config() -> CoherenceRecoveryConfig:
    return CoherenceRecoveryConfig(
        unresolved_weight=1.0,
        misalignment_memory_weight=1.0,
        grief_weight=1.0,
        refusal_weight=1.0,
        hesitation_border_weight=1.0,
        false_warden_weight=1.0,
        failed_elevation_weight=1.0,
        aborted_topology_weight=1.0,
        resonance_jitter_damping_coefficient=0.8,
        pressure_spike_damping_coefficient=0.6,
        flow_stutter_damping_coefficient=0.4,
        collapse_flicker_damping_coefficient=0.2,
        polarity_oscillation_damping_coefficient=1.0,
    )


def test_coherence_recovery_stabilizes_without_consuming_uncertainty() -> None:
    recovery = calculate_coherence_recovery(
        CoherenceRecoverySignals(
            unresolved=_unresolved(1.0),
            misalignment_memory=1.0,
            grief_weight=1.0,
            refusal_active=True,
            hesitation_border=1.0,
            false_warden_signal=1.0,
            failed_elevation=1.0,
            aborted_topology_rewrite=1.0,
        ),
        _config(),
    )

    assert recovery.value == 1.0
    assert recovery.resonance_jitter_damping == pytest.approx(0.8)
    assert recovery.pressure_spike_damping == pytest.approx(0.6)
    assert recovery.flow_stutter_damping == pytest.approx(0.4)
    assert recovery.collapse_flicker_damping == pytest.approx(0.2)
    assert recovery.polarity_oscillation_damping == 1.0


def test_coherence_recovery_is_zero_without_recovery_signals() -> None:
    recovery = calculate_coherence_recovery(
        CoherenceRecoverySignals(
            unresolved=_unresolved(0.0),
            misalignment_memory=0.0,
            grief_weight=0.0,
            refusal_active=False,
            hesitation_border=0.0,
            false_warden_signal=0.0,
            failed_elevation=0.0,
            aborted_topology_rewrite=0.0,
        ),
        _config(),
    )

    assert recovery.value == 0.0
