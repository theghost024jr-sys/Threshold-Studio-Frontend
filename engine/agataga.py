"""Threshold-local player sensitivity to field distortions and boundary signals."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite


@dataclass(frozen=True)
class AgatagaSense:
    """A normalized player perception input, distinct from Agataga reliability."""

    value: float

    def __post_init__(self) -> None:
        if not isfinite(self.value) or not 0.0 <= self.value <= 1.0:
            raise ValueError("value must be finite and in the range [0, 1]")

    def exceeds(self, threshold: float) -> bool:
        """Return whether perception passes a strict normalized threshold."""

        if not isfinite(threshold) or not 0.0 <= threshold <= 1.0:
            raise ValueError("threshold must be finite and in the range [0, 1]")
        return self.value > threshold
