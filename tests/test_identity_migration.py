import pytest

from engine.identity_migration import (
    IdentityMigrationCandidate,
    IdentityMigrationConfig,
    IdentityMigrationLocation,
    evaluate_identity_migration,
)
from engine.identity_resonance import IdentityResonanceSignature


def _signature() -> IdentityResonanceSignature:
    return IdentityResonanceSignature(0.8, 0.5, 0.8, 0.7, 0.1)


def _config() -> IdentityMigrationConfig:
    return IdentityMigrationConfig(0.1, 0.1, 0.1, 0.5, 0.5, 0.5)


def test_identity_migration_requires_all_canonical_gates() -> None:
    decision = evaluate_identity_migration(
        current=IdentityMigrationLocation("home", "core", "era-one"),
        signature=_signature(),
        candidate=IdentityMigrationCandidate(
            IdentityMigrationLocation("destination", "frontier", "era-one"),
            IdentityResonanceSignature(0.5, 0.55, 0.5, 0.75, 0.0),
            0.75,
            0.75,
            1.0,
            "direct",
        ),
        uncertainty=0.25,
        collapse_aftermath=0.5,
        config=_config(),
    )

    assert decision.permitted is True
    assert decision.mode == "flower"
    assert decision.corridor_geometry == "direct"
    assert decision.probability == pytest.approx(0.8 * 0.75 * 0.75 * 0.75)


def test_identity_migration_reports_stasis_inhibitors() -> None:
    decision = evaluate_identity_migration(
        current=IdentityMigrationLocation("home", "core", "era-one"),
        signature=_signature(),
        candidate=IdentityMigrationCandidate(
            IdentityMigrationLocation("home", "frontier", "era-one"),
            IdentityResonanceSignature(0.5, 1.0, 0.5, 0.0, 0.0),
            0.5,
            0.5,
            0.0,
            "spiral",
        ),
        uncertainty=0.0,
        collapse_aftermath=0.1,
        config=_config(),
    )

    assert decision.permitted is False
    assert set(decision.inhibitors) == {
        "no_collapse_aftermath",
        "frequency_mismatch",
        "symmetry_mismatch",
        "corridor_closed",
        "flower_incompatible",
        "basin_not_adjacent",
    }


def test_identity_migration_classifies_era_relocation() -> None:
    decision = evaluate_identity_migration(
        current=IdentityMigrationLocation("home", "core", "era-one"),
        signature=_signature(),
        candidate=IdentityMigrationCandidate(
            IdentityMigrationLocation("home", "core", "era-two"),
            IdentityResonanceSignature(0.5, 0.5, 0.5, 0.7, 0.0),
            1.0,
            1.0,
            1.0,
            "liminal",
        ),
        uncertainty=0.0,
        collapse_aftermath=1.0,
        config=_config(),
    )

    assert decision.permitted is True
    assert decision.mode == "era"
