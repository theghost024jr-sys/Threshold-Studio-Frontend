# Agataga Architecture Decision Register

**Status:** Phase 1 decisions approved; Phase 2 runtime work may proceed  
**Basis:** The 15 questions in `Agataga System Architecture Document.docx`, plus the current Threshold repository facts checked on 2026-10-06.  
**Approval record:** James's instruction “proceed” on 2026-10-06 is interpreted as approval of each proposed path below as written. The original Word documents remain unchanged; this register records the approved answers.

The architecture source labels its 15 questions as requiring James's answers. The options and recommendations below were prepared for review; the instruction above closes the gates without silently changing their recorded scope.

## Decision 1 — Database backend

**Problem Statement**  
Agataga needs durable relational records for entities, roles, needs, transactions, balances, and append-only history. The backend determines transaction isolation, migration behavior, concurrency, and deployment requirements.

**Options**
- SQLite for all environments.
- PostgreSQL for all environments.
- SQLite for local development and tests; PostgreSQL for shared/production deployments.

**Consequences**  
SQLite minimizes setup but has weaker multi-writer concurrency and can conceal production-only behavior. PostgreSQL adds deployment and operations work but is suited to concurrent transactions and constraints. A two-backend plan requires testing both and keeping migrations portable.

**Chosen Path (proposed)**  
Use SQLite for isolated local development and tests, and PostgreSQL for shared or production operation. Keep database access behind the Agataga persistence boundary.

**Rationale**  
This balances low-friction development with the transactional and audit requirements of the proposed ledger and matching system.

**Impact on other domains**  
Constrains Decision 2 (ORM/migrations), Decisions 7–9 (append-only register and atomic ledger/escrow behavior), deployment configuration, backup, and integration-test design.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”).

## Decision 2 — ORM and migration ownership

**Problem Statement**  
The architecture names SQLAlchemy and Alembic but asks whether Threshold already uses them or Agataga would introduce them. The checked [Threshold requirements](../../requirements.txt) list FastAPI, httpx, and Uvicorn; no SQLAlchemy dependency or existing ORM use was found in the searched Python source.

**Options**
- Add SQLAlchemy and Alembic to Threshold’s shared environment.
- Keep Agataga persistence isolated and add SQLAlchemy/Alembic only to Agataga’s dependency set.
- Use a standard-library or hand-written SQL layer.

**Consequences**  
Shared dependencies simplify one runtime but couple Threshold to Agataga’s storage choices. An isolated dependency boundary reduces coupling but requires compatible packaging and migration invocation. Hand-written SQL avoids an ORM dependency but increases schema and query maintenance.

**Chosen Path (proposed)**  
If Decision 1 is approved, use SQLAlchemy/Alembic within the Agataga project boundary; do not add them to Threshold’s shared requirements until the integration and deployment owner approves that dependency change.

**Rationale**  
The current Threshold dependency manifest contains no ORM. Isolation respects that fact while following the architecture draft’s target stack.

**Impact on other domains**  
Depends on Decision 1 and affects `db/models.py`, migrations, test fixtures, runtime packaging, and Threshold integration.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”).

## Decision 3 — Definition of an Agataga cycle

**Problem Statement**  
R-Score recency, queue review, maintenance, and recovery refer to cycles, while the architecture proposes a Threshold tick hook. The current [Graph.tick](../../engine/graph.py) increments a sequence and returns a snapshot; the [FastAPI `/tick` route](../../engine/api.py) invokes it on request. Treating arbitrary polling as economic time could let request frequency change system behavior.

**Options**
- One Agataga cycle for every call to Threshold `Graph.tick()`.
- An Agataga-owned scheduler and independent cycle counter.
- One cycle per authoritative Threshold world transition, consumed through a stable integration contract; API polling alone does not advance Agataga.

**Consequences**  
Directly binding cycles to a request-backed tick is simple but risks time manipulation by polling. An independent scheduler decouples Agataga but creates two clocks. An authoritative transition contract avoids poll-driven advancement but requires Threshold to expose a trustworthy trigger.

**Chosen Path (proposed)**  
Define a cycle as one authoritative Threshold world transition delivered to Agataga. Do not equate an arbitrary `/tick` HTTP request with an Agataga cycle unless Threshold explicitly guarantees that route is the authoritative simulation clock.

**Rationale**  
The current code exposes a sequence-bearing snapshot, not a documented event-bus or scheduler contract. The Agataga clock must not be advanced by incidental reads.

**Impact on other domains**  
Blocks the R-Score decay mapping in Decision 13, cycle-relative recovery and queue logic, scheduling, idempotency, and Threshold integration.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”).

## Decision 4 — Person-to-entity cardinality

**Problem Statement**  
The architecture permits an entity to hold multiple roles but does not define whether one real person may control multiple entities. This affects role conflicts, identity, abuse resistance, privacy, and household or organizational use.

**Options**
- One person maps to exactly one entity.
- One person may create multiple entities.
- One personal entity, with separate organization or delegated entities under explicit relationships.

**Consequences**  
One-to-one simplifies trust history and reduces duplicate-account gaming but can poorly represent shared or organizational needs. Multiple entities improve flexibility but permit identity fragmentation unless verification and linking rules exist. A delegated model is expressive but adds authorization complexity.

**Chosen Path (proposed)**  
For v1, use one personal entity per verified person; allow multiple roles on that entity. Treat organizations and delegated accounts as a separate, explicitly modeled entity type rather than extra personal accounts.

**Rationale**  
It is the smallest model consistent with the architecture’s multi-role rule while limiting reputation fragmentation.

**Impact on other domains**  
Affects identity verification, roles, transaction conflict checks, trust aggregation, privacy, institutional accounts, and future inter-node migration.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”).

## Decision 5 — Maximum concurrent transactions per Helper

**Problem Statement**  
The matcher needs a concurrency ceiling so one Helper is not assigned more active Needs than they can fulfill. The architecture gives 3 only as an example, not as a committed value.

**Options**
- One active transaction at a time.
- A fixed v1 limit (for example, 3).
- A configurable limit by Helper, capability, or need complexity.

**Consequences**  
A low fixed limit protects follow-through but can constrain supply. A high limit increases capacity while raising collapse risk. Per-entity configuration is flexible but requires trustworthy availability declarations and additional matching rules.

**Chosen Path (proposed)**  
Start with a system-wide limit of 3 active transactions per Helper, enforced atomically; make it a named configuration value rather than a user-editable field.

**Rationale**  
The architecture itself uses 3 as its example. A single enforced v1 value is simpler to test than individualized limits.

**Impact on other domains**  
Changes CME filtering/ranking, transaction lifecycle, capability availability, community supply metrics, and the calibration of collapse rates.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”).

## Decision 6 — Maximum match results per Need

**Problem Statement**  
The CME needs a bounded result set for a clear Seeker experience and predictable query cost. The architecture defines `MAX_MATCH_RESULTS` but no value.

**Options**
- Return every qualified Helper.
- Return a fixed small top-N list.
- Return a paginated list with a fixed initial page size and maximum.

**Consequences**  
Returning every result can overwhelm users and expose unnecessary profile data. A small list is easier to evaluate but may hide useful candidates. Pagination scales better but adds API and interface behavior.

**Chosen Path (proposed)**  
Return the top 10 qualified results as the first page, ordered by the approved matching rules; use pagination for additional candidates and disclose why each result qualified.

**Rationale**  
It bounds the initial mobile-first result set while leaving room for wider discovery. Ten is a provisional product default, not a value found in either source document.

**Impact on other domains**  
Touches CME ranking, privacy/minimization, pagination contracts, client design, and performance testing.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”).

## Decision 7 — Collapse Register mutability

**Problem Statement**  
The architecture repeatedly calls the Collapse Register immutable and append-only, but Decision 7 asks whether it should use soft deletes or be truly immutable. Those statements conflict.

**Options**
- Strict append-only: never update or delete a written event; record correction/supersession as a new event.
- Soft-delete or deactivate erroneous records.
- Permit edits with a full audit trail.

**Consequences**  
Strict append-only supports auditability but requires explicit correction events and careful handling of personal data. Soft deletion is operationally convenient but weakens the stated invariant. Audited edits are more complex and make historical interpretation harder.

**Chosen Path (proposed)**  
Use strict append-only events. Corrections are new, linked records; read models may exclude a superseded event without altering the register.

**Rationale**  
This best matches the architecture’s Wolf System axioms and repeated “no UPDATE or DELETE” requirement. The contradiction in the decision log still requires owner confirmation.

**Impact on other domains**  
Affects CIE, database permissions/migrations, privacy and retention, dispute resolution, event correction, backups, and reporting.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”); strict append-only corrections are the selected policy.

## Decision 8 — Negative AGC balances

**Problem Statement**  
The system must decide whether a Seeker can post a Need without sufficient AGC, and how atomicity is maintained between balance checks and ledger writes.

**Options**
- Allow negative balances or credit.
- Block posting unless the balance covers the required cost.
- Permit an explicit, bounded system-issued grant or subsidy, recorded separately from ordinary balances.

**Consequences**  
Negative balances create debt and collection/forgiveness policy. Blocking posting is simple and preserves a closed ledger but may exclude users with unmet needs. Explicit grants support access but require governance and anti-abuse rules.

**Chosen Path (proposed)**  
Do not allow ordinary balances to go negative. Require an atomic sufficient-balance check for posting; if access grants are later approved, represent them as explicit append-only ledger entries with a separate reason.

**Rationale**  
It keeps the closed-economy ledger auditable without silently creating credit.

**Impact on other domains**  
Affects Seeker eligibility, need posting, token ledger, institutional seeding, equity/access policy, and transaction escrow.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”).

## Decision 9 — AGC when a Helper collapses mid-transaction

**Problem Statement**  
The architecture identifies escrow handling as unresolved when a Helper collapses after a transaction starts. The system must define what happens to the Seeker’s debit and any Helper reward.

**Options**
- Debit at posting and refund only through a later manual correction.
- Hold the cost in escrow until a terminal outcome.
- Debit at posting and automatically refund on any Helper collapse.

**Consequences**  
Escrow gives clear settlement but adds ledger states and lifecycle rules. Immediate debit/refund is simpler but can create race conditions and ambiguous partial work. Manual resolution is flexible but slow and inconsistent.

**Chosen Path (proposed)**  
Hold the Seeker’s cost in an escrow state recorded in the append-only AGC ledger. On confirmed successful completion, settle it according to the approved split; on Helper-caused collapse before completion, issue an explicit refund entry. Do not pay a Helper for an unverified outcome.

**Rationale**  
It preserves auditability and avoids charging a Seeker for a transaction that the system records as failed. Partial completion rules remain undefined.

**Impact on other domains**  
Depends on Decision 8 and affects transaction states, CIE classification, dispute workflow, ledger invariants, and recovery.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”); partial-work policy is not included in v1.

## Decision 10 — Recovery verification

**Problem Statement**  
The architecture asks whether recovery requires an Anchor or can be automated. The Build Task reference calls for automated Type 1/2 responses and human review for Type 3; the Architecture draft defines five protocols but leaves sign-off open.

**Options**
- Anchor approval for every return from state 0 to state 1.
- Automatic reinstatement whenever machine-checkable protocol conditions pass.
- Automated protocol progression for objective cases, with human/Anchor review for disputed, ambiguous, or high-impact cases.

**Consequences**  
Universal review improves oversight but increases delay and Anchor workload. Full automation scales but risks false reinstatement or unjust quarantine. A tiered model requires precise classification, appeal paths, and a clear distinction between evidence collection and judgment.

**Chosen Path (proposed)**  
Use tiered recovery: automate only deterministic evidence collection and Type 1/2 response steps; require human/Anchor review for Type 3, disputed cases, and any case where causation is unclear. Reinstatement must be an explicit, logged transition after protocol completion, not a timer-only default.

**Rationale**  
It reconciles the Build Task’s automation intent with its human-mediated Type 3 review and the Architecture draft’s unresolved sign-off question.

**Impact on other domains**  
Affects CIE/classifier, recovery protocols, binary state, Anchor workload, appeal rights, fairness, and event audit.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”); ambiguous cases remain human-reviewed.

## Decision 11 — Threshold event bus

**Problem Statement**  
The architecture assumes a Threshold event-bus connection but asks whether a standard interface exists. The checked Threshold Python source exposes `Graph.tick()` and FastAPI routes; no event-bus implementation was found in the searched source.

**Options**
- Add a general event bus to Threshold.
- Have Agataga poll/read Threshold state directly.
- Define a narrow Agataga adapter that consumes authoritative Threshold tick snapshots and emits typed Agataga events without changing Threshold’s core.

**Consequences**  
A shared bus can support other consumers but expands Threshold scope. Polling is easy to prototype but risks duplicate or missed effects. A narrow adapter limits coupling but requires stable event identity, ordering, and delivery guarantees.

**Chosen Path (proposed)**  
Start with an Agataga-owned adapter around an explicitly authoritative Threshold tick/snapshot contract. Make event identity and idempotency part of that contract. Do not introduce a general Threshold event bus unless another consumer requires it.

**Rationale**  
The current code provides a sequence-bearing snapshot, not a bus. An adapter is the narrowest path that avoids coupling Agataga to undocumented internals.

**Impact on other domains**  
Depends on Decision 3 and affects CIE triggers, cycle ordering, retries, observability, and whether Agataga is in-process or API-backed.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”).

## Decision 12 — Capability Tag vocabulary

**Problem Statement**  
Matching uses controlled capability tags. The architecture leaves open whether the list is fixed or can grow, while assigning proposed new-tag approval to an Anchor.

**Options**
- Fixed vocabulary shipped with each release.
- Dynamic additions proposed and approved by Anchors.
- Free-form user tags normalized at match time.

**Consequences**  
A fixed list is predictable but slow to adapt. Dynamic controlled tags adapt while requiring versioning and review. Free text is flexible but degrades matching quality and can be gamed.

**Chosen Path (proposed)**  
Use a controlled, versioned vocabulary. Users cannot create active matching tags directly; new tags enter a proposal queue and become active only after Anchor approval.

**Rationale**  
This matches the architecture’s controlled-vocabulary and Anchor responsibilities while allowing the capability set to evolve.

**Impact on other domains**  
Affects declarations, certification, need decomposition, matching compatibility, migrations, analytics, and Anchor permissions.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”).

## Decision 13 — Real-time recency window for R-Score

**Problem Statement**  
The architecture weights events within 30 cycles more heavily, but asks how many real-world hours or days those cycles represent. This depends on Decision 3.

**Options**
- Keep decay strictly cycle-relative.
- Map 30 cycles to a fixed wall-clock duration.
- Use both cycle age and wall-clock age.

**Consequences**  
Cycle-only behavior is deterministic relative to the simulation but may not reflect real-world inactivity. Wall-clock decay is understandable for local commitments but depends on reliable time and offline behavior. A hybrid model is harder to explain and calibrate.

**Chosen Path (proposed)**  
Keep the current 30-cycle distinction cycle-relative in v1; do not assign an hours/days equivalent until Decision 3 defines cycle cadence. Store timestamps for audit, but do not use them as a second decay signal without a separate approved rule.

**Rationale**  
It preserves the source formula without inventing a cycle duration or double-counting age.

**Impact on other domains**  
Depends on Decisions 3 and 15; affects score interpretation, matching, background jobs, and testing.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”); no wall-clock decay mapping is authorized.

## Decision 14 — Agataga API versus Python-only integration

**Problem Statement**  
The architecture asks whether Agataga is called only through Python imports or exposes its own API. The Build Task reference calls for a mobile-first interface; current Threshold already has a FastAPI application, but the Agataga auth and client contract are not specified.

**Options**
- Python package only; no network API.
- A standalone Agataga REST API.
- Agataga domain package plus a separately mountable API adapter, initially hosted by the existing Threshold FastAPI app if the security boundary is approved.

**Consequences**  
Python-only minimizes surface area but cannot directly serve independent clients. A standalone API adds deployment, authentication, and versioning. A mountable adapter supports both in-process use and a future API but requires strict domain/API separation.

**Chosen Path (proposed)**  
Keep domain logic as an importable Python package and define an API adapter as a separate boundary. Do not expose routes until authentication, authorization, and deployment ownership are approved; prefer mounting into the existing FastAPI service over creating a second server if those decisions permit it.

**Rationale**  
It preserves the mobile-client direction without creating an unauthenticated or duplicate API prematurely.

**Impact on other domains**  
Affects Threshold integration, auth, deployment, client applications, data validation, and package layout.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”); route creation remains deferred until auth requirements are specified.

## Decision 15 — Cycle time versus real-world time

**Problem Statement**  
Agataga needs ordering, deadlines, timeliness, and audit history, while the simulation uses cycles. The architecture asks whether all time is cycle-relative or whether real timestamps matter.

**Options**
- Cycle time only.
- UTC wall-clock time only.
- Store both: monotonic cycle/sequence for simulation ordering and UTC timestamps for human commitments and audit.

**Consequences**  
Cycle-only cannot represent real deadlines or a 90-day accountability window reliably. Wall-clock-only weakens deterministic replay. Dual time requires explicit rules for pauses, replay, clock skew, and which time source governs each behavior.

**Chosen Path (proposed)**  
Store both a Threshold/Agataga sequence and UTC timestamps. Use sequence/cycle time for deterministic simulation ordering; use UTC for human-facing deadlines, communication timestamps, and audit. Do not let UTC alone advance simulation state.

**Rationale**  
The product reference includes time-sensitive needs and a 90-day accountability window, while the architecture relies on deterministic cycles.

**Impact on other domains**  
Cross-cuts transaction deadlines, Trust/R-Score decay, recovery windows, persistence, replay, reporting, and Threshold integration.

**Gate status:** CLOSED — approved by James on 2026-10-06 (“proceed”); UTC does not advance simulation state.

## Approval record

The approved paths above govern Agataga implementation. The source architecture DOCX remains unchanged for provenance; this Markdown register is the current answer record. Implementations must still follow each decision's stated exclusions and deferred behavior.
