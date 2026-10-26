from engine.interference import ModeField,evaluate_interference
from engine.player_contracts import ContractWeights
def test_weighted_cross_player_interference_classifies_flower_stress() -> None:
    result=evaluate_interference([ModeField("collapse",0,0,0,1,0),ModeField("collapse",0,0,0,1,0)],ContractWeights(1,1,1,2,1),.1,3)
    assert result.outcome=="dominance"
    assert result.interference_mode
