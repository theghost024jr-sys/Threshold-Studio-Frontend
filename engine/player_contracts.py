"""Composable Player–Flower contracts with weighted dominant modes."""
from __future__ import annotations
from dataclasses import dataclass
from math import isfinite
from typing import Literal
from .players import PlayerForce

ContractType = Literal["stabilization", "resonance", "migration", "collapse", "spirit"]

def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0:
        raise ValueError(f"{name} must be finite and non-negative")
    return value

def _compatibility(delta: float, scale: float) -> float:
    _non_negative("scale", scale)
    return 1.0 if scale == 0 and delta == 0 else max(0.0, 1.0 - delta / scale) if scale else 0.0

@dataclass(frozen=True)
class FlowerContractState:
    basin_pressure: float; resonance_frequency: float; corridor_curvature: float; collapse_threshold: float; spirit_alignment: float
    def __post_init__(self) -> None:
        for n in ("basin_pressure", "resonance_frequency", "corridor_curvature", "collapse_threshold", "spirit_alignment"):
            _non_negative(n, getattr(self, n))

@dataclass(frozen=True)
class ContractWeights:
    pressure: float; resonance: float; corridor: float; collapse: float; spirit: float
    def __post_init__(self) -> None:
        for n in ("pressure", "resonance", "corridor", "collapse", "spirit"): _non_negative(n, getattr(self, n))

@dataclass(frozen=True)
class ContractConfig:
    destabilize_threshold: float; pressure_tolerance: float; frequency_tolerance: float; corridor_tolerance: float; spirit_tolerance: float
    pressure_response: float; resonance_response: float; corridor_response: float; collapse_response: float; spirit_response: float
    weights: ContractWeights
    def __post_init__(self) -> None:
        for n in ("destabilize_threshold","pressure_tolerance","frequency_tolerance","corridor_tolerance","spirit_tolerance","pressure_response","resonance_response","corridor_response","collapse_response","spirit_response"): _non_negative(n,getattr(self,n))

@dataclass(frozen=True)
class PlayerFlowerContract:
    accepted: bool; types: tuple[ContractType, ...]; dominant_mode: ContractType | None; scores: dict[ContractType, float]; flower: FlowerContractState

def form_player_flower_contract(player: PlayerForce, player_pressure: float, player_wave: float, flower: FlowerContractState, config: ContractConfig) -> PlayerFlowerContract:
    """Form composable contracts and select the strongest weighted compatibility."""
    _non_negative("player_pressure", player_pressure); _non_negative("player_wave", player_wave)
    basin = flower.basin_pressure + config.pressure_response * player_pressure
    if basin >= config.destabilize_threshold:
        return PlayerFlowerContract(False, (), None, {}, flower)
    updated = FlowerContractState(basin, flower.resonance_frequency + config.resonance_response * player_wave, flower.corridor_curvature + config.corridor_response * player_wave, max(0., flower.collapse_threshold-config.collapse_response*player_pressure), min(1., flower.spirit_alignment+config.spirit_response*player.alignment))
    p = _compatibility(abs(player_pressure-flower.basin_pressure), config.pressure_tolerance)
    r = _compatibility(abs(player.resonance_frequency-flower.resonance_frequency), config.frequency_tolerance)
    c = _compatibility(abs(updated.corridor_curvature-flower.corridor_curvature), config.corridor_tolerance)
    x = _compatibility(abs(player_pressure-flower.collapse_threshold), config.pressure_tolerance)
    s = _compatibility(abs(player.alignment-flower.spirit_alignment), config.spirit_tolerance)
    scores: dict[ContractType,float] = {"stabilization":config.weights.pressure*p,"resonance":config.weights.resonance*r,"migration":config.weights.corridor*c,"collapse":config.weights.collapse*x,"spirit":config.weights.spirit*s}
    types = tuple(kind for kind, score in scores.items() if score > 0)
    dominant = max(types, key=lambda kind: scores[kind]) if types else None
    return PlayerFlowerContract(True, types, dominant, scores, updated)
