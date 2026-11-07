from engine.structural import ProposalType,StructuralProposal
from engine.topology import *
def _state():
 a=TopologicalNode("a","f",1,NodeLifecycle.ACTIVE,("r",));b=TopologicalNode("b","f",1,NodeLifecycle.ACTIVE,("r",));r=Relationship("r","a","b",RelationshipKind.ORDINARY,.5,0,0);f=FlowerTopology("f",(1,2),("a","b"));return TopologyState(0,0,(a,b),(r,),(f,))
def _proposal(kind,**x):return StructuralProposal("p",kind,"a",.9,3,("e",),1,**x)
def test_anchor_commits_as_immutable_successor():
 r=evaluate_topology(_state(),(),TopologyContext(0,1))
 assert not r.committed
 from engine.structural import StructuralResult,StructuralRegime
 s=StructuralResult("a",1,1,StructuralRegime.STABLE,(),(),(_proposal(ProposalType.STRENGTHEN_TO_ANCHOR,relationship_id="r",target_id="b"),),None)
 r=evaluate_topology(_state(),(s,),TopologyContext(0,1));assert r.committed and r.resulting_state.version==1 and r.resulting_state.relationships[0].kind is RelationshipKind.ANCHOR
def test_stale_topology_context_cannot_overwrite_committed_state():
 import pytest
 with pytest.raises(ValueError,match="expected_version"):
  evaluate_topology(_state(),(),TopologyContext(1,1))
