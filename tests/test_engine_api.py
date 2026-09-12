from fastapi.testclient import TestClient

from engine.api import app, graph


client = TestClient(app)


def test_tick_returns_graph_snapshot() -> None:
    response = client.get("/tick")

    assert response.status_code == 200
    assert response.json()["sequence"] >= 1
    assert "nodes" in response.json()


def test_input_is_applied_on_next_tick() -> None:
    response = client.post("/input/A", json={"click": True})

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    state = graph.tick()
    assert state["nodes"]["A"]["active"] is True
    assert state["nodes"]["A"]["lastInput"] == {"click": True}
    assert state["inputs"][-1]["nodeId"] == "A"