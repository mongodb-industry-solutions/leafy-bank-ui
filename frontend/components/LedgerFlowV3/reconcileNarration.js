// reconcileNarration.js — per-stage narration for the EOD reconciliation scene.
import { RECONCILE_STAGE_LIST } from "./reconcileReducer";

export function reconcileNarrationFor(reconcile = {}) {
  const stage = reconcile.currentStage;
  const idx = reconcile.stageIndex ?? -1;
  const total = RECONCILE_STAGE_LIST.length;
  const label = idx >= 0 ? `Stage ${idx + 1} of ${total}` : `Stage 0 of ${total}`;

  switch (stage) {
    case "RECONCILE_RUN_TRIGGERED":
      return {
        overline: label,
        title: "Reconciliation run triggered",
        body: "The end-of-day scheduler inserts a reconciliationRuns document with status=RUNNING. Run type SUB_LEDGER_TO_GL: it will sum every subLedgerEntries document for control account 2100 and compare against the GL account balance. Period: April 2026.",
        doc: { collectionKey: null, label: "reconciliationRuns[0]", payload: reconcile.run },
      };

    case "RECONCILE_SCANNING_SOURCE":
      return {
        overline: label,
        title: "Scanning sub-ledger entries",
        body: "Aggregation pipeline running over subLedgerEntries for controlAccountCode=2100, periodCode=2026-04. Running count: 58,947 entries. Σ amounts computed with Decimal128 precision — no floating-point rounding.",
        doc: null,
      };

    case "RECONCILE_SCANNING_TARGET":
      return {
        overline: label,
        title: "Scanning GL control account",
        body: "GL account 2100 balance read. Both source and target now fully scanned. The balance check is about to execute — comparing Decimal128 totals to sub-cent precision.",
        doc: null,
      };

    case "RECONCILE_BALANCE_CHECK":
      return {
        overline: label,
        title: "Balance check running",
        body: "Comparing Σ(subLedgerEntries.amount) for account 2100 against the GL control account balance. Zero tolerance — any difference, however small, is a break. This is not a sampling check; every entry is counted.",
        doc: null,
      };

    case "RECONCILE_RESULT_UNBALANCED":
      return {
        overline: label,
        title: "⚠ UNBALANCED — $1.00 break detected",
        body: "Sub-ledger total $984,723.11 ≠ GL total $984,722.11. Difference: $1.00. This run closes as UNBALANCED. A reconciliationExceptions record is created automatically and assigned to the reconciliation team.",
        callout: {
          variant: "important",
          title: "Period 2026-04 close is blocked",
          body: "Period close cannot proceed with open reconciliation exceptions. The exception lifecycle must complete — OPEN → INVESTIGATING → RESOLVED — before the accounting period can close.",
        },
        doc: null,
      };

    case "RECONCILE_EXCEPTION_CREATED":
      return {
        overline: label,
        title: "Exception created — lifecycle begins",
        body: "A reconciliationExceptions document is inserted: status=OPEN, priority=HIGH, SLA=8h. The break amount ($1.00) and parent run ID are linked. Notes are append-only — the full investigation trail stays on the exception document.",
        doc: { collectionKey: null, label: "reconciliationExceptions[0]", payload: reconcile.exception },
      };

    case "RECONCILE_INVESTIGATION_OPENED":
      return {
        overline: label,
        title: "Investigation opened",
        body: "An analyst picks up the exception. Status → INVESTIGATING. Notes are appended chronologically — never updated or deleted. The analyst traces the break to SL-20260430-047823, a sub-ledger entry with a pence-rounding loss in FX conversion.",
        doc: { collectionKey: null, label: "reconciliationExceptions[0] · INVESTIGATING", payload: reconcile.exception },
      };

    case "RECONCILE_CORRECTION_POSTED":
      return {
        overline: label,
        title: "Correction journal posted",
        body: "Root cause confirmed: pence-rounding in FX conversion on SL-20260430-047823. An ADJUSTMENT-type journal posts for exactly $1.00, linked to the exception ID via sourceReference. Immutable by design — this correction is its own permanent audit record.",
        doc: { collectionKey: null, label: "journalEntries · ADJUSTMENT", payload: reconcile.correctionJournal },
      };

    case "RECONCILE_RESOLVED":
      return {
        overline: label,
        title: "Exception resolved — period close unblocked",
        body: "Exception status → RESOLVED. A re-run of the reconciliation for period 2026-04 returns BALANCED. The period-close gate clears. Zero tolerance maintained end-to-end — from original detection to correction to closure.",
        callout: {
          variant: "note",
          title: "Period 2026-04 close is now READY",
          body: "All reconciliation exceptions resolved. Period close can proceed. The correction journal and exception document provide a complete audit trail: break detected → analyst investigation → correction journal → re-run BALANCED.",
        },
        doc: null,
      };

    default:
      return {
        overline: "Idle",
        title: "EOD Reconciliation — Ready to simulate",
        body: "Press Simulate to run the end-of-day reconciliation for period April 2026. Sub-ledger ↔ GL comparison, zero tolerance. The UNBALANCED branch shows the full exception lifecycle: detection → investigation → correction → resolution → period-close gate cleared.",
        doc: null,
      };
  }
}
