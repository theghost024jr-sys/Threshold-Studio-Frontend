"""Deterministic narrative-arc classification from Garden physics."""
from __future__ import annotations
from dataclasses import dataclass
from math import isfinite
from typing import Literal
NarrativeArc = Literal["tension", "migration", "identity", "collapse", "rebirth", "player"]
def _n(name: str, v: float) -> float:
    if not isfinite(v) or v < 0: raise ValueError(f"{name} must be finite and non-negative")
    return v
@dataclass(frozen=True)
class NarrativeSignals:
    pressure_gradient: float; migration_surge: float; basin_change: float; collapse_wave: float; immunity: float; macro_curvature: float; player_influence: float
    def __post_init__(self) -> None:
        for n in ("pressure_gradient","migration_surge","basin_change","collapse_wave","immunity","player_influence"): _n(n,getattr(self,n))
        if not isfinite(self.macro_curvature): raise ValueError("macro_curvature must be finite")
@dataclass(frozen=True)
class NarrativeConfig:
    threshold: float
    baseline_multiplier: float
    def __post_init__(self) -> None: _n("threshold",self.threshold); _n("baseline_multiplier",self.baseline_multiplier)
def classify_narrative_arcs(signals: NarrativeSignals, baseline: NarrativeSignals, config: NarrativeConfig) -> tuple[NarrativeArc,...]:
    """Classify emergent arcs from explicit or baseline-relative divergence."""
    def active(value: float, base: float) -> bool: return value >= config.threshold or value >= base * config.baseline_multiplier
    arcs: list[NarrativeArc] = []
    if active(signals.pressure_gradient, baseline.pressure_gradient): arcs.append("tension")
    if active(signals.migration_surge, baseline.migration_surge): arcs.append("migration")
    if active(signals.basin_change, baseline.basin_change): arcs.append("identity")
    if signals.collapse_wave > signals.immunity: arcs.append("collapse")
    if signals.macro_curvature > 0 and active(abs(signals.macro_curvature), abs(baseline.macro_curvature)): arcs.append("rebirth")
    if active(signals.player_influence, baseline.player_influence): arcs.append("player")
    return tuple(arcs)
