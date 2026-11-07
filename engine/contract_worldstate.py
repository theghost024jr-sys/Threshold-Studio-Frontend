"""Read-only worldstate context for an existing Player–Flower contract."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from .identity_pressure_map import IdentityPressureSnapshot
from .player_contracts import ContractType, PlayerFlowerContract
from .worldstate_snapshot import WorldstateSnapshot


@dataclass(frozen=True)
class WorldstateContractView:
    identity_id: str
    basin_id: str
    flower_id: str
    accepted: bool
    dominant_mode: ContractType | None
    types: tuple[ContractType, ...]
    scores: Mapping[ContractType, float]
    weather: str
    era_id: str
    turbulence: float
    density: float
    drift: float


def make_worldstate_contract_view(
    *,
    identity: IdentityPressureSnapshot,
    world: WorldstateSnapshot,
    contract: PlayerFlowerContract,
    flower_id: str,
) -> WorldstateContractView:
    """Attach world context without changing an existing contract result."""

    if not flower_id.strip():
        raise ValueError("flower_id must not be empty")
    return WorldstateContractView(
        identity_id=identity.identity_id,
        basin_id=identity.basin_id,
        flower_id=flower_id,
        accepted=contract.accepted,
        dominant_mode=contract.dominant_mode,
        types=tuple(contract.types),
        scores=dict(contract.scores),
        weather=world.symbolic_weather.value,
        era_id=world.era_id,
        turbulence=world.turbulence,
        density=world.density,
        drift=world.drift,
    )
