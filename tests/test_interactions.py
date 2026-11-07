import pytest

from engine.interactions import (
    FlowerField,
    FlowerInteractionConfig,
    calculate_migration_flow,
    evaluate_flower_interaction,
)


def _config() -> FlowerInteractionConfig:
    return FlowerInteractionConfig(
        frequency_tolerance=0.1,
        basin_overlap_tolerance=0.05,
        halo_coupling=0.5,
        collapse_cross_threshold=0.4,
        spirit_pressure_coefficient=0.5,
    )


def test_flower_interaction_superposes_pressure_and_evaluates_all_pairwise_fields() -> None:
    interaction = evaluate_flower_interaction(
        FlowerField("source", 1.0, 1.0, 0.5, 0.4, 0.8),
        FlowerField("target", 0.5, 1.05, 0.54, -0.2, 0.2),
        collapse_wave_amplitude=0.5,
        config=_config(),
    )

    assert interaction.source_effective_pressure == pytest.approx(1.4)
    assert interaction.target_effective_pressure == pytest.approx(0.55)
    assert interaction.net_pressure == pytest.approx(1.95)
    assert interaction.harmonized
    assert interaction.basin_conflict
    assert interaction.halo_angular_delta == pytest.approx(0.3)
    assert interaction.collapse_contagion


def test_migration_flow_projects_vector_through_the_corridor_region() -> None:
    flow = calculate_migration_flow(
        migration_vector=(2.0, 1.0),
        corridor_normal=(1.0, -1.0),
        node_density=0.5,
        area=4.0,
    )

    assert flow == pytest.approx(2.0)


def test_interaction_thresholds_are_strict_where_the_physics_requires_escape() -> None:
    interaction = evaluate_flower_interaction(
        FlowerField("source", 1.0, 1.0, 0.5, 0.0, 0.0),
        FlowerField("target", 1.0, 1.1, 0.55, 0.0, 0.0),
        collapse_wave_amplitude=0.4,
        config=_config(),
    )

    assert not interaction.harmonized
    assert interaction.basin_conflict
    assert not interaction.collapse_contagion
