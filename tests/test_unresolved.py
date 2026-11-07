import pytest

from engine.unresolved import (
    UnresolvedFieldConfig,
    UnresolvedSignals,
    calculate_unresolved_field,
)


def _config() -> UnresolvedFieldConfig:
    return UnresolvedFieldConfig(1, 1, 1, 1, 1, 1)


def test_unresolved_field_retains_force_without_forcing_a_resolution() -> None:
    field = calculate_unresolved_field(
        UnresolvedSignals(
            density=1.0,
            shimmer=0.0,
            pressure=1.0,
            resonance=0.0,
            identity_lock=0.0,
            collapse_scars=1.0,
            funnelization=0.0,
            polarity=1.0,
            slit_openness=0.0,
            memory=1.0,
            memory_identity_coherence=0.0,
        ),
        _config(),
    )

    assert field.density_without_shimmer == 1.0
    assert field.pressure_without_resonance == 1.0
    assert field.scars_without_funnel == 1.0
    assert field.value == pytest.approx(5 / 6)


def test_unresolved_field_is_zero_when_every_active_force_is_resolved() -> None:
    field = calculate_unresolved_field(
        UnresolvedSignals(
            density=1.0,
            shimmer=1.0,
            pressure=1.0,
            resonance=1.0,
            identity_lock=1.0,
            collapse_scars=1.0,
            funnelization=1.0,
            polarity=1.0,
            slit_openness=1.0,
            memory=1.0,
            memory_identity_coherence=1.0,
        ),
        _config(),
    )

    assert field.value == 0.0


def test_unresolved_field_requires_at_least_one_weight() -> None:
    with pytest.raises(ValueError, match="weight"):
        UnresolvedFieldConfig(0, 0, 0, 0, 0, 0)
