"""Immutable, proposal-driven authority for Threshold topology."""
from __future__ import annotations
from dataclasses import dataclass, replace
from enum import Enum
from engine.structural import ProposalType, StructuralResult, StructuralProposal

class NodeLifecycle(str,Enum): ACTIVE="active"; DESTABILIZED="destabilized"; COLLAPSED="collapsed"
class RelationshipKind(str,Enum): ORDINARY="ordinary"; ANCHOR="anchor"
class TopologyDecision(str,Enum): ACCEPT="accept"; REJECT="reject"; DEFER="defer"
class TopologyEventType(str,Enum): ANCHOR_ESTABLISHED="anchor_established"; ORBIT_CHANGED="orbit_changed"; FLOWER_CAPTURED="flower_captured"; NODE_COLLAPSED="node_collapsed"; RELATIONSHIP_WEAKENED="relationship_weakened"
@dataclass(frozen=True,slots=True)
class TopologicalNode:
    node_id:str; flower_id:str|None; orbit_id:int|None; lifecycle:NodeLifecycle; relationship_ids:tuple[str,...]=()
@dataclass(frozen=True,slots=True)
class Relationship:
    relationship_id:str; node_a:str; node_b:str; kind:RelationshipKind; strength:float; established_at:int; last_transition_at:int
@dataclass(frozen=True,slots=True)
class FlowerTopology:
    flower_id:str; orbit_ids:tuple[int,...]; node_ids:tuple[str,...]
@dataclass(frozen=True,slots=True)
class TopologyState:
    version:int; world_tick:int; nodes:tuple[TopologicalNode,...]; relationships:tuple[Relationship,...]; flowers:tuple[FlowerTopology,...]; committed_event_ids:tuple[str,...]=()
@dataclass(frozen=True,slots=True)
class TopologyContext:
    expected_version:int; world_tick:int; conflict_margin:float=.05
@dataclass(frozen=True,slots=True)
class ProposalRejection:
    proposal_id:str; decision:TopologyDecision; reason:str
@dataclass(frozen=True,slots=True)
class TopologyEvent:
    event_id:str; transaction_id:str; event_type:TopologyEventType; prior_version:int; resulting_version:int; subjects:tuple[str,...]; supporting_proposals:tuple[str,...]; world_tick:int
@dataclass(frozen=True,slots=True)
class TopologyResult:
    committed:bool; prior_state:TopologyState; resulting_state:TopologyState; accepted_proposals:tuple[str,...]; rejected_proposals:tuple[ProposalRejection,...]; deferred_proposals:tuple[ProposalRejection,...]; events:tuple[TopologyEvent,...]

def evaluate_topology(prior:TopologyState,structural_results:tuple[StructuralResult,...],context:TopologyContext)->TopologyResult:
    if prior.version!=context.expected_version: raise ValueError("expected_version must match prior topology version")
    if any(r.world_tick!=context.world_tick for r in structural_results): raise ValueError("StructuralResults must belong to context world_tick")
    proposals=tuple(p for r in structural_results for p in r.proposals)
    valid=[]; rejected=[]
    for p in proposals:
        reason=_validate(p,prior)
        if reason: rejected.append(ProposalRejection(p.proposal_id,TopologyDecision.REJECT,reason))
        else: valid.append(p)
    winners=[]; deferred=[]
    for group in _groups(valid).values():
        group=sorted(group,key=lambda p:(p.confidence,p.persistence),reverse=True)
        if len(group)>1 and group[0].confidence-group[1].confidence<=context.conflict_margin:
            deferred += [ProposalRejection(p.proposal_id,TopologyDecision.DEFER,"ambiguous structural conflict") for p in group]
        else: winners.append(group[0])
    candidate=_apply(prior,tuple(winners),context.world_tick)
    violations=_invariants(candidate)
    if violations:
        return TopologyResult(False,prior,prior,(),tuple(rejected+[ProposalRejection("transaction",TopologyDecision.REJECT,v) for v in violations]),tuple(deferred),())
    if not winners:return TopologyResult(False,prior,prior,(),tuple(rejected),tuple(deferred),())
    resulting=replace(candidate,version=prior.version+1,world_tick=context.world_tick)
    transaction=f"topology:{prior.version}:{context.world_tick}"
    events=tuple(_event(p,transaction,prior,resulting) for p in winners)
    resulting=replace(resulting,committed_event_ids=prior.committed_event_ids+tuple(e.event_id for e in events))
    return TopologyResult(True,prior,resulting,tuple(p.proposal_id for p in winners),tuple(rejected),tuple(deferred),events)
def _validate(p:StructuralProposal,s:TopologyState)->str|None:
    nodes={n.node_id:n for n in s.nodes}; rels={r.relationship_id:r for r in s.relationships}; flowers={f.flower_id:f for f in s.flowers}
    if p.node_id not in nodes:return "unknown node"
    n=nodes[p.node_id]
    if n.lifecycle is NodeLifecycle.COLLAPSED:return "collapsed node"
    if p.proposal_type is ProposalType.STRENGTHEN_TO_ANCHOR:
        r=rels.get(p.relationship_id or ""); return None if r and r.kind is RelationshipKind.ORDINARY and p.node_id in (r.node_a,r.node_b) else "invalid anchor relationship"
    if p.proposal_type is ProposalType.CHANGE_ORBIT:return None if n.flower_id and p.target_orbit in dict((f.flower_id,f) for f in s.flowers)[n.flower_id].orbit_ids else "invalid target orbit"
    if p.proposal_type is ProposalType.CROSS_FLOWER_CAPTURE:return None if n.flower_id==p.source_flower_id and p.target_flower_id in flowers and p.target_flower_id!=n.flower_id else "invalid capture"
    return None
def _groups(ps:list[StructuralProposal])->dict[str,list[StructuralProposal]]:
    out={}
    for p in ps:
        key=p.conflict_id or (f"node:{p.node_id}" if p.proposal_type in (ProposalType.CHANGE_ORBIT,ProposalType.CROSS_FLOWER_CAPTURE,ProposalType.COLLAPSE_CANDIDATE) else f"relationship:{p.relationship_id}" if p.relationship_id else p.proposal_id)
        out.setdefault(key,[]).append(p)
    return out
def _apply(s:TopologyState,ps:tuple[StructuralProposal,...],tick:int)->TopologyState:
    nodes={n.node_id:n for n in s.nodes}; rels={r.relationship_id:r for r in s.relationships}; flowers={f.flower_id:f for f in s.flowers}
    for p in ps:
        n=nodes[p.node_id]
        if p.proposal_type is ProposalType.STRENGTHEN_TO_ANCHOR:
            r=rels[p.relationship_id]; rels[r.relationship_id]=replace(r,kind=RelationshipKind.ANCHOR,last_transition_at=tick)
        elif p.proposal_type is ProposalType.WEAKEN_RELATIONSHIP:
            r=rels[p.relationship_id]; rels[r.relationship_id]=replace(r,strength=max(0.,r.strength-.1),last_transition_at=tick)
        elif p.proposal_type is ProposalType.CHANGE_ORBIT:nodes[n.node_id]=replace(n,orbit_id=p.target_orbit)
        elif p.proposal_type is ProposalType.CROSS_FLOWER_CAPTURE:
            old=flowers[n.flower_id]; new=flowers[p.target_flower_id]; flowers[old.flower_id]=replace(old,node_ids=tuple(i for i in old.node_ids if i!=n.node_id)); flowers[new.flower_id]=replace(new,node_ids=tuple(sorted(new.node_ids+(n.node_id,)))); nodes[n.node_id]=replace(n,flower_id=new.flower_id,orbit_id=p.target_orbit)
        elif p.proposal_type is ProposalType.COLLAPSE_CANDIDATE:nodes[n.node_id]=replace(n,lifecycle=NodeLifecycle.COLLAPSED,orbit_id=None,flower_id=None)
    return TopologyState(s.version,s.world_tick,tuple(nodes.values()),tuple(rels.values()),tuple(flowers.values()),s.committed_event_ids)
def _invariants(s:TopologyState)->tuple[str,...]:
    nodes={n.node_id:n for n in s.nodes}; issues=[]
    if len(nodes)!=len(s.nodes):issues.append("duplicate node identity")
    for r in s.relationships:
        if r.node_a==r.node_b or r.node_a not in nodes or r.node_b not in nodes:issues.append("invalid relationship endpoint")
    for n in nodes.values():
        if n.orbit_id is not None and n.flower_id is None:issues.append("orbit without flower")
        if n.lifecycle is NodeLifecycle.COLLAPSED and (n.flower_id is not None or n.orbit_id is not None):issues.append("collapsed node retains membership")
    for f in s.flowers:
        for i in f.node_ids:
            if i not in nodes or nodes[i].flower_id!=f.flower_id:issues.append("inconsistent flower ownership")
    return tuple(dict.fromkeys(issues))
def _event(p:StructuralProposal,tx:str,prior:TopologyState,resulting:TopologyState)->TopologyEvent:
    kind={ProposalType.STRENGTHEN_TO_ANCHOR:TopologyEventType.ANCHOR_ESTABLISHED,ProposalType.CHANGE_ORBIT:TopologyEventType.ORBIT_CHANGED,ProposalType.CROSS_FLOWER_CAPTURE:TopologyEventType.FLOWER_CAPTURED,ProposalType.COLLAPSE_CANDIDATE:TopologyEventType.NODE_COLLAPSED,ProposalType.WEAKEN_RELATIONSHIP:TopologyEventType.RELATIONSHIP_WEAKENED}.get(p.proposal_type,TopologyEventType.RELATIONSHIP_WEAKENED)
    return TopologyEvent(f"event:{tx}:{p.proposal_id}",tx,kind,prior.version,resulting.version,(p.node_id,)+((p.target_id,) if p.target_id else ()),(p.proposal_id,),resulting.world_tick)
