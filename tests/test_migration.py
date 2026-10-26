import pytest

from engine.migration import (
    FlowerPull,
    calculate_flower_mass,
    calculate_flower_pull,
    has_escaped,
    is_resonance_corridor,
    select_capture_flower,
)
from engine.metabolism import ResonanceWave


def test_flower_mass_and_pull_follow_the_canonical_equations() -> None:
    mass = calculate_flower_mass(
        node_count=10,
        average_charge=0.5,
        resonance_density=0.8,
    )
    pull = calculate_flower_pull(
        flower_id="target",
        mass=mass,
        gravitational_constant=2.0,
        distance=2.0,
    )

    assert mass == 4.0
    assert pull.strength == 2.0


def test_escape_requires_pressure_above_margin_and_outward_gradient() -> None:
    assert has_escaped(
        effective_pressure=0.81,
        drift_threshold=0.7,
        escape_margin=0.1,
        radial_pressure_gradient=0.01,
    )
    assert not has_escaped(
        effective_pressure=0.8,
        drift_threshold=0.7,
        escape_margin=0.1,
        radial_pressure_gradient=0.01,
    )
    assert not has_escaped(
        effective_pressure=0.81,
        drift_threshold=0.7,
        escape_margin=0.1,
        radial_pressure_gradient=0.0,
    )


def test_resonance_corridor_requires_aligned_waves_along_a_path() -> None:
    aligned = [
        ResonanceWave("a", "b", 0.2),
        ResonanceWave("b", "c", 0.23),
    ]

    assert is_resonance_corridor(aligned, tolerance=0.05)
    assert not is_resonance_corridor(aligned, tolerance=0.02)
    assert not is_resonance_corridor(aligned[:1], tolerance=0.05)


def test_capture_selects_strongest_external_pull_after_pressure_falls() -> None:
    pulls = [
        FlowerPull("home", 2.0),
        FlowerPull("near-target", 3.0),
        FlowerPull("strong-target", 4.0),
    ]

    assert (
        select_capture_flower(
            "home",
            pulls,
            effective_pressure=0.7,
            escape_pressure=0.8,
        )
        == "strong-target"
    )
    assert (
        select_capture_flower(
            "home",
            pulls,
            effective_pressure=0.8,
            escape_pressure=0.8,
        )
        is None
    )


def test_capture_requires_home_pull() -> None:
    with pytest.raises(ValueError, match="home Flower"):
        select_capture_flower(
            "home",
            [FlowerPull("target", 3.0)],
            effective_pressure=0.7,
            escape_pressure=0.8,
        )
