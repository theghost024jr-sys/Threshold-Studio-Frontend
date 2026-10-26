from engine.catalysis import catalyze_era
from engine.interference import ModeField
from engine.player_contracts import ContractWeights
def test_collective_collapse_fields_catalyze_collapse_era() -> None:
    result=catalyze_era([ModeField("collapse",0,0,0,1,0),ModeField("collapse",0,0,0,1,0)],ContractWeights(1,1,1,2,1),3,.5)
    assert result.ignited and result.source_mode=="collapse" and result.target_era=="collapse" and result.propagation==2
