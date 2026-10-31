from engine.errors import *
def test_no_vote_is_not_an_error():
 d=EvaluationDiagnostics(no_votes=(NoVote(NoVoteReason.INSUFFICIENT_EVIDENCE,ThresholdLayer.MIRROR,1),),authoritative=False)
 assert not d.errors and d.no_votes
def test_topology_invariant_failure_aborts_transaction():
 e=error_for("e",ErrorCode.TOPOLOGY_TRANSACTION_INVARIANT_FAILED,ThresholdLayer.TOPOLOGY,1)
 assert e.disposition is ErrorDisposition.ABORT_TRANSACTION
def test_backward_causality_halts_world():
 e=error_for("e",ErrorCode.AUTHORITY_BACKWARD_CAUSAL_MUTATION,ThresholdLayer.TOPOLOGY,1)
 assert e.severity is ErrorSeverity.FATAL and e.disposition is ErrorDisposition.HALT_WORLD
