"""Pressure-field primitives for Threshold node metabolism."""

from __future__ import annotations

from dataclasses import dataclass
from math import exp, isfinite
from typing import Literal, Sequence


OrbitState = Literal["collapse", "stable", "drift"]


def _finite_range(name: str, value: float, minimum: float, maximum: float) -> float:
    if not isfinite(value) or not minimum <= value <= maximum:
        raise ValueError(f"{name} must be a finite value in the range [{minimum}, {maximum}]")
    return value


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be a finite value greater than or equal to 0")
    return value


@dataclass(frozen=True)
class MetabolicState:
    """The normalized inputs to a node's pressure field.

    Demand is metabolic hunger. It recovers charge during a tick but never
    contributes force directly to a pressure calculation.
    """

    charge: float
    slit_openness: float
    resonance: float
    circuit_mirror_gain: float = 1.0
    target_charge: float = 1.0

    def __post_init__(self) -> None:
        _finite_range("charge", self.charge, 0.0, 1.0)
        _finite_range("slit_openness", self.slit_openness, 0.0, 1.0)
        _finite_range("resonance", self.resonance, 0.0, 1.0)
        _finite_range("circuit_mirror_gain", self.circuit_mirror_gain, 0.0, 1.0)
        _finite_range("target_charge", self.target_charge, 0.0, 1.0)


@dataclass(frozen=True)
class PressureReading:
    """The raw pressure components before orbit-specific scaling."""

    demand: float
    base_pressure: float
    total_pressure: float


@dataclass(frozen=True)
class SlitDynamics:
    """The slit-derived intake and resonance values for one node tick."""

    slit_openness: float
    intake: float
    resonance: float


@dataclass(frozen=True)
class MetabolicTick:
    """The observable metabolic transition from one node tick to the next."""

    demand: float
    recovered_state: MetabolicState
    next_demand: float
    pressure: PressureReading


@dataclass(frozen=True)
class ResonanceWave:
    """A directed, distance-decayed pressure wave between two nodes."""

    source_id: str
    target_id: str
    amplitude: float


@dataclass(frozen=True)
class OrbitThresholds:
    """The collapse and drift boundaries for one Fib orbit band."""

    drift: float
    collapse: float
    multiplier: float

    def __post_init__(self) -> None:
        _non_negative("collapse", self.collapse)
        _non_negative("drift", self.drift)
        _non_negative("multiplier", self.multiplier)
        if self.drift <= self.collapse:
            raise ValueError("drift threshold must be greater than collapse threshold")


@dataclass(frozen=True)
class OrbitPressure:
    """Pressure after an orbit's Fib-band multiplier and threshold evaluation."""

    effective_pressure: float
    state: OrbitState


@dataclass(frozen=True)
class OrbitMotion:
    """The radial and angular movement produced by one orbit update."""

    radial_delta: float
    angular_delta: float


def calculate_pressure(state: MetabolicState) -> PressureReading:
    """Calculate ``Q * S * (1 + R) * (1 + D)`` for a node.

    Demand follows ``D = alpha * max(0, Qtarget - Q)``. It only modulates
    pressure when charge is present; a fully discharged node has zero
    pressure regardless of its demand.
    """

    demand = state.circuit_mirror_gain * max(0.0, state.target_charge - state.charge)
    base_pressure = state.charge * state.slit_openness * (1.0 + state.resonance)
    total_pressure = base_pressure * (1.0 + demand)
    return PressureReading(
        demand=demand,
        base_pressure=base_pressure,
        total_pressure=total_pressure,
    )


def calculate_slit_dynamics(
    alignment: float,
    environmental_energy: float,
    neighbor_coupling: float,
    resonance_sensitivity: float,
    *,
    alignment_exponent: float = 2.0,
) -> SlitDynamics:
    """Calculate slit openness, intake, and resonance from alignment.

    The canonical slit law is ``S = A²``. Intake follows ``I = S * E`` and
    resonance follows ``R = rho * S * C``.
    """

    _finite_range("alignment", alignment, 0.0, 1.0)
    _finite_range("environmental_energy", environmental_energy, 0.0, 1.0)
    _finite_range("neighbor_coupling", neighbor_coupling, 0.0, 1.0)
    _finite_range("resonance_sensitivity", resonance_sensitivity, 0.0, 1.0)
    if not isfinite(alignment_exponent) or alignment_exponent <= 0.0:
        raise ValueError("alignment_exponent must be a finite value greater than 0")

    slit_openness = alignment**alignment_exponent
    intake = slit_openness * environmental_energy
    resonance = resonance_sensitivity * slit_openness * neighbor_coupling
    return SlitDynamics(
        slit_openness=slit_openness,
        intake=intake,
        resonance=resonance,
    )


def advance_metabolism(
    state: MetabolicState,
    recovery_coefficient: float,
    *,
    slit_openness: float | None = None,
    resonance: float | None = None,
    intake: float = 0.0,
    intake_efficiency: float = 0.0,
    spirit_charge: float = 0.0,
) -> MetabolicTick:
    """Advance one canonical recovery-pending metabolism tick.

    Demand and intake recover charge via
    ``Q(t+1) = Q(t) + gamma * D(t) + eta * I(t) + spirit_charge``. Callers
    provide slit, resonance, and intake after calculating their own dynamics.
    Recovered charge saturates at one because the engine represents charge as a
    normalized quantity. Pressure is then evaluated from that recovered state
    and its next-tick demand, preserving charge-before-force ordering.
    """

    _finite_range("recovery_coefficient", recovery_coefficient, 0.0, 1.0)
    _finite_range("intake", intake, 0.0, 1.0)
    _finite_range("intake_efficiency", intake_efficiency, 0.0, 1.0)
    _finite_range("spirit_charge", spirit_charge, 0.0, 1.0)
    next_slit = state.slit_openness if slit_openness is None else slit_openness
    next_resonance = state.resonance if resonance is None else resonance
    _finite_range("slit_openness", next_slit, 0.0, 1.0)
    _finite_range("resonance", next_resonance, 0.0, 1.0)

    demand = state.circuit_mirror_gain * max(0.0, state.target_charge - state.charge)
    recovered_state = MetabolicState(
        charge=min(
            1.0,
            state.charge
            + recovery_coefficient * demand
            + intake_efficiency * intake
            + spirit_charge,
        ),
        slit_openness=next_slit,
        resonance=next_resonance,
        circuit_mirror_gain=state.circuit_mirror_gain,
        target_charge=state.target_charge,
    )
    pressure = calculate_pressure(recovered_state)
    return MetabolicTick(
        demand=demand,
        recovered_state=recovered_state,
        next_demand=pressure.demand,
        pressure=pressure,
    )


def pressure_gradient(source: PressureReading, neighbor: PressureReading) -> float:
    """Return the signed pressure force from a node toward one neighbor."""

    return source.total_pressure - neighbor.total_pressure


def emit_resonance_wave(
    source_id: str,
    target_id: str,
    source: PressureReading,
    neighbor: PressureReading,
    source_resonance_field: float,
    wave_threshold: float,
    propagation_coefficient: float,
    distance: float,
    decay_constant: float,
) -> ResonanceWave | None:
    """Emit and propagate a wave when a pressure gradient exceeds its threshold.

    Emission follows ``kappa * ΔP * Rf(source)``. Propagation applies
    ``exp(-decay_constant * distance)`` to that amplitude.
    """

    if not source_id.strip() or not target_id.strip():
        raise ValueError("source_id and target_id must not be empty")
    _finite_range("source_resonance_field", source_resonance_field, 0.0, 1.0)
    _non_negative("wave_threshold", wave_threshold)
    _non_negative("propagation_coefficient", propagation_coefficient)
    _non_negative("distance", distance)
    _non_negative("decay_constant", decay_constant)

    gradient = pressure_gradient(source, neighbor)
    if abs(gradient) <= wave_threshold:
        return None
    amplitude = (
        propagation_coefficient
        * gradient
        * source_resonance_field
        * exp(-decay_constant * distance)
    )
    return ResonanceWave(
        source_id=source_id,
        target_id=target_id,
        amplitude=amplitude,
    )


def apply_resonance_wave(
    state: MetabolicState,
    wave: ResonanceWave,
    charge_coefficient: float,
    slit_coefficient: float,
) -> MetabolicState:
    """Apply a wave's charge and slit modulation to its target's state."""

    _non_negative("charge_coefficient", charge_coefficient)
    _non_negative("slit_coefficient", slit_coefficient)
    return MetabolicState(
        charge=min(1.0, max(0.0, state.charge + charge_coefficient * wave.amplitude)),
        slit_openness=min(
            1.0,
            max(0.0, state.slit_openness + slit_coefficient * wave.amplitude),
        ),
        resonance=state.resonance,
        circuit_mirror_gain=state.circuit_mirror_gain,
        target_charge=state.target_charge,
    )


def is_harmonic_cluster(waves: Sequence[ResonanceWave], tolerance: float) -> bool:
    """Return whether a non-empty group of waves shares near-equal amplitude."""

    _non_negative("tolerance", tolerance)
    if not waves:
        raise ValueError("waves must not be empty")
    amplitudes = [wave.amplitude for wave in waves]
    return max(amplitudes) - min(amplitudes) <= tolerance


def evaluate_orbit_pressure(
    reading: PressureReading, thresholds: OrbitThresholds
) -> OrbitPressure:
    """Apply a Fib-band multiplier and classify pressure against its thresholds."""

    effective_pressure = thresholds.multiplier * reading.total_pressure
    if effective_pressure > thresholds.drift:
        state: OrbitState = "drift"
    elif effective_pressure < thresholds.collapse:
        state = "collapse"
    else:
        state = "stable"
    return OrbitPressure(effective_pressure=effective_pressure, state=state)


def calculate_radial_motion(
    orbit_pressure: OrbitPressure,
    thresholds: OrbitThresholds,
    collapse_sensitivity: float,
    drift_sensitivity: float,
) -> float:
    """Map effective pressure to a signed radial orbit delta.

    Collapse follows ``-kc * (Tc - Peff)^2`` below the collapse threshold.
    Drift follows ``kd * sqrt(Peff - Td)`` above the drift threshold. The
    stable band is stationary in the radial dimension.
    """

    _non_negative("collapse_sensitivity", collapse_sensitivity)
    _non_negative("drift_sensitivity", drift_sensitivity)
    effective_pressure = orbit_pressure.effective_pressure
    if effective_pressure < thresholds.collapse:
        return -collapse_sensitivity * (thresholds.collapse - effective_pressure) ** 2
    if effective_pressure > thresholds.drift:
        return drift_sensitivity * (effective_pressure - thresholds.drift) ** 0.5
    return 0.0


def calculate_angular_motion(pressure_gradient: float, angular_sensitivity: float) -> float:
    """Map an angular pressure gradient to ``kθ * ∂P/∂θ``."""

    if not isfinite(pressure_gradient):
        raise ValueError("pressure_gradient must be finite")
    _non_negative("angular_sensitivity", angular_sensitivity)
    return angular_sensitivity * pressure_gradient


def calculate_orbit_motion(
    orbit_pressure: OrbitPressure,
    thresholds: OrbitThresholds,
    collapse_sensitivity: float,
    drift_sensitivity: float,
    angular_pressure_gradient: float = 0.0,
    angular_sensitivity: float = 0.0,
) -> OrbitMotion:
    """Calculate the signed radial and angular deltas for one orbit update."""

    return OrbitMotion(
        radial_delta=calculate_radial_motion(
            orbit_pressure,
            thresholds,
            collapse_sensitivity,
            drift_sensitivity,
        ),
        angular_delta=calculate_angular_motion(
            angular_pressure_gradient,
            angular_sensitivity,
        ),
    )
