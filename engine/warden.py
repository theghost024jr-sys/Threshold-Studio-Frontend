"""Reactive Warden boundary fields for player identity interference."""
from __future__ import annotations
from dataclasses import dataclass
from math import isfinite
from typing import Literal

WardenMode = Literal["alignment","resistance","destabilization"]
EraBias = Literal["stable","oscillatory","chaotic"]

@dataclass(frozen=True)
class IdentityField:
    pressure: float; resonance: float; corridor: float; collapse: float; spirit: float
    def __post_init__(self) -> None:
        if not all(isfinite(v) and v >= 0 for v in (self.pressure,self.resonance,self.corridor,self.collapse,self.spirit)):
            raise ValueError("identity fields must be finite and non-negative")
    def values(self) -> tuple[float,...]: return (self.pressure,self.resonance,self.corridor,self.collapse,self.spirit)

@dataclass(frozen=True)
class WardenInterference:
    score: float; mode: WardenMode; basin_delta: float; corridor_delta: float; collapse_delta: float; spirit_delta: float; era_bias: EraBias

def evaluate_warden_interference(warden: IdentityField, player: IdentityField, resistance_threshold: float) -> WardenInterference:
    """Resolve constructive, destructive, or destabilizing boundary interference."""
    if not isfinite(resistance_threshold) or resistance_threshold < 0: raise ValueError("resistance_threshold must be finite and non-negative")
    names=("pressure","resonance","corridor","collapse","spirit")
    w,p=warden.values(),player.values()
    score=sum(a*b for a,b in zip(w,p))
    wd,pd=max(range(5),key=lambda i:w[i]),max(range(5),key=lambda i:p[i])
    if wd==pd: mode: WardenMode="alignment"
    elif w[pd]<=resistance_threshold: mode="resistance"
    else: mode="destabilization"
    if mode=="alignment": return WardenInterference(score,mode,score,-score,score,score,"stable")
    if mode=="resistance": return WardenInterference(score,mode,-score,score,-score,-score,"oscillatory")
    return WardenInterference(score,mode,0.,score,score,score,"chaotic")
