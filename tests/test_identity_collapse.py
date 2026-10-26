import pytest

from engine.basins import IdentityBasin
from engine.identity_collapse import (
    IdentityCollapseConfig,
    evaluate_identity_collapse,
)
from engine.identity_pressure import IdentityPressureReading


def _config() -> IdentityCollapseConfig:
    return IdentityCollapseConfig(curvature_reference=2.0, hesitation_strength=0.5)


def _reading(pressure: float) -> IdentityPressureReading:
    return IdentityPressureReading("player", "frontier", pressure, "revealed")


def _basin() -> IdentityBasin:
    return IdentityBasin("frontier", 0.2, 1.2, 1.0, 5.0)


def test_identity_collapse_compares_effective_pressure_to_basin_capacity() -> None:
    result = evaluate_identity_collapse(
        reading=_reading(1.0),
        basin=_basin(),
        collapse_immunity=1.0,
        hesitation_activation=0.0,
        uncertainty=0.0,
        config=_config(),
    )

    assert result.curvature_factor == pytest.approx(0.5)
    assert result.coherence_factor == 1.0
    assert result.capacity == pytest.approx(0.5)
    assert result.effective_pressure == 1.0
    assert result.triggered is True
    assert result.overload == pytest.approx(0.5)


def test_hesitation_reduces_effective_pressure_without_changing_capacity() -> None:
    without_hesitation = evaluate_identity_collapse(
        reading=_reading(0.8),
        basin=_basin(),
        collapse_immunity=1.0,
        hesitation_activation=0.0,
        uncertainty=0.0,
        config=_config(),
    )
    with_hesitation = evaluate_identity_collapse(
        reading=_reading(0.8),
        basin=_basin(),
        collapse_immunity=1.0,
        hesitation_activation=1.0,
        uncertainty=0.0,
        config=_config(),
    )

    assert without_hesitation.capacity == with_hesitation.capacity
    assert without_hesitation.effective_pressure == pytest.approx(0.8)
    assert with_hesitation.effective_pressure == pytest.approx(0.4)
    assert without_hesitation.triggered is True
    assert with_hesitation.triggered is False


def test_identity_collapse_is_strict_and_uncertainty_lowers_capacity() -> None:
    equal_capacity = evaluate_identity_collapse(
        reading=_reading(0.5),
        basin=_basin(),
        collapse_immunity=1.0,
        hesitation_activation=0.0,
        uncertainty=0.0,
        config=_config(),
    )
    uncertain = evaluate_identity_collapse(
        reading=_reading(0.4),
        basin=_basin(),
        collapse_immunity=1.0,
        hesitation_activation=0.0,
        uncertainty=0.5,
        config=_config(),
    )

    assert equal_capacity.triggered is False
    assert uncertain.capacity == pytest.approx(0.25)
    assert uncertain.triggered is True


def test_identity_collapse_requires_matching_basin_context() -> None:
    with pytest.raises(ValueError, match="must match"):
        evaluate_identity_collapse(
            reading=IdentityPressureReading("player", "core", 1.0, "revealed"),
            basin=_basin(),
            collapse_immunity=1.0,
            hesitation_activation=0.0,
            uncertainty=0.0,
            config=_config(),
        )
