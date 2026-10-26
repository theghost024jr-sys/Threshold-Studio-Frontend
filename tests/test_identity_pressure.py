import pytest

from engine.identity_pressure import (
    IdentityPressureConfig,
    IdentityPressureEdge,
    IdentityPressurePoint,
    IdentityPressureSources,
    build_identity_pressure_map,
)


def _config() -> IdentityPressureConfig:
    return IdentityPressureConfig(
        pressure_weight=1.0,
        drift_weight=2.0,
        collapse_weight=3.0,
        resonance_weight=4.0,
        migration_weight=5.0,
        reveal_threshold=2.0,
        overload_threshold=5.0,
    )


def test_identity_pressure_map_resolves_local_exposure_and_gradients() -> None:
    pressure_map = build_identity_pressure_map(
        (
            IdentityPressurePoint(
                "player",
                "frontier",
                IdentityPressureSources(1.0, 1.0, 0.0, 0.0, 0.0),
            ),
            IdentityPressurePoint(
                "flower",
                "core",
                IdentityPressureSources(0.0, 0.0, 0.0, 0.0, 0.0),
            ),
            IdentityPressurePoint(
                "migrant",
                "halo",
                IdentityPressureSources(0.0, 0.0, 0.0, 0.0, 1.1),
            ),
        ),
        (IdentityPressureEdge("player", "flower"),),
        _config(),
    )

    assert [reading.state for reading in pressure_map.readings] == [
        "revealed",
        "latent",
        "overloaded",
    ]
    assert pressure_map.readings[0].total_pressure == pytest.approx(3.0)
    assert pressure_map.gradients[0].gradient == pytest.approx(3.0)


def test_identity_pressure_thresholds_are_strict() -> None:
    pressure_map = build_identity_pressure_map(
        (
            IdentityPressurePoint(
                "identity",
                "core",
                IdentityPressureSources(2.0, 0.0, 0.0, 0.0, 0.0),
            ),
        ),
        (),
        _config(),
    )

    assert pressure_map.readings[0].state == "latent"


def test_identity_pressure_map_rejects_unknown_topology_edges() -> None:
    with pytest.raises(ValueError, match="declared"):
        build_identity_pressure_map(
            (
                IdentityPressurePoint(
                    "identity",
                    "core",
                    IdentityPressureSources(0.0, 0.0, 0.0, 0.0, 0.0),
                ),
            ),
            (IdentityPressureEdge("identity", "missing"),),
            _config(),
        )
