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
        "https://www.thresholdstudiowebsite.org",
        "https://threshold-studio-frontend.pages.dev",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["content-type"],
)

graph = Graph()


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