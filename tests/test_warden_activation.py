from engine.agataga import AgatagaSense
from engine.boundary_elevation import BoundaryElevationConfig
from engine.coherence_recovery import CoherenceRecovery
from engine.warden import IdentityField
from engine.warden_activation import (
    WardenActivationConfig,
    WardenMetadata,
    WardenPhenomena,
    WardenPlayerState,
    WardenWorldstate,
    build_warden_activation,
)


def _elevation_config() -> BoundaryElevationConfig:
    return BoundaryElevationConfig(
        alignment_threshold=0.5,
        agataga_threshold=0.5,
        shimmer_threshold=0.5,
        coherence_recovery_threshold=0.5,
        saturation_score=1.5,
        departure_decay=0.25,
        collapse_immunity_coefficient=1.0,
        corridor_shaping_coefficient=1.0,
        basin_stabilization_coefficient=1.0,
        identity_amplification_coefficient=1.0,
        memory_imprint_coefficient=1.0,
        weather_modulation_coefficient=1.0,
        density_resistance_coefficient=1.0,
    )


def _worldstate(*, density: float = 0.75, shimmer_level: float = 0.75) -> WardenWorldstate:
    return WardenWorldstate(
        weather_phase="Tension",
        drift=(1.0, -1.0, 0.0),
        pressure=2.0,
        resonance=(0.2, 0.3),
        density=density,
        shimmer_level=shimmer_level,
    )


def _activation():
    return build_warden_activation(
        zone_id="survival-frontier",
        flower_id="survival",
        worldstate=_worldstate(),
        metadata=WardenMetadata("Stonekin", "Earth", "Boundary", "vigilance"),
        phenomena=WardenPhenomena("wind shear", "standing stones", None),
        stimulus_vector=(0.0, 1.0, 0.0),
        warden_identity="survivor",
        warden_field=IdentityField(1.0, 0.0, 0.0, 0.0, 0.0),
        player=WardenPlayerState(
            stance="navigator",
            identity_field=IdentityField(1.0, 0.0, 0.0, 0.0, 0.0),
            agataga_sense=AgatagaSense(0.75),
            is_in_zone=True,
        ),
        coherence_recovery=CoherenceRecovery(0.75, 0.75, 0.75, 0.75, 0.75, 0.75),
        activation_config=WardenActivationConfig(
            density_threshold=0.5,
            shimmer_threshold=0.5,
        ),
        elevation_config=_elevation_config(),
    )


def test_warden_activation_emits_only_after_world_gates_and_resolves_player_state() -> None:
    activation = _activation()

    assert activation is not None
    assert activation.metadata.species == "Stonekin"
    assert activation.player_response.interference_mode == "conflict"
    assert activation.player_response.navigation_effect == "collapse_flow_turbulence"
    assert activation.boundary_elevation.active is True


def test_warden_activation_does_not_emit_when_density_or_shimmer_is_at_threshold() -> None:
    for worldstate in (_worldstate(density=0.5), _worldstate(shimmer_level=0.5)):
        activation = build_warden_activation(
            zone_id="survival-frontier",
            flower_id=None,
            worldstate=worldstate,
            metadata=WardenMetadata("Stonekin", "Earth", "Boundary", "vigilance"),
            phenomena=WardenPhenomena(None, None, None),
            stimulus_vector=(0.0, 1.0, 0.0),
            warden_identity="survivor",
            warden_field=IdentityField(1.0, 0.0, 0.0, 0.0, 0.0),
            player=WardenPlayerState(
                stance="navigator",
                identity_field=IdentityField(1.0, 0.0, 0.0, 0.0, 0.0),
                agataga_sense=AgatagaSense(0.75),
                is_in_zone=True,
            ),
            coherence_recovery=CoherenceRecovery(
                0.75, 0.75, 0.75, 0.75, 0.75, 0.75
            ),
            activation_config=WardenActivationConfig(
                density_threshold=0.5,
                shimmer_threshold=0.5,
            ),
            elevation_config=_elevation_config(),
        )

        assert activation is None


def test_active_refusal_blocks_elevation_and_returns_refusal_response() -> None:
    activation = build_warden_activation(
        zone_id="survival-frontier",
        flower_id="survival",
        worldstate=_worldstate(),
        metadata=WardenMetadata("Stonekin", "Earth", "Boundary", "vigilance"),
        phenomena=WardenPhenomena(None, None, None),
        stimulus_vector=(0.0, 1.0, 0.0),
        warden_identity="survivor",
        warden_field=IdentityField(1.0, 0.0, 0.0, 0.0, 0.0),
        player=WardenPlayerState(
            stance="navigator",
            identity_field=IdentityField(1.0, 0.0, 0.0, 0.0, 0.0),
            agataga_sense=AgatagaSense(1.0),
            is_in_zone=True,
            refusal_active=True,
        ),
        coherence_recovery=CoherenceRecovery(0.75, 0.75, 0.75, 0.75, 0.75, 0.75),
        activation_config=WardenActivationConfig(
            density_threshold=0.5,
            shimmer_threshold=0.5,
        ),
        elevation_config=_elevation_config(),
    )

    assert activation is not None
    assert activation.player_response.interference_mode == "refusal"
    assert activation.boundary_elevation.active is False
    assert activation.boundary_elevation.player_refusing is True
