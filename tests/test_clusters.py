import pytest

from engine.clusters import (
    CaptureTolerances,
    ClusterProfile,
    NodeOrbitProfile,
    bind_to_cluster,
    calculate_cluster_cohesion,
    can_merge_clusters,
    is_cluster_capturable,
)


def _cluster() -> ClusterProfile:
    return ClusterProfile(
        cluster_id="cluster",
        pressure=0.7,
        wave_amplitude=0.2,
        slit_openness=0.6,
        orbit_radius=13.0,
    )


def _tolerances() -> CaptureTolerances:
    return CaptureTolerances(
        pressure=0.1,
        wave_amplitude=0.1,
        radial_velocity=0.05,
        slit_openness=0.1,
    )


def test_cluster_capture_requires_all_four_alignment_locks() -> None:
    capturable = NodeOrbitProfile(
        node_id="node",
        pressure=0.75,
        wave_amplitude=0.25,
        radial_velocity=0.04,
        slit_openness=0.65,
        orbit_radius=12.0,
        demand=0.5,
    )
    mismatched_slit = NodeOrbitProfile(
        node_id="node",
        pressure=0.75,
        wave_amplitude=0.25,
        radial_velocity=0.04,
        slit_openness=0.8,
        orbit_radius=12.0,
        demand=0.5,
    )

    assert is_cluster_capturable(capturable, _cluster(), _tolerances())
    assert not is_cluster_capturable(mismatched_slit, _cluster(), _tolerances())


def test_cluster_binding_snaps_orbit_signature_and_suppresses_demand() -> None:
    bound = bind_to_cluster(
        NodeOrbitProfile(
            node_id="node",
            pressure=0.75,
            wave_amplitude=0.25,
            radial_velocity=0.04,
            slit_openness=0.65,
            orbit_radius=12.0,
            demand=0.5,
        ),
        _cluster(),
    )

    assert bound.pressure == 0.7
    assert bound.wave_amplitude == 0.2
    assert bound.radial_velocity == 0.0
    assert bound.slit_openness == 0.6
    assert bound.orbit_radius == 13.0
    assert bound.demand == 0.0


def test_cluster_cohesion_is_total_member_pressure() -> None:
    members = [
        NodeOrbitProfile("a", 0.2, 0.0, 0.0, 0.5, 1.0, 0.0),
        NodeOrbitProfile("b", 0.4, 0.0, 0.0, 0.5, 1.0, 0.0),
    ]

    assert calculate_cluster_cohesion(members) == pytest.approx(0.6)


def test_clusters_merge_only_when_pressure_and_waves_align() -> None:
    aligned = ClusterProfile("aligned", 0.75, 0.25, 0.4, 8.0)
    mismatch = ClusterProfile("mismatch", 0.75, 0.5, 0.4, 8.0)

    assert can_merge_clusters(_cluster(), aligned, 0.1, 0.1)
    assert not can_merge_clusters(_cluster(), mismatch, 0.1, 0.1)
