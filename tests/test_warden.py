from engine.warden import IdentityField,evaluate_warden_interference
def test_warden_alignment_resistance_and_destabilization() -> None:
    guardian=IdentityField(1,0,0,0,0)
    assert evaluate_warden_interference(guardian,IdentityField(1,0,0,0,0),.1).mode=="alignment"
    assert evaluate_warden_interference(guardian,IdentityField(0,1,0,0,0),.1).mode=="resistance"
    assert evaluate_warden_interference(IdentityField(1,1,0,0,0),IdentityField(0,1,1,0,0),.1).mode=="destabilization"
