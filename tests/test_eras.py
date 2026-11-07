from engine.eras import (
    EraTransitionConfig,
    EraTransitionMetrics,
    advance_era_phase,
    era_transition_ignites,
)


def _metrics(**changes: float) -> EraTransitionMetrics:
    values = dict(
        pressure_gradient=0.1, resonance_drift=0.1, macro_curvature=0.1,
        migration_surge=0.1, collapse_wave=0.1, immunity=1.0,
        spirit_alignment_shift=0.1,
    )
    values.update(changes)
    return EraTransitionMetrics(**values)


def test_era_transition_ignites_from_canonical_global_failure_signals() -> None:
    config = EraTransitionConfig(0.2, 0.2, 0.2, 0.2)
    assert not era_transition_ignites(_metrics(), config)
    assert era_transition_ignites(_metrics(collapse_wave=1.1), config)
    assert era_transition_ignites(_metrics(macro_curvature=-0.1), config)


def test_era_phases_advance_in_canonical_order_and_signal_reignites() -> None:
    assert advance_era_phase("distortion", True) == "drift"
    assert advance_era_phase("collapse", True) == "reformation"
    assert advance_era_phase("signal", False) == "signal"
    assert advance_era_phase("signal", True) == "distortion"
