from engine.capabilities import get_capability_profile
def test_dominant_mode_capabilities_match_canonical_table() -> None:
    profile=get_capability_profile("collapse")
    assert profile.movement == "turbulent-powerful"
    assert profile.collapse == "surf-redirect"
    assert profile.risk == "high"
