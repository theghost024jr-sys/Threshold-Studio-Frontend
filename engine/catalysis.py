"""Collective player-field catalysis of Garden eras."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Literal, Sequence
from .interference import ModeField
from .player_contracts import ContractWeights, ContractType

Era = Literal["stable","oscillatory","chaotic","collapse","rebirth"]
@dataclass(frozen=True)
class EraCatalysis:
    score: float; source_mode: ContractType; target_era: Era; propagation: float; ignited: bool
_TARGET: dict[ContractType,Era]={"stabilization":"stable","resonance":"oscillatory","migration":"chaotic","collapse":"collapse","spirit":"rebirth"}
def catalyze_era(fields: Sequence[ModeField], weights: ContractWeights, era_threshold: float, corridor_connectivity: float) -> EraCatalysis:
    """Superpose player modes, weight a Flower response, and ignite an era shift."""
    if not fields: raise ValueError("fields must not be empty")
    if min(era_threshold,corridor_connectivity)<0: raise ValueError("threshold and connectivity must be non-negative")
    totals={name:sum(getattr(f,name) for f in fields)*getattr(weights,name) for name in ("pressure","resonance","corridor","collapse","spirit")}
    mapping={"pressure":"stabilization","resonance":"resonance","corridor":"migration","collapse":"collapse","spirit":"spirit"}
    field=max(totals,key=lambda key: abs(totals[key]))
    mode=mapping[field]
    score=sum(abs(value) for value in totals.values())
    return EraCatalysis(score,mode,_TARGET[mode],score*corridor_connectivity,score>era_threshold)
