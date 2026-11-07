"""Shared immutable failure and no-vote contracts for the Threshold pipeline."""
from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Mapping

class ThresholdLayer(str,Enum):
    MIRROR="mirror"; PRESSURE="pressure"; FORCE="force"; PHYSICS="physics"; STRUCTURE="structure"; TOPOLOGY="topology"; SYSTEM="system"
class ErrorFamily(str,Enum):
    NO_VOTE="no_vote"; INPUT="input"; EVIDENCE="evidence"; STATE="state"; CONTRACT="contract"; SEQUENCE="sequence"; NUMERIC="numeric"; PRESSURE="pressure"; FORCE="force"; PHYSICS="physics"; STRUCTURE="structure"; TOPOLOGY="topology"; AUTHORITY="authority"; CONSISTENCY="consistency"; SYSTEM="system"
class ErrorSeverity(str,Enum): INFO="info"; RECOVERABLE="recoverable"; BLOCKING="blocking"; FATAL="fatal"
class ErrorDisposition(str,Enum): CONTINUE="continue"; DEFER="defer"; REJECT="reject"; ABORT_EVALUATION="abort_evaluation"; ABORT_TRANSACTION="abort_transaction"; HALT_WORLD="halt_world"
class ErrorCode(str,Enum):
    INSUFFICIENT_EVIDENCE="insufficient_evidence"; NO_FIELD_TARGET="no_field_target"; INPUT_INVALID_RANGE="input_invalid_range"; STATE_NODE_MISMATCH="state_node_mismatch"; CONTRACT_OUTPUT_INVALID="contract_output_invalid"; CONTRACT_AUTHORITY_LEAK="contract_authority_leak"; SEQUENCE_STALE="sequence_stale"; VERSION_MISMATCH="version_mismatch"; NUMERIC_ZERO_LENGTH_DIRECTION="numeric_zero_length_direction"; PRESSURE_ILLEGAL_CANCELLATION="pressure_illegal_cancellation"; FORCE_INVENTED_TARGET="force_invented_target"; FORCE_INVALID_DIRECTION="force_invalid_direction"; PHYSICS_MISSING_CURRENT_FORCE="physics_missing_current_force"; PHYSICS_INVALID_MASS="physics_invalid_mass"; PHYSICS_TELEPORTATION="physics_teleportation"; STRUCTURE_MISSING_PHYSICS_RESULT="structure_missing_physics_result"; STRUCTURE_FAKE_PERSISTENCE="structure_fake_persistence"; TOPOLOGY_TRANSACTION_STALE="topology_transaction_stale"; TOPOLOGY_TRANSACTION_INVARIANT_FAILED="topology_transaction_invariant_failed"; AUTHORITY_HISTORY_REWRITE="authority_history_rewrite"; AUTHORITY_BACKWARD_CAUSAL_MUTATION="authority_backward_causal_mutation"; CONSISTENCY_PARTIAL_TRANSACTION="consistency_partial_transaction"; CONSISTENCY_CONTRADICTORY_AUTHORITY="consistency_contradictory_authority"; CONSISTENCY_IMPOSSIBLE_STATE="consistency_impossible_state"; SYSTEM_STORAGE_FAILURE="system_storage_failure"; SYSTEM_REPLAY_DIVERGENCE="system_replay_divergence"
class NoVoteReason(str,Enum):
    INSUFFICIENT_EVIDENCE="insufficient_evidence"; INCOMPARABLE_EVIDENCE="incomparable_evidence"; STALE_EVIDENCE="stale_evidence"; DEGRADED_EVIDENCE="degraded_evidence"; NO_FIELD_TARGET="no_field_target"; NO_VALID_DIRECTION="no_valid_direction"; COMPETING_EXPLANATIONS="competing_explanations"; INSUFFICIENT_PERSISTENCE="insufficient_persistence"; TOPOLOGY_DECISION_DEFERRED="topology_decision_deferred"
@dataclass(frozen=True,slots=True)
class ThresholdError:
    error_id:str; code:ErrorCode; layer:ThresholdLayer; severity:ErrorSeverity; disposition:ErrorDisposition; world_tick:int; node_id:str|None=None; relationship_id:str|None=None; flower_id:str|None=None; source_sequence:int|None=None; topology_version:int|None=None; message:str=""; details:Mapping[str,str|int|float|bool]=field(default_factory=dict); caused_by:tuple[str,...]=(); family:ErrorFamily|None=None
    def __post_init__(self)->None:
        if not self.error_id.strip() or self.world_tick<0: raise ValueError("error_id must be non-empty and world_tick non-negative")
@dataclass(frozen=True,slots=True)
class NoVote:
    reason:NoVoteReason; layer:ThresholdLayer; world_tick:int; node_id:str|None=None; message:str=""
@dataclass(frozen=True,slots=True)
class DiagnosticWarning:
    code:str; message:str; world_tick:int
@dataclass(frozen=True,slots=True)
class EvaluationDiagnostics:
    errors:tuple[ThresholdError,...]=(); no_votes:tuple[NoVote,...]=(); warnings:tuple[DiagnosticWarning,...]=(); complete:bool=True; authoritative:bool=False

DEFAULT_HANDLING:Mapping[ErrorCode,tuple[ErrorSeverity,ErrorDisposition]]={
 ErrorCode.INPUT_INVALID_RANGE:(ErrorSeverity.RECOVERABLE,ErrorDisposition.REJECT),
 ErrorCode.CONTRACT_AUTHORITY_LEAK:(ErrorSeverity.BLOCKING,ErrorDisposition.ABORT_EVALUATION),
 ErrorCode.SEQUENCE_STALE:(ErrorSeverity.RECOVERABLE,ErrorDisposition.REJECT),
 ErrorCode.NUMERIC_ZERO_LENGTH_DIRECTION:(ErrorSeverity.RECOVERABLE,ErrorDisposition.ABORT_EVALUATION),
 ErrorCode.PRESSURE_ILLEGAL_CANCELLATION:(ErrorSeverity.BLOCKING,ErrorDisposition.ABORT_EVALUATION),
 ErrorCode.FORCE_INVENTED_TARGET:(ErrorSeverity.BLOCKING,ErrorDisposition.ABORT_EVALUATION),
 ErrorCode.PHYSICS_TELEPORTATION:(ErrorSeverity.BLOCKING,ErrorDisposition.ABORT_EVALUATION),
 ErrorCode.STRUCTURE_FAKE_PERSISTENCE:(ErrorSeverity.RECOVERABLE,ErrorDisposition.REJECT),
 ErrorCode.TOPOLOGY_TRANSACTION_INVARIANT_FAILED:(ErrorSeverity.BLOCKING,ErrorDisposition.ABORT_TRANSACTION),
 ErrorCode.AUTHORITY_BACKWARD_CAUSAL_MUTATION:(ErrorSeverity.FATAL,ErrorDisposition.HALT_WORLD),
 ErrorCode.CONSISTENCY_IMPOSSIBLE_STATE:(ErrorSeverity.FATAL,ErrorDisposition.HALT_WORLD),
 ErrorCode.SYSTEM_REPLAY_DIVERGENCE:(ErrorSeverity.FATAL,ErrorDisposition.HALT_WORLD),
 ErrorCode.SYSTEM_STORAGE_FAILURE:(ErrorSeverity.RECOVERABLE,ErrorDisposition.ABORT_EVALUATION),
}
def error_family(code:ErrorCode)->ErrorFamily:
    prefix=code.value.split("_",1)[0]
    return {"input":ErrorFamily.INPUT,"state":ErrorFamily.STATE,"contract":ErrorFamily.CONTRACT,"sequence":ErrorFamily.SEQUENCE,"version":ErrorFamily.SEQUENCE,"numeric":ErrorFamily.NUMERIC,"pressure":ErrorFamily.PRESSURE,"force":ErrorFamily.FORCE,"physics":ErrorFamily.PHYSICS,"structure":ErrorFamily.STRUCTURE,"topology":ErrorFamily.TOPOLOGY,"authority":ErrorFamily.AUTHORITY,"consistency":ErrorFamily.CONSISTENCY,"system":ErrorFamily.SYSTEM,"insufficient":ErrorFamily.NO_VOTE,"no":ErrorFamily.NO_VOTE}.get(prefix,ErrorFamily.SYSTEM)
def error_for(error_id:str,code:ErrorCode,layer:ThresholdLayer,world_tick:int,**details:object)->ThresholdError:
 severity,disposition=DEFAULT_HANDLING[code]
 return ThresholdError(error_id,code,layer,severity,disposition,world_tick,details={k:str(v) for k,v in details.items()},family=error_family(code))
