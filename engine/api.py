import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from engine.graph import Graph

app = FastAPI(title="Threshold Engine", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://127.0.0.1:8788",
        "http://localhost:8788",
        "https://www.thresholdstudiowebsite.org",
        "https://threshold-studio-frontend.pages.dev",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["content-type"],
)

def load_canonical_node_ids() -> frozenset[str]:
    registry_path = Path(__file__).resolve().parents[1] / "website" / "data" / "threshold-vault.json"
    try:
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f"unable to load canonical node registry: {registry_path}") from error

    node_ids = frozenset(
        str(node.get("id", "")).strip()
        for node in registry.get("nodes", [])
        if isinstance(node, dict) and str(node.get("id", "")).strip()
    )
    if not node_ids:
        raise RuntimeError(f"canonical node registry contains no node IDs: {registry_path}")
    return node_ids


graph = Graph(load_canonical_node_ids())


@app.get("/tick")
def tick() -> dict[str, Any]:
    return graph.tick()


@app.post("/input/{node_id}")
def input_node(node_id: str, data: dict[str, Any]) -> dict[str, str]:
    try:
        graph.apply_input(node_id, data)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"status": "ok"}