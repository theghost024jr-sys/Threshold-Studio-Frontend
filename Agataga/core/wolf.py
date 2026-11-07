"""Binary reliability state and the architecture's cycle-weighted R-Score."""

from __future__ import annotations

from dataclasses import dataclass, replace
from enum import IntEnum
from math import isfinite
from typing import Iterable


RECENT_WINDOW_CYCLES = 30
RECENT_EVENT_WEIGHT = 3.0
OLDER_EVENT_WEIGHT = 1.0


class ReliabilityState(IntEnum):
    QUARANTINED = 0
    ACTIVE = 1


@dataclass(frozen=True, slots=True)
class ReliabilityEntity:
    entity_id: str
    state: ReliabilityState
    r_score: float | None = None

    def __post_init__(self) -> None:
        if not self.entity_id.strip():
            raise ValueError("entity_id must not be empty")
        if not isinstance(self.state, ReliabilityState):
            raise ValueError("state must be a ReliabilityState value (0 or 1)")
        if self.r_score is not None and (
            not isfinite(self.r_score) or not 0.0 <= self.r_score <= 1.0
        ):
            raise ValueError("r_score must be finite and between 0.0 and 1.0")

    @property
    def can_transact(self) -> bool:
        return self.state is ReliabilityState.ACTIVE


@dataclass(frozen=True, slots=True)
class TransactionOutcome:
    cycle: int
    succeeded: bool

    def __post_init__(self) -> None:
        if isinstance(self.cycle, bool) or not isinstance(self.cycle, int) or self.cycle < 0:
            raise ValueError("cycle must be a non-negative integer")
        if not isinstance(self.succeeded, bool):
            raise ValueError("succeeded must be a boolean")


def calculate_r_score(
    outcomes: Iterable[TransactionOutcome],
    *,
    current_cycle: int,
) -> float:
    """Return weighted successes / weighted attempts using the v1 30-cycle rule."""
    if isinstance(current_cycle, bool) or not isinstance(current_cycle, int) or current_cycle < 0:
        raise ValueError("current_cycle must be a non-negative integer")

    records = tuple(outcomes)
    if not records:
        raise ValueError("R-Score is undefined without transaction outcomes")

    weighted_successes = 0.0
    weighted_attempts = 0.0
    for outcome in records:
        if outcome.cycle > current_cycle:
            raise ValueError("outcome cycle cannot be later than current_cycle")
        weight = (
            RECENT_EVENT_WEIGHT
            if current_cycle - outcome.cycle <= RECENT_WINDOW_CYCLES
            else OLDER_EVENT_WEIGHT
        )
        weighted_attempts += weight
        if outcome.succeeded:
            weighted_successes += weight

    return weighted_successes / weighted_attempts


def quarantine(entity: ReliabilityEntity) -> ReliabilityEntity:
    """Move an entity to state 0 without changing its tracking score."""
    return replace(entity, state=ReliabilityState.QUARANTINED)


def reinstate(
    entity: ReliabilityEntity,
    *,
    recovery_protocol_complete: bool,
) -> ReliabilityEntity:
    """Move a quarantined entity to state 1 only after protocol completion."""
    if entity.state is not ReliabilityState.QUARANTINED:
        raise ValueError("only a quarantined entity can be reinstated")
    if recovery_protocol_complete is not True:
        raise ValueError("recovery protocol must be complete before reinstatement")
    return replace(entity, state=ReliabilityState.ACTIVE)
