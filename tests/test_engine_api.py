from fastapi.testclient import TestClient

from engine.api import app, graph


client = TestClient(app)


def test_tick_returns_graph_snapshot() -> None:
    response = client.get("/tick")

    assert response.status_code == 200
    assert response.json()["sequence"] >= 1
    assert "nodes" in response.json()


def test_node_activation_is_applied_on_next_tick() -> None:
    response = client.post("/input/basin", json={"type": "node.activate"})

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    state = graph.tick()
    assert state["nodes"]["basin"]["active"] is True
    assert state["nodes"]["basin"]["lastInput"] == {"type": "node.activate"}
    assert state["inputs"][-1]["nodeId"] == "basin"


def test_rejects_unknown_nodes_and_legacy_activation_fields() -> None:
    unknown = client.post("/input/not-a-canonical-node", json={"type": "node.activate"})
    legacy = client.post("/input/basin", json={"click": True})

    assert unknown.status_code == 400
    assert unknown.json()["detail"] == "unknown canonical node_id: not-a-canonical-node"
    assert legacy.status_code == 400
    assert legacy.json()["detail"] == "legacy activation fields are not supported; use type 'node.activate'"


def test_activation_preserves_canonical_ontology_and_never_materializes_unknown_nodes() -> None:
    canonical_before = graph.canonical_node_ids
    runtime_before = graph.runtime_node_ids

    activated = client.post("/input/glyph_archive", json={"type": "node.activate"})
    unknown = client.post("/input/nonexistent-node", json={"type": "node.activate"})
    state = graph.tick()

    assert activated.status_code == 200
    assert state["nodes"]["glyph_archive"]["active"] is True
    assert state["nodes"]["glyph_archive"]["lastInput"] == {"type": "node.activate"}
    assert "glyph_archive" in graph.runtime_node_ids
    assert graph.canonical_node_ids == canonical_before
    assert graph.runtime_node_ids.issuperset(runtime_before)
    assert unknown.status_code == 400
    assert "nonexistent-node" not in graph.runtime_node_ids
    assert graph.canonical_node_ids == canonical_before


def test_allows_the_local_pages_frontend_origin() -> None:
    response = client.get("/tick", headers={"origin": "http://127.0.0.1:8788"})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:8788"