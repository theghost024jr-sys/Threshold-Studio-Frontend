import pytest

from engine.basins import IdentityBasin
from engine.evolution import (
    FlowerIdentity,
    IdentityDelta,
    IdentityEvolutionConfig,
    evolve_identity,
)


def test_hybrid_identity_evolution_combines_deltas_and_field_effects() -> None:
    result = evolve_identity(
        FlowerIdentity(IdentityBasin("flower", 0.2, 0.8, 1.0, 3.0), 1.0, 0.2, 0.0, 2),
        IdentityDelta(center_pressure=0.1, resonance_frequency=0.2, cluster_count=-1),
        storm_rim_pressure=-0.1,
        spirit_alignment=0.5,
        immunity=0.8,
        config=IdentityEvolutionConfig(0.7, 0.1, 0.2),
    )

    assert result.identity.basin.center_pressure == pytest.approx(0.33)
    assert result.identity.basin.rim_pressure == pytest.approx(0.77)
    assert result.identity.resonance_frequency == pytest.approx(1.2)
    assert result.identity.cluster_count == 1
    assert result.net_change == pytest.approx(1.4)
    assert not result.locked


def test_identity_locks_only_with_high_immunity_and_low_net_change() -> None:
    result = evolve_identity(
        FlowerIdentity(IdentityBasin("flower", 0.2, 0.8, 1.0, 3.0), 1.0, 0.0, 0.0, 1),
        IdentityDelta(),
        immunity=0.7,
        config=IdentityEvolutionConfig(0.7, 0.0, 0.0),
    )

    assert result.locked
