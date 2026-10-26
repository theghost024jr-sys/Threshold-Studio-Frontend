import pytest

from engine.identity_resonance import (
    CollapseHarmonicShift,
    IdentityResonanceSignature,
    ResonanceInteractionConfig,
    apply_collapse_harmonic_shift,
    interact_resonance,
)


def _config() -> ResonanceInteractionConfig:
    return ResonanceInteractionConfig(
        frequency_tolerance=0.1,
        coherence_tolerance=0.1,
        symmetry_tolerance=0.1,
        storm_coherence_gap=0.5,
        entrapment_amplitude_ratio=3.0,
    )


def test_collapse_shift_updates_harmonics_without_exceeding_bounds() -> None:
    shifted = apply_collapse_harmonic_shift(
        IdentityResonanceSignature(1.0, 2.0, 0.2, 0.8, 0.0),
        CollapseHarmonicShift(-2.0, -3.0, -0.5, 0.5, 0.25),
    )

    assert shifted.amplitude == 0.0
    assert shifted.frequency == 0.0
    assert shifted.coherence == 0.0
    assert shifted.symmetry == 1.0
    assert shifted.collapse_shift == pytest.approx(0.25)


def test_resonance_interaction_identifies_storm_before_other_matching_modes() -> None:
    interaction = interact_resonance(
        IdentityResonanceSignature(1.0, 1.0, 0.0, 0.5, 0.0),
        IdentityResonanceSignature(1.0, 1.05, 0.8, 0.5, 0.0),
        _config(),
    )

    assert interaction.mode == "storm"
    assert interaction.combined.frequency == pytest.approx(1.025)


def test_resonance_interaction_identifies_entrapment_and_entrainment() -> None:
    entrapment = interact_resonance(
        IdentityResonanceSignature(6.0, 1.0, 0.5, 0.5, 0.0),
        IdentityResonanceSignature(1.0, 2.0, 0.5, 0.55, 0.0),
        _config(),
    )
    entrainment = interact_resonance(
        IdentityResonanceSignature(1.0, 1.0, 0.5, 0.0, 0.0),
        IdentityResonanceSignature(1.0, 1.05, 0.55, 1.0, 0.0),
        _config(),
    )

    assert entrapment.mode == "entrapment"
    assert entrapment.amplitude_ratio == pytest.approx(6.0)
    assert entrainment.mode == "entrainment"


def test_resonance_interaction_distinguishes_interference_and_dissonance() -> None:
    interference = interact_resonance(
        IdentityResonanceSignature(1.0, 1.0, 0.5, 0.0, 0.0),
        IdentityResonanceSignature(1.0, 1.05, 0.8, 0.8, 0.0),
        _config(),
    )
    dissonance = interact_resonance(
        IdentityResonanceSignature(1.0, 1.0, 0.5, 0.0, 0.0),
        IdentityResonanceSignature(1.0, 2.0, 0.5, 0.8, 0.0),
        _config(),
    )

    assert interference.mode == "interference"
    assert dissonance.mode == "dissonance"
