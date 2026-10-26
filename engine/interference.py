"""Cross-player dominant-mode field interference."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Literal, Sequence
from .player_contracts import ContractType, ContractWeights

Outcome = Literal["reinforcement","cancellation","turbulence","dominance","splitting"]
@dataclass(frozen=True)
class ModeField:
    mode: ContractType; pressure: float; resonance: float; corridor: float; collapse: float; spirit: float
@dataclass(frozen=True)
class Interference:
    strength: float; outcome: Outcome; interference_mode: bool
def evaluate_interference(fields: Sequence[ModeField], weights: ContractWeights, tolerance: float, threshold: float) -> Interference:
    """Superpose mode fields, weight them by Flower identity, and classify stress."""
    if not fields: raise ValueError("fields must not be empty")
    values=[sum(getattr(f,n) for f in fields)*getattr(weights,n) for n in ("pressure","resonance","corridor","collapse","spirit")]
    strength=sum(abs(v) for v in values)
    active=sum(abs(v)>tolerance for v in values)
    if strength<=tolerance: outcome="cancellation"
    elif active>=3: outcome="turbulence"
    elif max(abs(v) for v in values)>=strength-tolerance: outcome="dominance"
    elif len({f.mode for f in fields})==1: outcome="reinforcement"
    else: outcome="splitting"
    return Interference(strength,outcome,strength>threshold)
