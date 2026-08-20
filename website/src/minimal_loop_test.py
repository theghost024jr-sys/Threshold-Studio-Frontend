from threshold.core.identity_vector import IdentityVector, IdentityVectorState
from threshold.core.vector_registry import VectorRegistry
from threshold.flower.geometry import FlowerGeometry
from threshold.core.update_loop import UpdateLoop


def on_tick(vec):
    print(vec.to_dict())


if __name__ == "__main__":
    state = IdentityVectorState(
        direction=0.0,
        magnitude=1.0,
        coherence=1.0,
        stability=1.0,
        contribution=0.2,
        resonance_sensitivity=0.5,
        drift_susceptibility=0.3,
    )

    vec = IdentityVector(state)
    flower = FlowerGeometry(node_count=144)
    registry = VectorRegistry()
    registry.add(vec)

    loop = UpdateLoop(
        vector=vec,
        flower=flower,
        registry=registry,
        tick_rate=5.0,
        on_tick=on_tick,
    )
    loop.start(duration=3.0)
