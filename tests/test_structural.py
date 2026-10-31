from engine.force import ForceResult
from engine.node_physics import MotionClass, NodeMotionState, NodePhysicsResult
from math import log
from engine.pressure import PressureComponent, PressurePolarity, PressureResult, PressureState
from engine.structural import *
def _inputs(tension=0.,frustration=0.,pressure=0.,distance=0.):
 exposed=min(pressure,.999999)
 components=() if exposed==0 else (PressureComponent("signal",-log(1-exposed),exposed,PressurePolarity.ATTRACTIVE,.8,.8,("demand-1",)),)
 s=PressureState("n",1,components,exposed,"signal" if components else None,1 if components else None,1,("demand-1",) if components else ())
 p=PressureResult("n",1,0.,exposed,exposed,components,(),(),(),"signal" if components else None,"stable",s)
 f=ForceResult("n",1,1,(),(),tension,(tension,0.),tension,1. if tension else 0.,tension,(0.,0.),(tension,0.),tension)
 m=NodeMotionState("n",1,(distance,0.),(0.,0.),(0.,0.),1.,1.,1.,1)
 x=NodePhysicsResult("n",1,1,(0.,0.),(distance,0.),(0.,0.),(0.,0.),(0.,0.),(distance,0.),(distance,0.),distance,MotionClass.DRIFTING if distance else MotionClass.RESTING,frustration,(),1,m)
 return p,f,x
def _ctx(path=True):
 t=StructuralThresholds(.1,.1,.1,.5,.5,.2,.5,.5,.2,.4,.6,.6,.2,.5,.5,.5,.5,.5,.5,1)
 return StructuralContext(1,t,StructuralWindows(2,2,2,2,2,2),supported_resolution_path=path)
def _state(rel=()):
 return StructuralState("n",0,StructuralRegime.STABLE,"home",0,1.,rel)
def test_high_pressure_alone_does_not_propose_collapse():
 p,f,x=_inputs(pressure=1.); r=evaluate_structure("n",p,f,x,FlowerState("home",(0.,0.),(0.,),1.),_state(),_ctx(False))
 assert not r.proposals
def test_persistent_relationship_support_proposes_anchor():
 rel=RelationshipState("r","o",(0.,0.),0.,1.,1.,1.,0.,0.,PersistenceStreak(1,1,1,0,0))
 p,f,x=_inputs(pressure=.5); r=evaluate_structure("n",p,f,x,FlowerState("home",(0.,0.),(0.,),1.),_state((rel,)),_ctx())
 assert any(q.proposal_type is ProposalType.STRENGTHEN_TO_ANCHOR for q in r.proposals)
def test_pinned_is_observed_without_topology_mutation():
 p,f,x=_inputs(tension=.9,frustration=.9,pressure=.9); r=evaluate_structure("n",p,f,x,FlowerState("home",(0.,0.),(0.,),1.),_state(),_ctx(False))
 assert r.regime is StructuralRegime.PINNED
