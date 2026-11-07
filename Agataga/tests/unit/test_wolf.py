from __future__ import annotations

import unittest

from core.wolf import (
    ReliabilityEntity,
    ReliabilityState,
    TransactionOutcome,
    calculate_r_score,
    quarantine,
    reinstate,
)


class TestWolfReliability(unittest.TestCase):
    def test_binary_state_is_the_transaction_gate(self) -> None:
        quarantined = ReliabilityEntity("helper-1", ReliabilityState.QUARANTINED, 0.95)
        active = ReliabilityEntity("helper-2", ReliabilityState.ACTIVE, 0.0)

        self.assertFalse(quarantined.can_transact)
        self.assertTrue(active.can_transact)

    def test_rejects_non_binary_state_and_invalid_score(self) -> None:
        with self.assertRaisesRegex(ValueError, "ReliabilityState"):
            ReliabilityEntity("helper-1", 2)  # type: ignore[arg-type]
        with self.assertRaisesRegex(ValueError, "r_score"):
            ReliabilityEntity("helper-1", ReliabilityState.ACTIVE, float("nan"))

    def test_recent_outcomes_have_threefold_weight(self) -> None:
        score = calculate_r_score(
            (
                TransactionOutcome(cycle=20, succeeded=True),
                TransactionOutcome(cycle=9, succeeded=False),
            ),
            current_cycle=40,
        )

        self.assertEqual(score, 0.75)

    def test_all_successes_and_failures_reach_score_bounds(self) -> None:
        all_success = calculate_r_score(
            (TransactionOutcome(1, True), TransactionOutcome(2, True)),
            current_cycle=2,
        )
        all_failure = calculate_r_score(
            (TransactionOutcome(1, False), TransactionOutcome(2, False)),
            current_cycle=2,
        )

        self.assertEqual(all_success, 1.0)
        self.assertEqual(all_failure, 0.0)

    def test_score_rejects_empty_or_future_outcomes(self) -> None:
        with self.assertRaisesRegex(ValueError, "undefined"):
            calculate_r_score((), current_cycle=0)
        with self.assertRaisesRegex(ValueError, "later than"):
            calculate_r_score((TransactionOutcome(2, True),), current_cycle=1)

    def test_reinstatement_requires_quarantine_and_completed_protocol(self) -> None:
        active = ReliabilityEntity("helper-1", ReliabilityState.ACTIVE)
        quarantined = quarantine(active)

        with self.assertRaisesRegex(ValueError, "must be complete"):
            reinstate(quarantined, recovery_protocol_complete=False)
        with self.assertRaisesRegex(ValueError, "only a quarantined"):
            reinstate(active, recovery_protocol_complete=True)

        restored = reinstate(quarantined, recovery_protocol_complete=True)
        self.assertTrue(restored.can_transact)


if __name__ == "__main__":
    unittest.main()
