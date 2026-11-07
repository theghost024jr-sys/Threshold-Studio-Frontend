"""Read-only, tick-scoped composition of identity subsystem outputs."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from .identity_collapse import IdentityCollapseThreshold
from .identity_migration import IdentityMigrationDecision
from .identity_pressure import IdentityPressureReading
from .identity_resonance import IdentityResonanceSignature


class PressureState(str, Enum):
    LATENT = "latent"
    REVEALED = "revealed"
    OVERLOADED = "overloaded"
    DEFERRED = "deferred"
    STASIS = "stasis"


class CollapseState(str, Enum):
    NONE = "none"
    IMMINENT = "imminent"
    TRIGGERED = "triggered"
    AFTERMATH = "aftermath"


@dataclass(frozen=True)
class IdentityPressureMapContext:
    reading: IdentityPressureReading
    collapse: IdentityCollapseThreshold
    resonance: IdentityResonanceSignature
    migration: IdentityMigrationDecision
    uncertainty: float
    coherence_recovery: float
    hesitation_active: bool
    collapse_aftermath_resolved: bool
    reveal_fraction: float
    imminent_tolerance: float


@dataclass(frozen=True)
class IdentityPressureSnapshot:
    identity_id: str
    basin_id: str
    raw_pressure: float
    effective_pressure: float
    collapse_capacity: float
    pressure_state: PressureState
    collapse_state: CollapseState
    resonance_state: IdentityResonanceSignature
    migration_state: IdentityMigrationDecision
    uncertainty: float
    coherence_recovery: float
    hesitation_active: bool
    stasis_active: bool


def compute_identity_pressure_snapshot(
    context: IdentityPressureMapContext,
) -> IdentityPressureSnapshot:
    """Compose validated subsystem outputs without mutation, routing, or prediction."""

    if context.reading.identity_id != context.collapse.identity_id:
        raise ValueError("reading and collapse identity_id must match")
    if context.reading.basin_id != context.collapse.basin_id:
        raise ValueError("reading and collapse basin_id must match")
    for name in ("uncertainty", "coherence_recovery", "reveal_fraction", "imminent_tolerance"):
        value = getattr(context, name)
        if not 0.0 <= value <= 1.0:
            raise ValueError(f"{name} must be in the range [0, 1]")

    collapse_state = _collapse_state(context)
    deferred = context.hesitation_active and collapse_state is not CollapseState.TRIGGERED
    stasis = (
        not context.migration.permitted
        and collapse_state is not CollapseState.TRIGGERED
        and not deferred
    )
    if stasis:
        pressure_state = PressureState.STASIS
    elif deferred:
        pressure_state = PressureState.DEFERRED
    elif context.collapse.effective_pressure < context.reveal_fraction * context.collapse.capacity:
        pressure_state = PressureState.LATENT
    elif context.collapse.effective_pressure < context.collapse.capacity:
        pressure_state = PressureState.REVEALED
    else:
        pressure_state = PressureState.OVERLOADED
    return IdentityPressureSnapshot(
        context.reading.identity_id, context.reading.basin_id,
        context.reading.total_pressure, context.collapse.effective_pressure,
        context.collapse.capacity, pressure_state, collapse_state,
        context.resonance, context.migration, context.uncertainty,
        context.coherence_recovery, context.hesitation_active, stasis,
    )


def _collapse_state(context: IdentityPressureMapContext) -> CollapseState:
    if context.collapse_aftermath_resolved:
        return CollapseState.AFTERMATH
    if context.collapse.triggered:
        return CollapseState.TRIGGERED
    if context.collapse.effective_pressure >= context.collapse.capacity:
        return CollapseState.IMMINENT
    if context.collapse.effective_pressure >= context.collapse.capacity * (
        1.0 - context.imminent_tolerance
    ):
        return CollapseState.IMMINENT
    return CollapseState.NONE
