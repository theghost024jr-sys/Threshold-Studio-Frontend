import math

import pytest

from engine.agataga import AgatagaSense


@pytest.mark.parametrize("value", (-0.01, 1.01, math.nan, math.inf))
def test_agataga_sense_rejects_non_normalized_values(value: float) -> None:
    with pytest.raises(ValueError, match="value"):
        AgatagaSense(value)


def test_agataga_sense_uses_a_strict_perception_threshold() -> None:
    sense = AgatagaSense(0.5)

    assert sense.exceeds(0.5) is False
    assert sense.exceeds(0.49) is True
