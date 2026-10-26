"""Canonical player-stance by Warden-identity response mapping."""
from __future__ import annotations
from dataclasses import dataclass, replace
from typing import Literal

WardenIdentity = Literal[
    "stabilizer", "conductor", "navigator", "survivor", "oracle"
]
Stance = WardenIdentity | Literal["refusal"]
Interference = Literal[
    "alignment",
    "resistance",
    "destabilization",
    "conflict",
    "oscillation",
    "refusal",
]

@dataclass(frozen=True)
class StanceResponse:
    interference_mode: Interference
    pressure_delta: str
    navigation_effect: str
    contract_effect: str
    memory: str
    identity: str
    topology: str
    era_drift: str

_MODE: dict[tuple[WardenIdentity, WardenIdentity], tuple[Interference, str]] = {
    ("stabilizer","stabilizer"): ("alignment","basin_deepen"),
    ("stabilizer","conductor"): ("resistance","harmonic_dampen"),
    ("stabilizer","navigator"): ("destabilization","corridor_tension"),
    ("stabilizer","survivor"): ("conflict","collapse_flicker"),
    ("stabilizer","oracle"): ("oscillation","slit_instability"),
    ("conductor","stabilizer"): ("resistance","resonance_suppressed"),
    ("conductor","conductor"): ("alignment","harmonic_corridors_bloom"),
    ("conductor","navigator"): ("destabilization","harmonic_drift"),
    ("conductor","survivor"): ("conflict","harmonic_inversion"),
    ("conductor","oracle"): ("oscillation","symbolic_resonance_storm"),
    ("navigator","stabilizer"): ("resistance","corridor_straighten_block"),
    ("navigator","conductor"): ("destabilization","rhythm_direction_conflict"),
    ("navigator","navigator"): ("alignment","flow_coherence"),
    ("navigator","survivor"): ("conflict","collapse_flow_turbulence"),
    ("navigator","oracle"): ("oscillation","metaphysical_journey_arc"),
    ("survivor","stabilizer"): ("resistance","collapse_suppressed"),
    ("survivor","conductor"): ("destabilization","harmonic_implosion"),
    ("survivor","navigator"): ("conflict","collapse_flow_storm"),
    ("survivor","survivor"): ("alignment","controlled_collapse_surfing"),
    ("survivor","oracle"): ("oscillation","polarity_collapse_conflict"),
    ("oracle","stabilizer"): ("resistance","polarity_dampen"),
    ("oracle","conductor"): ("destabilization","symbolic_harmonic_storm"),
    ("oracle","navigator"): ("conflict","metaphysical_flow_distortion"),
    ("oracle","survivor"): ("oscillation","existential_collapse_arc"),
    ("oracle","oracle"): ("alignment","spirit_corridor_expand"),
}
_FIELDS: dict[Interference, tuple[str,str,str,str,str,str]] = {
    "alignment": ("+","identity_pact","reinforce","strengthen","basin_deepen","stable_or_rebirth"),
    "resistance": ("++","identity_resist","pressure_scar","harden","curvature_stiffen","oscillatory"),
    "destabilization": ("±","identity_unstable","flow_or_resonance_distortion","wobble","basin_wobble","chaotic"),
    "conflict": ("-","identity_break","collapse_scar","fracture","funnelize","collapse"),
    "oscillation": ("~","identity_polarize","spirit_or_symbolic_memory","polarize","slit_polarize","rebirth_or_collapse"),
    "refusal": ("0","none","misalignment_memory++","no_lock","unchanged","no_contribution"),
}
def resolve_warden_stance(
    player_stance: Stance,
    warden_identity: WardenIdentity,
    override: StanceResponse | None = None,
    *,
    refusal_active: bool = False,
) -> StanceResponse:
    """Resolve the canonical 5×5 pair response, with optional zone override."""
    if override:
        return override
    if player_stance == "refusal" or refusal_active:
        pressure, contract, memory, identity, topology, era = _FIELDS["refusal"]
        return StanceResponse(
            "refusal",
            pressure,
            "no_change",
            contract,
            memory,
            identity,
            topology,
            era,
        )
    mode, navigation = _MODE[(player_stance, warden_identity)]
    pressure, contract, memory, identity, topology, era = _FIELDS[mode]
    return StanceResponse(mode, pressure, navigation, contract, memory, identity, topology, era)
