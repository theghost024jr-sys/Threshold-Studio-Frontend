from dataclasses import FrozenInstanceError

import pytest

from engine.circuit_mirror import (
    DemandComponent,
    DemandLineage,
    DemandLineageRelation,
    DemandPolarity,
    DemandSignal,
    DiscrepancyComponent,
    DiscrepancyDirection,
    DiscrepancyVector,
    EvidenceSummary,
    MirrorOutput,
    MirrorState,
    MirrorTransition,
    ReflectionClass,
)


@pytest.mark.parametrize(
    ("relation", "successor"),
    (
        (DemandLineageRelation.PERSISTS, "d0"),
        (DemandLineageRelation.REFINES, "d1"),
        (DemandLineageRelation.SUPERSEDES, "d1"),
        (DemandLineageRelation.RESOLVES, None),
        (DemandLineageRelation.UNRELATED, "d1"),
    ),
)
def test_valid_demand_lineage_identity_semantics(relation: DemandLineageRelation, successor: str | None) -> None:
    lineage = DemandLineage("d0", successor, relation, ("evidence-1",), "reflection-1")

    assert lineage.predecessor_demand_id == "d0"
    assert lineage.successor_demand_id == successor


@pytest.mark.parametrize(
    ("relation", "successor"),
    (
        (DemandLineageRelation.PERSISTS, "d1"),
        (DemandLineageRelation.PERSISTS, None),
        (DemandLineageRelation.REFINES, "d0"),
        (DemandLineageRelation.REFINES, None),
        (DemandLineageRelation.SUPERSEDES, "d0"),
        (DemandLineageRelation.SUPERSEDES, None),
        (DemandLineageRelation.RESOLVES, "d0"),
        (DemandLineageRelation.RESOLVES, "d1"),
        (DemandLineageRelation.UNRELATED, "d0"),
        (DemandLineageRelation.UNRELATED, None),
    ),
)
def test_invalid_demand_lineage_identity_semantics(relation: DemandLineageRelation, successor: str | None) -> None:
    with pytest.raises(ValueError):
        DemandLineage("d0", successor, relation, ("evidence-1",), "reflection-1")


@pytest.mark.parametrize("value", ("", " "))
def test_demand_lineage_identifiers_must_be_nonempty(value: str) -> None:
    with pytest.raises(ValueError):
        DemandLineage(value, value, DemandLineageRelation.PERSISTS, ("evidence-1",), "reflection-1")
    with pytest.raises(ValueError):
        DemandLineage("d0", "d0", DemandLineageRelation.PERSISTS, ("evidence-1",), value)
    with pytest.raises(ValueError):
        DemandLineage("d0", value, DemandLineageRelation.REFINES, ("evidence-1",), "reflection-1")


@pytest.mark.parametrize("evidence_ids", ((), ("",), (" ",), ("evidence-1", "")))
def test_demand_lineage_evidence_ids_must_be_nonempty(evidence_ids: tuple[str, ...]) -> None:
    with pytest.raises(ValueError):
        DemandLineage("d0", "d0", DemandLineageRelation.PERSISTS, evidence_ids, "reflection-1")


def test_demand_lineage_is_immutable() -> None:
    lineage = DemandLineage("d0", "d1", DemandLineageRelation.REFINES, ("evidence-1",), "reflection-1")

    with pytest.raises(FrozenInstanceError):
        lineage.successor_demand_id = "d2"


def make_evidence(evidence_ids: tuple[str, ...] = ("evidence-1",)) -> EvidenceSummary:
    return EvidenceSummary(evidence_ids, ("node-source",), ("signal",), 0.9, 0.9, 0.9, 0.9)


def make_demand(demand_id: str) -> DemandSignal:
    return DemandSignal(
        demand_id,
        (DemandComponent("signal", 1.0, 0.1, 1.0),),
        0.5,
        0.5,
        0.5,
        DemandPolarity.ATTRACT,
        ("evidence-1",),
    )


def make_mirror_output(
    *,
    reflection_id: str,
    evidence: EvidenceSummary | None = None,
    demand: DemandSignal | None = None,
    demand_lineage: DemandLineage | None = None,
    transition: MirrorTransition = MirrorTransition.NONE,
    classification: ReflectionClass = ReflectionClass.COMPATIBLE,
    unresolved: bool = True,
) -> MirrorOutput:
    return MirrorOutput(
        reflection_id,
        "node-a",
        1,
        MirrorState.SEEKING,
        MirrorState.COHERENT if transition is MirrorTransition.RESOLUTION_ACHIEVED else MirrorState.SEEKING,
        transition,
        classification,
        evidence or make_evidence(),
        DiscrepancyVector(
            (DiscrepancyComponent("signal", 1.0, 0.5, 0.5, 0.9),),
            0.5,
            DiscrepancyDirection.DEFICIT,
            0.9,
        ),
        demand,
        0.5,
        0.1 if transition is MirrorTransition.RESOLUTION_ACHIEVED else 0.0,
        0.0,
        0.0,
        0.9,
        None,
        unresolved,
        1,
        demand_lineage,
    )


@pytest.mark.parametrize(
    ("relation", "predecessor", "successor"),
    (
        (DemandLineageRelation.PERSISTS, "d0", "d0"),
        (DemandLineageRelation.REFINES, "d0", "d1"),
        (DemandLineageRelation.SUPERSEDES, "d0", "d1"),
        (DemandLineageRelation.UNRELATED, "d0", "d1"),
    ),
)
def test_mirror_output_accepts_valid_active_lineage(
    relation: DemandLineageRelation,
    predecessor: str,
    successor: str,
) -> None:
    output = make_mirror_output(
        reflection_id="reflection-2",
        demand=make_demand(successor),
        demand_lineage=DemandLineage(
            predecessor, successor, relation, ("evidence-1",), "reflection-2"
        ),
    )

    assert output.demand_lineage is not None
    assert output.demand_lineage.relation is relation


def test_mirror_output_accepts_valid_resolves_lineage() -> None:
    output = make_mirror_output(
        reflection_id="reflection-2",
        transition=MirrorTransition.RESOLUTION_ACHIEVED,
        classification=ReflectionClass.RESOLVING,
        demand=None,
        unresolved=False,
        demand_lineage=DemandLineage(
            "d0", None, DemandLineageRelation.RESOLVES, ("evidence-1",), "reflection-2"
        ),
    )

    assert output.demand_lineage is not None
    assert output.demand_lineage.relation is DemandLineageRelation.RESOLVES


@pytest.mark.parametrize(
    "lineage",
    (
        DemandLineage("d0", "d0", DemandLineageRelation.PERSISTS, ("evidence-1",), "reflection-wrong"),
        DemandLineage("d0", "d0", DemandLineageRelation.PERSISTS, ("evidence-missing",), "reflection-2"),
        DemandLineage("d0", "d1", DemandLineageRelation.REFINES, ("evidence-1",), "reflection-2"),
    ),
)
def test_mirror_output_rejects_mismatched_lineage(lineage: DemandLineage) -> None:
    with pytest.raises(ValueError):
        make_mirror_output(
            reflection_id="reflection-2",
            demand=make_demand("d0"),
            demand_lineage=lineage,
        )


@pytest.mark.parametrize(
    ("relation", "successor"),
    (
        (DemandLineageRelation.PERSISTS, "d0"),
        (DemandLineageRelation.REFINES, "d1"),
        (DemandLineageRelation.SUPERSEDES, "d1"),
        (DemandLineageRelation.UNRELATED, "d1"),
    ),
)
def test_mirror_output_rejects_active_lineage_without_demand(
    relation: DemandLineageRelation, successor: str
) -> None:
    with pytest.raises(ValueError):
        make_mirror_output(
            reflection_id="reflection-2",
            demand=None,
            demand_lineage=DemandLineage("d0", successor, relation, ("evidence-1",), "reflection-2"),
        )


def test_mirror_output_rejects_resolves_with_active_demand() -> None:
    with pytest.raises(ValueError):
        make_mirror_output(
            reflection_id="reflection-2",
            demand=make_demand("d1"),
            demand_lineage=DemandLineage(
                "d0", None, DemandLineageRelation.RESOLVES, ("evidence-1",), "reflection-2"
            ),
        )


def test_resolution_transition_rejects_non_resolving_lineage() -> None:
    with pytest.raises(ValueError):
        make_mirror_output(
            reflection_id="reflection-2",
            transition=MirrorTransition.RESOLUTION_ACHIEVED,
            classification=ReflectionClass.RESOLVING,
            demand=make_demand("d1"),
            unresolved=True,
            demand_lineage=DemandLineage(
                "d0", "d1", DemandLineageRelation.REFINES, ("evidence-1",), "reflection-2"
            ),
        )


def test_mirror_output_allows_no_lineage_during_schema_transition() -> None:
    output = make_mirror_output(reflection_id="reflection-1", demand=make_demand("d0"))

    assert output.demand_lineage is None
