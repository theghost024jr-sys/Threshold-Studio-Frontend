# threshold/examples/minimal_vector_sim.py

from threshold.core.identity_vector import IdentityVector, IdentityVectorState


def run_sim():
    print("=== Threshold: Minimal Identity Vector Simulation ===")

    # 1. Create initial vector state
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

    print("\nInitial State:")
    print(vec.to_dict())

    # 2. Apply some forces
    print("\nApplying pressure = 0.4")
    vec.apply_pressure(0.4)
    print(vec.to_dict())

    print("\nApplying drift = 0.2")
    vec.apply_drift(0.2)
    print(vec.to_dict())

    print("\nApplying resonance = 0.3")
    vec.apply_resonance(0.3)
    print(vec.to_dict())

    # 3. Check collapse
    collapsed = vec.check_collapse()
    print("\nCollapsed:", collapsed)

    print("\n=== Simulation Complete ===")


if __name__ == "__main__":
    run_sim()
