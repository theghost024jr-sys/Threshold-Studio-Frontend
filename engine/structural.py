"""Proposal-only structural interpretation of pressure, force, and motion."""
from __future__ import annotations
from dataclasses import dataclass, replace
from enum import Enum
from math import hypot
from engine.force import ForceResult
from engine.node_physics import MotionClass, NodePhysicsResult
from engine.pressure import PressureResult

class StructuralRegime(str, Enum):
    QUIESCENT="quiescent"; STABLE="stable"; DRIFTING="drifting"; TENSIONED="tensioned"; PINNED="pinned"; ORBIT_UNSTABLE="orbit_unstable"; CAPTURE_CONTESTED="capture_contested"; FRACTURE_PROPAGATING="fracture_propagating"; COLLAPSE_RISK="collapse_risk"
class ProposalType(str, Enum):
    WEAKEN_RELATIONSHIP="weaken_relationship"; STRENGTHEN_TO_ANCHOR="strengthen_to_anchor"; CHANGE_ORBIT="change_orbit"; CROSS_FLOWER_CAPTURE="cross_flower_capture"; FRACTURE_PROPAGATION="fracture_propagation"; COLLAPSE_CANDIDATE="collapse_candidate"
def _u(v:float)->float: return max(0.,min(1.,v))
def _d(a:tuple[float,float],b:tuple[float,float])->float: return hypot(a[0]-b[0],a[1]-b[1])
def _id(name:str,v:str)->None:
    if not v.strip(): raise ValueError(f"{name} must not be empty")
@dataclass(frozen=True,slots=True)
class PersistenceStreak:
    consecutive_ticks:int=0; total_ticks:int=0; accumulated_severity:float=0.; started_at:int|None=None; last_observed_at:int|None=None
    def update(self,condition:bool,severity:float,tick:int)->"PersistenceStreak":
        if not condition:return PersistenceStreak(last_observed_at=tick)
        return PersistenceStreak(self.consecutive_ticks+1,self.total_ticks+1,self.accumulated_severity+severity,tick if not self.consecutive_ticks else self.started_at,tick)
@dataclass(frozen=True,slots=True)
class RelationshipState:
    relationship_id:str; other_node_id:str; other_position:tuple[float,float]; last_distance:float
    mutuality:float; continuity:float; compatible_pressure_support:float; contradictory_pressure_load:float; strain:float
    strengthening_streak:PersistenceStreak=PersistenceStreak(); weakening_streak:PersistenceStreak=PersistenceStreak()
@dataclass(frozen=True,slots=True)
class FlowerInfluence:
    flower_id:str; capture_strength:float; directional_support:float; relationship_support:float
@dataclass(frozen=True,slots=True)
class FlowerState:
    flower_id:str; center:tuple[float,float]; orbit_bands:tuple[float,...]; home_retention:float; foreign_influences:tuple[FlowerInfluence,...]=()
@dataclass(frozen=True,slots=True)
class StructuralState:
    node_id:str; sequence:int; regime:StructuralRegime; home_flower_id:str; current_orbit:int; orbit_stability:float
    relationship_states:tuple[RelationshipState,...]; coherence_streak:PersistenceStreak=PersistenceStreak(); drift_streak:PersistenceStreak=PersistenceStreak(); tension_streak:PersistenceStreak=PersistenceStreak(); frustration_streak:PersistenceStreak=PersistenceStreak(); displacement_streak:PersistenceStreak=PersistenceStreak(); foreign_capture_streak:PersistenceStreak=PersistenceStreak(); collapse_streak:PersistenceStreak=PersistenceStreak(); last_transition_tick:int=0; last_evaluated_tick:int=0
@dataclass(frozen=True,slots=True)
class StructuralThresholds:
    quiet_pressure:float; quiet_force:float; rest_distance:float; tension:float; frustration:float; displacement:float; mutuality:float; continuity:float; support:float; safe_strain:float; strain:float; contradiction:float; minimum_continuity:float; unstable_orbit:float; capture_direction:float; capture_relationship:float; collapse_pressure:float; collapse_tension:float; collapse_frustration:float; critical_relationships:int
@dataclass(frozen=True,slots=True)
class StructuralWindows:
    anchor:int; relationship_weakening:int; structural_tension:int; orbit_transition:int; capture:int; collapse:int
@dataclass(frozen=True,slots=True)
class StructuralContext:
    world_tick:int; thresholds:StructuralThresholds; windows:StructuralWindows; capture_margin:float=0.; supported_resolution_path:bool=True
@dataclass(frozen=True,slots=True)
class StructuralObservation:
    world_tick:int; pressure:float; gross_force:float; resultant_force:float; effective_force:float; directional_bias:float; tension:float; displacement:float; speed:float; motion_class:MotionClass; motion_frustration:float; constraint_hits:int
@dataclass(frozen=True,slots=True)
class StructuralProposal:
    proposal_id:str; proposal_type:ProposalType; node_id:str; confidence:float; persistence:int; evidence:tuple[str,...]; emitted_at:int; relationship_id:str|None=None; target_id:str|None=None; source_flower_id:str|None=None; target_flower_id:str|None=None; source_orbit:int|None=None; target_orbit:int|None=None; conflict_id:str|None=None
@dataclass(frozen=True,slots=True)
class StructuralResult:
    node_id:str; sequence:int; world_tick:int; regime:StructuralRegime; observations:tuple[StructuralObservation,...]; relationship_updates:tuple[RelationshipState,...]; proposals:tuple[StructuralProposal,...]; resulting_state:StructuralState

def evaluate_structure(node_id:str,pressure:PressureResult,force:ForceResult,physics:NodePhysicsResult,flower:FlowerState,history:StructuralState,context:StructuralContext)->StructuralResult:
    _id("node_id",node_id)
    if any(v.node_id!=node_id for v in (pressure,force,physics)): raise ValueError("all inputs must belong to node_id")
    if pressure.sequence!=force.pressure_sequence or physics.force_sequence!=force.pressure_sequence: raise ValueError("pressure, force, and physics sequences must align")
    if context.world_tick< history.last_evaluated_tick: raise ValueError("world_tick must not regress")
    t=context.thresholds; w=context.windows; tick=context.world_tick
    obs=StructuralObservation(tick,pressure.resulting_total,force.gross_force,force.resultant_magnitude,force.effective_magnitude,force.directional_bias,force.tension,physics.distance,hypot(*physics.velocity),physics.motion_class,physics.motion_frustration,len(physics.constraint_hits))
    coherence=history.coherence_streak.update(pressure.resulting_total<=t.quiet_pressure and force.tension<t.tension,1,tick)
    drift=history.drift_streak.update(physics.motion_class is MotionClass.DRIFTING,physics.distance,tick)
    tension=history.tension_streak.update(force.tension>=t.tension,_u(force.tension),tick)
    frustration=history.frustration_streak.update(physics.motion_frustration>=t.frustration,physics.motion_frustration,tick)
    displacement=history.displacement_streak.update(physics.distance>=t.displacement,_u(physics.distance),tick)
    updates=[]; proposals=[]
    for r in history.relationship_states:
        dist=_d(physics.position,r.other_position); strain=_u(max(r.strain,force.tension,physics.motion_frustration)); support=_u(r.compatible_pressure_support*pressure.resulting_total); contradiction=_u(max(r.contradictory_pressure_load,force.tension))
        strong=r.mutuality>=t.mutuality and r.continuity>=t.continuity and support>=t.support and strain<=t.safe_strain
        weak=strain>=t.strain or contradiction>=t.contradiction or r.continuity<=t.minimum_continuity
        updated=replace(r,last_distance=dist,compatible_pressure_support=support,contradictory_pressure_load=contradiction,strain=strain,strengthening_streak=r.strengthening_streak.update(strong,support,tick),weakening_streak=r.weakening_streak.update(weak,strain,tick)); updates.append(updated)
        if updated.strengthening_streak.consecutive_ticks>=w.anchor: proposals.append(_proposal(ProposalType.STRENGTHEN_TO_ANCHOR,node_id,tick,updated.strengthening_streak.consecutive_ticks,support,r.relationship_id,r.other_node_id))
        if updated.weakening_streak.consecutive_ticks>=w.relationship_weakening: proposals.append(_proposal(ProposalType.WEAKEN_RELATIONSHIP,node_id,tick,updated.weakening_streak.consecutive_ticks,strain,r.relationship_id,r.other_node_id))
    radius=_d(physics.position,flower.center); candidate=min(range(len(flower.orbit_bands)),key=lambda i:abs(flower.orbit_bands[i]-radius)) if flower.orbit_bands else history.current_orbit
    stability=_u(history.orbit_stability-physics.distance*force.directional_bias if physics.motion_class is MotionClass.DRIFTING else history.orbit_stability+.05)
    if stability<=t.unstable_orbit and displacement.consecutive_ticks>=w.orbit_transition: proposals.append(_proposal(ProposalType.CHANGE_ORBIT,node_id,tick,displacement.consecutive_ticks,_u(1-stability),source_orbit=history.current_orbit,target_orbit=candidate))
    foreign=max(flower.foreign_influences,key=lambda x:x.capture_strength,default=None)
    captured=foreign is not None and foreign.capture_strength>flower.home_retention+context.capture_margin and foreign.directional_support>=t.capture_direction and foreign.relationship_support>=t.capture_relationship
    capture=history.foreign_capture_streak.update(captured,foreign.capture_strength if foreign else 0,tick)
    if captured and capture.consecutive_ticks>=w.capture: proposals.append(_proposal(ProposalType.CROSS_FLOWER_CAPTURE,node_id,tick,capture.consecutive_ticks,foreign.capture_strength,source_flower=flower.flower_id,target_flower=foreign.flower_id))
    critical=sum(r.weakening_streak.consecutive_ticks>=w.relationship_weakening for r in updates)
    fracture=critical>0 and force.tension>=t.tension and physics.motion_frustration>=t.frustration
    if fracture: proposals.append(_proposal(ProposalType.FRACTURE_PROPAGATION,node_id,tick,critical,_u(force.tension),evidence=tuple(r.relationship_id for r in updates if r.weakening_streak.consecutive_ticks)))
    collapse_ok=pressure.resulting_total>=t.collapse_pressure and force.tension>=t.collapse_tension and physics.motion_frustration>=t.collapse_frustration and critical>=t.critical_relationships and not context.supported_resolution_path
    collapse=history.collapse_streak.update(collapse_ok,pressure.resulting_total,tick)
    if collapse.consecutive_ticks>=w.collapse: proposals.append(_proposal(ProposalType.COLLAPSE_CANDIDATE,node_id,tick,collapse.consecutive_ticks,_u((pressure.resulting_total+_u(force.tension)+physics.motion_frustration)/3)))
    regime=StructuralRegime.PINNED if force.tension>=t.tension and physics.motion_frustration>=t.frustration else StructuralRegime.COLLAPSE_RISK if collapse.consecutive_ticks else StructuralRegime.FRACTURE_PROPAGATING if fracture else StructuralRegime.CAPTURE_CONTESTED if capture.consecutive_ticks else StructuralRegime.ORBIT_UNSTABLE if stability<=t.unstable_orbit else StructuralRegime.TENSIONED if tension.consecutive_ticks>=w.structural_tension else StructuralRegime.DRIFTING if physics.motion_class is MotionClass.DRIFTING else StructuralRegime.QUIESCENT if pressure.resulting_total<=t.quiet_pressure and force.gross_force<=t.quiet_force and physics.distance<=t.rest_distance else StructuralRegime.STABLE
    if sum(p.proposal_type in (ProposalType.CHANGE_ORBIT,ProposalType.CROSS_FLOWER_CAPTURE,ProposalType.COLLAPSE_CANDIDATE) for p in proposals)>1: proposals=[replace(p,conflict_id=f"conflict:{node_id}:{history.sequence+1}") if p.proposal_type in (ProposalType.CHANGE_ORBIT,ProposalType.CROSS_FLOWER_CAPTURE,ProposalType.COLLAPSE_CANDIDATE) else p for p in proposals]
    state=StructuralState(node_id,history.sequence+1,regime,history.home_flower_id,candidate,stability,tuple(updates),coherence,drift,tension,frustration,displacement,capture,collapse,tick if regime is not history.regime else history.last_transition_tick,tick)
    return StructuralResult(node_id,state.sequence,tick,regime,(obs,),tuple(updates),tuple(proposals),state)
def _proposal(kind:ProposalType,node:str,tick:int,persistence:int,confidence:float,relationship_id:str|None=None,target_id:str|None=None,source_flower:str|None=None,target_flower:str|None=None,source_orbit:int|None=None,target_orbit:int|None=None,evidence:tuple[str,...]=())->StructuralProposal:
    return StructuralProposal(f"structural:{node}:{tick}:{kind.value}",kind,node,_u(confidence),persistence,evidence or (f"tick:{tick}",),tick,relationship_id,target_id,source_flower,target_flower,source_orbit,target_orbit)
