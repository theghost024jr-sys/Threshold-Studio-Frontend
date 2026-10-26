import pytest

from engine.uncertainty import (
    UncertaintyStabilizationConfig,
    stabilize_uncertainty,
)
from engine.unresolved import UnresolvedField


def _field(value: float) -> UnresolvedField:
    return UnresolvedField(value, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)


def test_uncertainty_defers_resolution_without_changing_the_unresolved_field() -> None:
    stabilization = stabilize_uncertainty(
        _field(0.75),
        UncertaintyStabilizationConfig(
            deferment_threshold=0.5,
            contract_damping_coefficient=0.8,
            elevation_damping_coefficient=0.6,
            topology_damping_coefficient=0.4,
            era_drift_damping_coefficient=0.2,
        ),
    )

    assert stabilization.unresolved == 0.75
    assert stabilization.defers_resolution is True
    assert stabilization.contract_damping == pytest.approx(0.6)
    assert stabilization.elevation_damping == pytest.approx(0.45)
    assert stabilization.topology_damping == pytest.approx(0.3)
    assert stabilization.era_drift_damping == pytest.approx(0.15)


def test_uncertainty_requires_a_strict_deferment_threshold() -> None:
    stabilization = stabilize_uncertainty(
        _field(0.5),
        UncertaintyStabilizationConfig(
            deferment_threshold=0.5,
            contract_damping_coefficient=1.0,
            elevation_damping_coefficient=1.0,
            topology_damping_coefficient=1.0,
            era_drift_damping_coefficient=1.0,
        ),
    )

    assert stabilization.defers_resolution is False
