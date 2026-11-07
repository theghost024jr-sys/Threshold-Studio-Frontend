import pytest

from engine.binding_integrity import (
    CascadeProbability,
    IntegrityBand,
    classify,
    evaluate_binding_integrity,
)

WEIGHTS = {"BLS": 0.25, "PC": 0.25, "CDS": 0.2, "PRH": 0.2, "TOR": 0.1}


def components(value=1.0, **overrides):
    result = {name: value for name in WEIGHTS}
    result.update(overrides)
    return result


@pytest.mark.parametrize(
    "index,band,probability",
    [
        (1.0, IntegrityBand.OPTIMAL, CascadeProbability.NEGLIGIBLE),
        (0.85, IntegrityBand.OPTIMAL, CascadeProbability.NEGLIGIBLE),
        (0.84, IntegrityBand.STABLE_BUT_VULNERABLE, CascadeProbability.LOW),
        (0.70, IntegrityBand.STABLE_BUT_VULNERABLE, CascadeProbability.LOW),
        (0.69, IntegrityBand.STRAINED, CascadeProbability.MODERATE),
        (0.55, IntegrityBand.STRAINED, CascadeProbability.MODERATE),
        (0.54, IntegrityBand.HIGH_INSTABILITY, CascadeProbability.HIGH),
        (0.40, IntegrityBand.HIGH_INSTABILITY, CascadeProbability.HIGH),
        (0.39, IntegrityBand.CRITICAL_FAILURE, CascadeProbability.EXTREME),
        (0.0, IntegrityBand.CRITICAL_FAILURE, CascadeProbability.EXTREME),
    ],
)
def test_bands_follow_the_vault_scale(index, band, probability):
    assert classify(index) == (band, probability)


def test_healthy_system_has_no_failure_signature():
    result = evaluate_binding_integrity(components(0.9), WEIGHTS)
    assert result.band is IntegrityBand.OPTIMAL
    assert result.failure_signature is None


def test_weakest_component_names_the_failure_signature():
    result = evaluate_binding_integrity(components(0.6, PC=0.1), WEIGHTS)
    assert result.weakest_component == "PC"
    assert result.failure_signature == "phase_collapse"


def test_weights_are_never_defaulted():
    with pytest.raises(TypeError):
        evaluate_binding_integrity(components(0.5))


def test_weights_must_follow_the_vault_ordering():
    swapped = {"BLS": 0.1, "PC": 0.1, "CDS": 0.2, "PRH": 0.2, "TOR": 0.4}
    with pytest.raises(ValueError):
        evaluate_binding_integrity(components(0.5), swapped)


def test_weights_must_sum_to_one():
    with pytest.raises(ValueError):
        evaluate_binding_integrity(components(0.5), {**WEIGHTS, "TOR": 0.3})


@pytest.mark.parametrize("bad", [-0.1, 1.1, float("nan")])
def test_components_must_be_unit_interval(bad):
    with pytest.raises(ValueError):
        evaluate_binding_integrity(components(0.5, BLS=bad), WEIGHTS)
