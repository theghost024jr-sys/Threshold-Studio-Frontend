from __future__ import annotations

from dataclasses import dataclass
from math import sqrt

from engine.force import NodeFieldState
from engine.node_physics import NodeMotionState
from engine.structural import (
    FlowerState,
    RelationshipState,
    StructuralRegime,
    StructuralState,
)
from engine.topology import (
    FlowerTopology,
    NodeLifecycle,
    Relationship,
    RelationshipKind,
    TopologicalNode,
    TopologyState,
)


@dataclass(frozen=True, slots=True)
class FibFlowerScenario001:
    """Scenario 001 defines initial conditions only, never outcomes."""

    topology: TopologyState
    field_nodes: dict[str, NodeFieldState]
    motion_states: dict[str, NodeMotionState]
    flower_a_state: FlowerState
    flower_b_state: FlowerState
    subject_structure: StructuralState
    subject_id: str = "A6"
    internal_source_id: str = "A4"
    foreign_source_id: str = "B1"
    dimension_id: str = "signal"


def fib_flower_scenario_001() -> FibFlowerScenario001:
    """Construct the deterministic initial world for the Outer Node scenario."""

    positions = {
        "A1": (0.0, 0.0),
        "A2": (-1.0, 1.0),
        "A3": (1.0, 1.0),
        "A4": (-2.0, 2.0),
        "A5": (2.0, 2.0),
        "A6": (-3.0, 3.0),
        "B1": (-5.0, 4.0),
    }
    relationships = (
        Relationship("relationship-a1-a2", "A1", "A2", RelationshipKind.ORDINARY, .5, 0, 0),
        Relationship("relationship-a1-a3", "A1", "A3", RelationshipKind.ORDINARY, .5, 0, 0),
        Relationship("relationship-a2-a3", "A2", "A3", RelationshipKind.ORDINARY, .5, 0, 0),
        Relationship("relationship-a2-a4", "A2", "A4", RelationshipKind.ORDINARY, .5, 0, 0),
        Relationship("relationship-a3-a5", "A3", "A5", RelationshipKind.ORDINARY, .5, 0, 0),
        Relationship("relationship-a4-a6", "A4", "A6", RelationshipKind.ORDINARY, .5, 0, 0),
    )
    relationship_ids = {
        "A1": ("relationship-a1-a2", "relationship-a1-a3"),
        "A2": ("relationship-a1-a2", "relationship-a2-a3", "relationship-a2-a4"),
        "A3": ("relationship-a1-a3", "relationship-a2-a3", "relationship-a3-a5"),
        "A4": ("relationship-a2-a4", "relationship-a4-a6"),
        "A5": ("relationship-a3-a5",),
        "A6": ("relationship-a4-a6",),
        "B1": (),
    }
    topology_nodes = tuple(
        TopologicalNode(
            node_id,
            "flower-b" if node_id == "B1" else "flower-a",
            0,
            NodeLifecycle.ACTIVE,
            relationship_ids[node_id],
        )
        for node_id in positions
    )
    flowers = (
        FlowerTopology("flower-a", (0,), ("A1", "A2", "A3", "A4", "A5", "A6")),
        FlowerTopology("flower-b", (0,), ("B1",)),
    )
    field_nodes = {
        node_id: NodeFieldState(node_id, position)
        for node_id, position in positions.items()
    }
    motion_states = {
        node_id: NodeMotionState(
            node_id,
            0,
            position,
            (0.0, 0.0),
            (0.0, 0.0),
            1.0,
            1.0,
            .1,
            0,
        )
        for node_id, position in positions.items()
    }
    flower_a_state = FlowerState("flower-a", (0.0, 0.0), (1.0,), 1.0)
    flower_b_state = FlowerState("flower-b", (-5.0, 4.0), (1.0,), 1.0)
    subject_structure = StructuralState(
        "A6",
        0,
        StructuralRegime.STABLE,
        "flower-a",
        0,
        1.0,
        (
            RelationshipState(
                "relationship-a4-a6",
                "A4",
                positions["A4"],
                sqrt(2.0),
                1.0,
                1.0,
                1.0,
                0.0,
                0.0,
            ),
        ),
    )
    return FibFlowerScenario001(
        topology=TopologyState(0, 0, topology_nodes, relationships, flowers),
        field_nodes=field_nodes,
        motion_states=motion_states,
        flower_a_state=flower_a_state,
        flower_b_state=flower_b_state,
        subject_structure=subject_structure,
    )
