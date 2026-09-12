from __future__ import annotations

from copy import deepcopy
from threading import RLock
from time import time
from typing import Any, Callable


class Graph:
    """Authoritative, process-local state for the Threshold field."""

    def __init__(self, clock: Callable[[], float] = time) -> None:
        self._clock = clock
        self._lock = RLock()
        self._sequence = 0
        self._nodes: dict[str, dict[str, Any]] = {}
        self._pending_inputs: list[dict[str, Any]] = []

    def apply_input(self, node_id: str, data: dict[str, Any]) -> None:
        normalized_id = node_id.strip()
        if not normalized_id:
            raise ValueError("node_id must not be empty")

        received_at = self._clock()
        with self._lock:
            node = self._nodes.setdefault(
                normalized_id,
                {"id": normalized_id, "active": False, "inputCount": 0},
            )
            node["active"] = bool(data.get("active", data.get("click", node["active"])))
            node["inputCount"] += 1
            node["lastInput"] = deepcopy(data)
            node["updatedAt"] = received_at
            self._pending_inputs.append(
                {"nodeId": normalized_id, "data": deepcopy(data), "receivedAt": received_at}
            )

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