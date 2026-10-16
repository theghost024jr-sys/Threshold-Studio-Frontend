from __future__ import annotations

from copy import deepcopy
from threading import RLock
from time import time
from typing import Any, Callable, Collection


class Graph:
    """Authoritative, process-local state for the Threshold field."""

    def __init__(self, node_ids: Collection[str], clock: Callable[[], float] = time) -> None:
        self._clock = clock
        self._lock = RLock()
        self._sequence = 0
        self._node_ids = frozenset(node_id.strip() for node_id in node_ids if node_id.strip())
        self._nodes: dict[str, dict[str, Any]] = {}
        self._pending_inputs: list[dict[str, Any]] = []

    def apply_input(self, node_id: str, data: dict[str, Any]) -> None:
        normalized_id = node_id.strip()
        if not normalized_id:
            raise ValueError("node_id must not be empty")
        if normalized_id not in self._node_ids:
            raise ValueError(f"unknown canonical node_id: {normalized_id}")
        if "click" in data or "active" in data:
            raise ValueError("legacy activation fields are not supported; use type 'node.activate'")

        received_at = self._clock()
        with self._lock:
            node = self._nodes.setdefault(
                normalized_id,
                {"id": normalized_id, "active": False, "inputCount": 0},
            )
            if data.get("type") == "node.activate":
                node["active"] = True
            node["inputCount"] += 1
            node["lastInput"] = deepcopy(data)
            node["updatedAt"] = received_at
            self._pending_inputs.append(
                {"nodeId": normalized_id, "data": deepcopy(data), "receivedAt": received_at}
            )

    @property
    def canonical_node_ids(self) -> frozenset[str]:
        return self._node_ids

    @property
    def runtime_node_ids(self) -> frozenset[str]:
        with self._lock:
            return frozenset(self._nodes)

    def tick(self) -> dict[str, Any]:
        with self._lock:
            self._sequence += 1
            snapshot = {
                "sequence": self._sequence,
                "timestamp": self._clock(),
                "nodes": deepcopy(self._nodes),
                "inputs": deepcopy(self._pending_inputs),
            }
            self._pending_inputs.clear()
            return snapshot