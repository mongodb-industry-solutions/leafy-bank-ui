// stageNarration.js
// Pure (state) → { overline, title, body, callout?, doc? } per stage.
// Drives the StageInterpreter band. No side effects, no React imports.

import { COLLECTIONS } from "./ledgerSchema";

const fmtMoney = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

export const STAGE_LIST = [
  "PAYMENT_INITIATED",
  "SUBLEDGER_DEBIT",
  "SUBLEDGER_CREDIT",
  "RECONCILE_SKIPPED",
  "JOURNAL_POSTED",
  "CHANGE_STREAM",
  "BALANCE_PROJECTED_DEBIT",
  "BALANCE_PROJECTED_CREDIT",
  "SETTLED",
];

export function stageOf(stageIndex) {
  if (stageIndex < 0 || stageIndex >= STAGE_LIST.length) return null;
  return STAGE_LIST[stageIndex];
}

export function indexOfStage(stage) {
  return STAGE_LIST.indexOf(stage);
}

// Returns a content descriptor for the current stage.
// state shape: { stageIndex, currentStage, balances, payment, identifiers, documents, totals, settledAt, startedAt }
export function narrationFor(state) {
  const stage = state.currentStage;
  const idx = indexOfStage(stage);
  const total = STAGE_LIST.length;
  const indexLabel = idx >= 0 ? `Stage ${idx + 1} of ${total}` : `Stage 0 of ${total}`;
  const amount = state.payment?.amount || 0;
  const currency = state.payment?.currency || "USD";
  const fromName = Object.values(state.balances || {})[0]?.displayName || "Frida";
  const toName = Object.values(state.balances || {})[1]?.displayName || "Bo";

  switch (stage) {
    case "PAYMENT_INITIATED":
      return {
        overline: indexLabel,
        title: "Payment initiated",
        body: `${fromName} initiates a ${fmtMoney(amount, currency)} payment to ${toName}. A client-generated idempotency key is attached so retries cannot post the same payment twice — the unique MongoDB index on idempotencyKey enforces this at the database level.`,
        doc: {
          collectionKey: null,
          label: "Payment intent",
          payload: {
            paymentId: state.identifiers?.paymentId || null,
            idempotencyKey: state.identifiers?.idempotencyKey || null,
            from: { accountId: Object.keys(state.balances || {})[0], displayName: fromName, balance: { $numberDecimal: (Object.values(state.balances || {})[0]?.before ?? 0).toFixed(2) } },
            to: { accountId: Object.keys(state.balances || {})[1], displayName: toName, balance: { $numberDecimal: (Object.values(state.balances || {})[1]?.before ?? 0).toFixed(2) } },
            amount: { $numberDecimal: amount.toFixed(2) },
            currency,
          },
        },
      };

    case "SUBLEDGER_DEBIT":
      return {
        overline: indexLabel,
        title: "Sub-ledger · debit leg posted",
        body: `Debit leg posts against ${fromName}'s Customer Deposits account. The sub-ledger entry carries the entity-level detail (account ID, running balance) that the GL summary will not. Same idempotency key as the parent journal — enforces single-write semantics across both collections.`,
        doc: {
          collectionKey: "subLedgerEntries",
          label: "subLedgerEntries[0]",
          payload: state.documents?.subLedgerEntries?.[0] || null,
        },
      };

    case "SUBLEDGER_CREDIT":
      return {
        overline: indexLabel,
        title: "Sub-ledger · credit leg posted",
        body: `Credit leg posts to ${toName}'s account. Σ debits now equals Σ credits — the application-layer balance check passes. Posted entries are immutable; corrections require a REVERSAL journal, never an update.`,
        doc: {
          collectionKey: "subLedgerEntries",
          label: "subLedgerEntries[1]",
          payload: state.documents?.subLedgerEntries?.[1] || null,
        },
      };

    case "RECONCILE_SKIPPED":
      return {
        overline: indexLabel,
        title: "Reconcile gate · bypassed",
        body: "In production this gate validates that posted sub-ledger legs reconcile against the GL control account before the journal commits. For the MVP demo we mark the gate as bypass — application code enforces double-entry balance, and the nightly sub-ledger ↔ GL reconciliation job and accountingPeriods open/close lifecycle are deferred to Phase 2.",
        callout: {
          variant: "important",
          title: "MVP scope · design decisions #0, #4, #6",
          body: "Period close gating, sub-ledger ↔ GL nightly reconciliation, and accountingPeriods lifecycle are Phase 2. Open Collections to inspect the relevant decisions.",
        },
        doc: null,
      };

    case "JOURNAL_POSTED":
      return {
        overline: indexLabel,
        title: "GL journal posted",
        body: `One balanced double-entry journalEntries document commits with status=POSTED. Decimal128 amounts. Status is now immutable. End-to-end traceability lives in sourceReference.sourceId, which links back to the originating payment.`,
        doc: {
          collectionKey: "journalEntries",
          label: "journalEntries[0]",
          payload: state.documents?.journalEntry || null,
        },
      };

    case "CHANGE_STREAM":
      return {
        overline: indexLabel,
        title: "Change Stream emitted",
        body: `MongoDB Change Streams fire on the insert. Downstream projections subscribe to ${COLLECTIONS.journalEntries.mongoAlias}; a resumeToken is issued so consumers can replay from the exact event on reconnect. This is the system's nervous system — every commit fans out.`,
        doc: {
          collectionKey: null,
          label: "Change-stream event",
          payload: {
            resumeToken: state.identifiers?.resumeToken || null,
            operationType: "insert",
            ns: { db: "leafy_bank_bian", coll: "journalEntries" },
            documentKey: { _id: "<ObjectId>" },
            fullDocument: {
              journalId: state.identifiers?.journalId || null,
              totalAmount: { $numberDecimal: amount.toFixed(2) },
              status: "POSTED",
            },
          },
        },
      };

    case "BALANCE_PROJECTED_DEBIT": {
      const acct = Object.keys(state.balances || {})[0];
      const before = Object.values(state.balances || {})[0]?.before ?? 0;
      const after = Object.values(state.balances || {})[0]?.current ?? 0;
      return {
        overline: indexLabel,
        title: "Account balance projected · sender",
        body: `${fromName}'s account balance projected: ${fmtMoney(before)} → ${fmtMoney(after)}. The projection lives in a separate accountBalances collection, updated atomically with $inc — keyed lookup, O(1) balance reads.`,
        doc: {
          collectionKey: null,
          label: "Balance projection",
          payload: {
            accountId: acct,
            entityName: fromName,
            before: { $numberDecimal: Number(before).toFixed(2) },
            after: { $numberDecimal: Number(after).toFixed(2) },
            delta: { $numberDecimal: (Number(after) - Number(before)).toFixed(2) },
          },
        },
      };
    }

    case "BALANCE_PROJECTED_CREDIT": {
      const acct = Object.keys(state.balances || {})[1];
      const before = Object.values(state.balances || {})[1]?.before ?? 0;
      const after = Object.values(state.balances || {})[1]?.current ?? 0;
      return {
        overline: indexLabel,
        title: "Account balance projected · recipient",
        body: `${toName}'s account balance projected: ${fmtMoney(before)} → ${fmtMoney(after)}. Same atomic mechanism — both projections share the journal's idempotency key for replay safety.`,
        doc: {
          collectionKey: null,
          label: "Balance projection",
          payload: {
            accountId: acct,
            entityName: toName,
            before: { $numberDecimal: Number(before).toFixed(2) },
            after: { $numberDecimal: Number(after).toFixed(2) },
            delta: { $numberDecimal: (Number(after) - Number(before)).toFixed(2) },
          },
        },
      };
    }

    case "SETTLED": {
      const elapsed = state.startedAt && state.settledAt ? ((state.settledAt - state.startedAt) / 1000).toFixed(2) : null;
      return {
        overline: indexLabel,
        title: "Settled",
        body: elapsed
          ? `Payment settled in ${elapsed}s end-to-end. Both customer balances reflect the new state; the immutable journal and sub-ledger entries provide a complete audit trail.`
          : "Payment settled. Both customer balances reflect the new state.",
        doc: {
          collectionKey: null,
          label: "Settlement summary",
          payload: {
            journalId: state.identifiers?.journalId || null,
            idempotencyKey: state.identifiers?.idempotencyKey || null,
            elapsedSeconds: elapsed ? Number(elapsed) : null,
            sourceReference: state.documents?.journalEntry?.sourceReference || null,
          },
        },
      };
    }

    default:
      return {
        overline: "Idle",
        title: "Ready to simulate",
        body: `Press Simulate to walk through a ${fmtMoney(250)} payment from ${fromName} to ${toName}. In Step mode the demo pauses on each stage — advance with Next, Space, Enter, or → arrow.`,
        doc: null,
      };
  }
}

// Stage label for the LG Pipeline component (short, fits on one chip).
export function stageLabel(stage) {
  switch (stage) {
    case "PAYMENT_INITIATED": return "Payment";
    case "SUBLEDGER_DEBIT": return "Sub-ledger Dr";
    case "SUBLEDGER_CREDIT": return "Sub-ledger Cr";
    case "RECONCILE_SKIPPED": return "Reconcile";
    case "JOURNAL_POSTED": return "GL Journal";
    case "CHANGE_STREAM": return "Change Stream";
    case "BALANCE_PROJECTED_DEBIT": return "Balance · Dr";
    case "BALANCE_PROJECTED_CREDIT": return "Balance · Cr";
    case "SETTLED": return "Settled";
    default: return stage;
  }
}
