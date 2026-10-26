import pytest

from engine.equilibrium import EquilibriumConfig, classify_garden_equilibrium


@pytest.mark.parametrize(
    ("gradient", "wave", "immunity", "expected"),
    [
        (0.1, 0.2, 0.3, "stable"),
        (0.5, 0.3, 0.3, "oscillatory"),
        (1.1, 0.4, 0.3, "chaotic"),
    ],
)
def test_garden_equilibrium_classifies_canonical_macro_states(
    gradient: float, wave: float, immunity: float, expected: str
) -> None:
    equilibrium = classify_garden_equilibrium(
        gradient,
        wave,
        immunity,
        resonance_frequencies=[1.0, 1.2],
        migration_currents=[-0.5, 0.5],
        config=EquilibriumConfig(0.2, 1.0),
    )

    assert equilibrium.state == expected
    assert equilibrium.resonance_spread == pytest.approx(0.2)
    assert equilibrium.migration_turbulence == pytest.approx(1.0)
