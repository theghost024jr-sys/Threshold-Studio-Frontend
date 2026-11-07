from engine.player_contracts import ContractWeights
from engine.weights import WeightShift, flower_weights
def test_canonical_flower_weights_evolve_by_era_and_identity() -> None:
    weights=flower_weights("threshold",WeightShift(2.,1.,1.,1.,1.),ContractWeights(.1,0.,0.,0.,0.))
    assert weights.pressure == 1.0
    assert weights.resonance == .25
