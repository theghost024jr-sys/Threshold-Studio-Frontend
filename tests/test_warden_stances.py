from engine.warden_stances import StanceResponse, resolve_warden_stance
def test_canonical_warden_stance_matrix_and_override() -> None:
    response=resolve_warden_stance("survivor","navigator")
    assert response.interference_mode == "conflict"
    assert response.navigation_effect == "collapse_flow_storm"
    override=StanceResponse("alignment","+","custom","custom","pressure","guardian","basin_deepen","stable")
    assert resolve_warden_stance("navigator","oracle",override).navigation_effect == "custom"


def test_refusal_returns_non_participation_response() -> None:
    response = resolve_warden_stance("refusal", "survivor")

    assert response.interference_mode == "refusal"
    assert response.pressure_delta == "0"
    assert response.navigation_effect == "no_change"
    assert response.contract_effect == "none"
    assert response.memory == "misalignment_memory++"
