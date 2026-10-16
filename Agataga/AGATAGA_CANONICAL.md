# Agataga — Canonical Product and Build Boundary

**Purpose:** Shared entry point for product intent, source-document status, proposed package layout, and implementation gates.

## Source documents and authority

The two Word documents in this folder remain the original references and have not been modified:

- [Agataga Build Task Document — System Blueprint.docx](./Agataga%20Build%20Task%20Document%20%E2%80%94%20System%20Blueprint.docx) — Version 1.0, marked **Active Build Reference**. It defines the product thesis, value loop, principles, and a four-phase roadmap.
- [Agataga System Architecture Document.docx](./Agataga%20System%20Architecture%20Document.docx) — Version 1.0, marked **Pre-Build Design Spec** and **Pending Decision Log Completion**. It proposes the Wolf System, CIE, CME, AGC ledger, database model, Threshold integration, package tree, and a separate five-phase implementation plan.

The build reference is the source for product intent. The architecture document is a pre-build proposal. The answers to its 15 blocking questions are recorded in [docs/DECISIONS.md](./docs/DECISIONS.md), approved by James's instruction “proceed” on 2026-10-06; the original Word documents remain unchanged. Where terms or sequencing differ between the two documents, this canonical entry preserves the difference instead of guessing.

## Product definition

Agataga is a local reliability system: structured needs are made visible, matched with declared capabilities and proximity, governed by clear commitments, and informed by factual records of follow-through. Its intended loop connects helping with future access to help and with community trust.

It is not a marketplace, gig platform, social network, or directory. “Reliability as physics” and “inevitable” are the product thesis, not a verified guarantee about human behavior.

## Proposed system concepts

The architecture draft describes these components. They remain design proposals until the decision log is resolved:

- **Wolf System:** binary active/quarantined state (1/0), with a continuous reliability score used for ordering but never overriding the binary gate.
- **CIE (Collapse Intake Engine):** detects and classifies collapse, quarantines, records, and routes recovery.
- **CME (Capability Matching Engine):** qualifies and ranks helpers for structured needs, with logged widening/floor-breach behavior.
- **AGC ledger:** system-mediated internal credits, proposed as append-only.
- **Threshold integration:** proposed tick hook and event-bus adapter to the existing Python simulation.

The Build Task document uses “Trust Score”; the architecture document uses “R-Score.” Their equivalence, formulas, ownership, and display rules must be confirmed rather than assumed.

## Proposed package layout

This scaffold follows the package tree in the architecture draft. Directories are present; planned Python modules are intentionally not created while the architecture remains pre-build.

```text
Agataga/
├── README.md
├── AGATAGA_CANONICAL.md
├── Agataga Build Task Document — System Blueprint.docx  (existing; unchanged)
├── Agataga System Architecture Document.docx             (existing; unchanged)
├── __init__.py
├── core/              # wolf, cycle engine, ledger
├── economy/           # roles, needs, tokens
├── matching/          # CME, tags, unmatched queue
├── collapse/          # CIE, classifier, register, recovery
├── db/                # models, queries, migrations
│   └── migrations/
├── integration/       # Threshold hook and event-bus adapter
├── docs/
│   └── decisions/
└── tests/
    ├── unit/
    └── integration/
```

`C:\Threshold\Agataga` is the project root; the package directories are directly under it rather than inside a second `agataga/` folder.

The UI/API placement is deliberately undecided: Architecture Decision 14 asks whether Agataga should expose an API or be accessed through Python imports within Threshold. No web stack or deployment layout is selected here.

## Blocking architecture decisions

The architecture draft listed these 15 decisions as unanswered. Their approved paths and consequences are recorded in [DECISIONS.md](./docs/DECISIONS.md). The register closes those decision gates while preserving deferred behavior explicitly:

1. Database backend.
2. Whether SQLAlchemy is already used by Threshold or would be a new dependency.
3. Definition of an Agataga cycle relative to Threshold ticks.
4. Whether one person may control multiple entities.
5. Maximum concurrent transactions per helper.
6. Maximum match results per need.
7. Whether the Collapse Register is strictly immutable or uses soft deletes.
8. Whether AGC balances may go negative.
9. AGC handling when a helper collapses mid-transaction.
10. Manual versus automated recovery verification.
11. Whether Threshold provides a standard event bus.
12. Fixed versus dynamic capability tags and approval workflow.
13. Real-time meaning of the 30-cycle recency window.
14. Separate API versus internal Python integration.
15. Whether time is cycle-only or also uses real-world timestamps.

## Roadmap alignment required

The Build Task document presents four product phases; the Architecture document presents five technical phases. Their sequencing and acceptance gates are not yet aligned. Do not treat the roadmap as reconciled until a decision record establishes the order and exit criteria.

## Implementation rule

The decision gates are recorded as closed in [docs/DECISIONS.md](./docs/DECISIONS.md), interpreting James's instruction “proceed” on 2026-10-06 as approval of the proposed paths. Runtime work has begun incrementally: `core/wolf.py` implements the binary state gate, guarded reinstatement, and the specified 30-cycle weighted R-Score calculation. Persistence, economy, matching, collapse automation, API routes, and Threshold hooks are not implemented yet.

The two source documents still use different phase plans (four product phases versus five technical phases). This canonical entry does not merge those schedules; continue runtime implementation in tested slices and record any behavior not covered by the approved decisions before adding it.
