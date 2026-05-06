import { ARCH_STAGE_LIST } from "./archReducer";

export function archNarrationFor(a = {}) {
  const stage = a.currentStage;
  const idx = a.stageIndex ?? -1;
  const total = ARCH_STAGE_LIST.length;
  const label = idx >= 0 ? `Stage ${idx + 1} of ${total}` : `Stage 0 of ${total}`;

  switch (stage) {
    case "ARCH_LAYERS":
      return {
        overline: label,
        title: "Four-layer architecture",
        body: "The ledger is organized into four horizontal layers: Journal (append-only source of truth), CDC Tier (change-stream fan-out), ASP Projection (read-optimized views), and WORM Sink (immutable audit archive). Each layer has a single, explicit responsibility — no layer reads from the layer above it.",
        doc: null,
      };
    case "ARCH_COLLECTIONS":
      return {
        overline: label,
        title: "Eight collections across four layers",
        body: "journalEntries and paymentInstructions live in the Journal. cdcResumeTokens lives in the CDC Tier — one token per consumer, enabling exactly-once replay. accountBalances, customers, reconciliationRuns, and reconciliationExceptions live in ASP Projection. auditLog lives in the WORM Sink. Eight collections, zero ambiguity about ownership.",
        doc: null,
      };
    case "ARCH_ENFORCED":
      return {
        overline: label,
        title: "Engine controls vs. Detective controls",
        body: "Engine controls prevent bad writes at database level: $expr Pacioli validator (∑lines=0), $expr SoD (createdBy≠approvedBy), partial unique index on externalRef. Detective controls catch anomalies after the fact: reconciliationRuns aggregations, reconciliationExceptions queries, cross-shard balance checks. Engine is your first line of defense; Detective is your second.",
        doc: null,
      };
    case "ARCH_PRINCIPLES":
      return {
        overline: label,
        title: "Three non-negotiable principles",
        body: "Immutable Journal: glJournalEntries is append-only — no UPDATE, no DELETE, ever. Single CDC Cursor: one change stream per collection, never per downstream consumer — consumers subscribe to the CDC tier. WORM Tamper Evidence: every auditLog entry carries SHA-256(prevHash ‖ payload) + RFC 3161 timestamp — any sequence number gap is detectable and attributable.",
        doc: null,
      };
    default:
      return {
        overline: "Idle",
        title: "Architecture — Four Layers, Eight Collections",
        body: "Press Simulate to walk through the system architecture: four layers, eight collections, engine vs. detective controls, and the three core principles that make the ledger tamper-evident and auditable.",
        doc: null,
      };
  }
}
