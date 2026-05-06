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
  "EOD_RECONCILE_RUN",
  "EOD_RECONCILE_RESULT",
  "EOD_RECONCILE_RESOLVED",
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
  const txType = state.txType || "DOMESTIC";
  const isFX = txType === "FX";
  const isCancelled = txType === "CANCELLED";
  const fromName = Object.values(state.balances || {})[0]?.displayName || "Frida";
  const toName = Object.values(state.balances || {})[1]?.displayName || "Bo";

  switch (stage) {
    case "PAYMENT_INITIATED": {
      let title, body;
      if (isFX) {
        const eurAmt = (amount / 1.136).toFixed(2);
        title = "FX payment initiated · SWIFT MX";
        body = `CBPR+ PACS.008 ingested at boundary. ${fromName} initiates €${eurAmt} EUR, converted at rate 1.136 to ${fmtMoney(amount)} USD. amountTransactionMinor carries the original EUR minor units; amountBaseMinor carries USD functional cents. The fxRateAt timestamp anchors the rate for audit. An idempotency key prevents duplicate posting on retry.`;
      } else if (isCancelled) {
        title = "Card authorization initiated";
        body = `${fromName}'s card swipe triggers a CARD_AUTH message. A PENDING sub-ledger entry places a hold of ${fmtMoney(amount)} — funds are reserved but not yet transferred. entryStage=PENDING means these legs will not appear in the posted GL until CAPTURE. An idempotency key prevents duplicate auth posting.`;
      } else {
        title = "Payment initiated · FedNow";
        body = `ISO 20022 PACS.008 ingested and mapped to canonical PaymentOrder. ${fromName} initiates a ${fmtMoney(amount, currency)} payment to ${toName} via FedNow instant rails. uetr and endToEndId are canonical identifiers. A client-generated idempotency key is attached so retries cannot post the same payment twice — the unique MongoDB index on idempotencyKey enforces this at the database level.`;
      }
      return {
        overline: indexLabel,
        title,
        body,
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
            ...(isFX ? { txType: "FX", fxRate: "1.136", txCurrency: "EUR" } : {}),
            ...(isCancelled ? { txType: "CANCELLED", authStatus: "PENDING" } : {}),
          },
        },
      };
    }

    case "SUBLEDGER_DEBIT": {
      const isP = isCancelled;
      return {
        overline: indexLabel,
        title: isP ? "Sub-ledger · debit hold (PENDING)" : "Sub-ledger · debit leg posted",
        body: isP
          ? `Debit hold posts against ${fromName}'s account with status=PENDING. The ${fmtMoney(amount)} is reserved but not yet moved — entryStage=PENDING flags this as an authorization, not a completed transfer. Immutability is enforced from creation: even PENDING entries cannot be updated; only a subsequent CAPTURE or REVERSAL can change the outcome.`
          : `Debit leg posts against ${fromName}'s Customer Deposits account. The sub-ledger entry carries the entity-level detail (account ID, running balance) that the GL summary will not. Same idempotency key as the parent journal — enforces single-write semantics across both collections.`,
        doc: {
          collectionKey: "subLedgerEntries",
          label: "subLedgerEntries[0]",
          payload: state.documents?.subLedgerEntries?.[0] || null,
        },
      };
    }

    case "SUBLEDGER_CREDIT": {
      const isP = isCancelled;
      return {
        overline: indexLabel,
        title: isP ? "Sub-ledger · credit hold (PENDING)" : "Sub-ledger · credit leg posted",
        body: isP
          ? `Credit hold posts to the merchant's account with status=PENDING. Both legs are PENDING — Σ debits = Σ credits in the pending state. The double-entry constraint holds even for authorizations. If the auth expires, a REVERSAL journal will zero both legs, restoring ${fromName}'s available balance exactly.`
          : `Credit leg posts to ${toName}'s account. Σ debits now equals Σ credits — the application-layer balance check passes. Posted entries are immutable; corrections require a REVERSAL journal, never an update.`,
        doc: {
          collectionKey: "subLedgerEntries",
          label: "subLedgerEntries[1]",
          payload: state.documents?.subLedgerEntries?.[1] || null,
        },
      };
    }

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

    case "JOURNAL_POSTED": {
      let title, body;
      if (isCancelled) {
        title = "GL journal posted · PENDING_CAPTURE";
        body = `Multi-document transaction commits with journalStatus=PENDING_CAPTURE and journalType=CARD_AUTH. The journal records the authorization hold — not a completed transfer. Both sub-ledger legs carry status=PENDING. Immutability is enforced: when the auth expires, a REVERSAL journal must be posted; this document will never be updated. The reversal will carry reversalOf pointing back to this journalId.`;
      } else if (isFX) {
        title = "GL journal posted · FX transfer";
        body = `Multi-document transaction commits. amountBaseMinor carries USD functional cents; amountTransactionMinor carries original EUR minor units; fxRateAt anchors the conversion timestamp for BCBS 239 P6 compliance. Both entries are POSTED and immutable. Decimal128 amounts prevent floating-point drift across the EUR→USD boundary.`;
      } else {
        title = "GL journal posted";
        body = `Multi-document transaction commits: both sub-ledger legs + the journalEntries document in a single atomic write with w:majority · j:true and snapshot isolation. One balanced double-entry document with status=POSTED. Decimal128 amounts prevent floating-point drift. Status is now immutable — corrections require a REVERSAL journal.`;
      }
      return {
        overline: indexLabel,
        title,
        body,
        doc: {
          collectionKey: "journalEntries",
          label: "journalEntries[0]",
          payload: state.documents?.journalEntry || null,
        },
      };
    }

    case "CHANGE_STREAM":
      return {
        overline: indexLabel,
        title: "Change Stream emitted",
        body: `MongoDB Change Streams fire on the insert. Downstream projections subscribe to ${COLLECTIONS.journalEntries.mongoAlias}; a resumeToken and postBatchResumeToken (PBRT) are issued so consumers can replay from the exact event on reconnect. The PBRT is checkpointed durably — ChangeStreamHistoryLost (error 286) is handled by the WORM fallback. This is the system's nervous system — every commit fans out.`,
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

    case "EOD_RECONCILE_RUN": {
      const evtScenario = state.events?.find(e => e.stage === "EOD_RECONCILE_RUN")?.payload?.scenario || state.scenario || "FX_ROUNDING";
      const effectiveTxType = state.txType || "DOMESTIC";
      if (effectiveTxType === "CANCELLED") {
        return {
          overline: indexLabel,
          title: "EOD Reconciliation triggered",
          body: "End-of-day scheduler inserts a reconciliationRuns document with status=RUNNING. Before this run, the card authorization expired — a REVERSAL journal was posted, zeroing both PENDING sub-ledger legs. The reconciliation run sees net $0.00 impact from this transaction.",
          doc: null,
        };
      }
      const scenLabels = { FX_ROUNDING: "FX Rounding Δ$1.00", MATCH: "Perfect Balance Δ$0.00", DUPLICATE: "Duplicate Post Δ$250.00" };
      return {
        overline: indexLabel,
        title: "EOD Reconciliation triggered",
        body: `End-of-day scheduler inserts a reconciliationRuns document with status=RUNNING. Run type SUB_LEDGER_TO_GL: sums every subLedgerEntries document for control account 2100 and compares against the GL account balance. Period: May 2026. Scenario: ${scenLabels[evtScenario] || evtScenario}. This journal's entries are counted in this run.`,
        doc: null,
      };
    }

    case "EOD_RECONCILE_RESULT": {
      const evtScenario = state.events?.find(e => e.stage === "EOD_RECONCILE_RESULT")?.payload?.scenario || state.scenario || "FX_ROUNDING";
      const effectiveTxType = state.txType || "DOMESTIC";
      if (effectiveTxType === "CANCELLED" || evtScenario === "CANCELLED") {
        return {
          overline: indexLabel,
          title: "BALANCED — authorization reversed",
          body: "Σ(subLedgerEntries) = Σ(GL 2100). Delta = $0.00. The expired card auth and its REVERSAL journal net to zero — exactly as MongoDB's immutability model requires. No exception created. The period-close gate opens without analyst intervention.",
          callout: { variant: "note", title: "Immutability in action", body: "MongoDB never deletes or updates a posted entry. The REVERSAL journal is the correction record — it carries reversalOf pointing to the original auth. The audit trail is complete and unbroken." },
          doc: null,
        };
      }
      if (evtScenario === "MATCH") {
        return {
          overline: indexLabel,
          title: "BALANCED — zero-delta",
          body: "Σ(subLedgerEntries) = Σ(GL 2100). Delta = $0.00. No exception created. The reconciliation run completes in BALANCED status — the period-close gate opens immediately without analyst intervention.",
          callout: { variant: "note", title: "Period-close gate READY", body: "Perfect reconciliation. Zero tolerance satisfied. Period close proceeds without exception lifecycle." },
          doc: null,
        };
      }
      const delta = evtScenario === "DUPLICATE" ? "$250.00" : "$1.00";
      const reason = evtScenario === "DUPLICATE"
        ? "Sub-ledger count 58,948 ≠ GL count 58,947 — likely duplicate posting. A reconciliationExceptions record is created with priority=CRITICAL."
        : "Sub-ledger total ≠ GL total by $1.00 — likely FX rounding loss. A reconciliationExceptions record is created with priority=HIGH.";
      return {
        overline: indexLabel,
        title: `UNBALANCED — ${delta} break detected`,
        body: `${reason} Period close is blocked. The exception lifecycle begins: OPEN → INVESTIGATING → RESOLVED — before the accounting period can close.`,
        callout: { variant: "important", title: "Period close is blocked", body: "A reconciliationExceptions document is created. The exception must be fully resolved before the period-close gate can open." },
        doc: null,
      };
    }

    case "EOD_RECONCILE_RESOLVED": {
      const evtScenario = state.events?.find(e => e.stage === "EOD_RECONCILE_RESOLVED")?.payload?.scenario || state.scenario || "FX_ROUNDING";
      const effectiveTxType = state.txType || "DOMESTIC";
      if (effectiveTxType === "CANCELLED" || evtScenario === "CANCELLED" || evtScenario === "MATCH") {
        return {
          overline: indexLabel,
          title: "Period-close gate open",
          body: evtScenario === "CANCELLED" || effectiveTxType === "CANCELLED"
            ? "Zero-delta run — auth reversal pair nets to $0.00. Period-close gate opened immediately. The original PENDING journal and its REVERSAL provide a complete, immutable audit trail of the authorization lifecycle."
            : "Zero-delta run — period-close gate opened immediately. No exception lifecycle needed. The immutable journal and sub-ledger entries for this payment are included in the balanced period. Full audit trail preserved.",
          doc: null,
        };
      }
      const corrType = evtScenario === "DUPLICATE" ? "reversal journal" : "adjustment journal";
      return {
        overline: indexLabel,
        title: "Exception resolved — period close unblocked",
        body: `Exception status → RESOLVED. Analyst confirms root cause and a ${corrType} corrects the break. A re-run of the reconciliation returns BALANCED. The period-close gate clears. Zero tolerance maintained end-to-end: detection → investigation → correction → closure.`,
        callout: { variant: "note", title: "Period close is now READY", body: "All reconciliation exceptions resolved. The correction journal and exception document provide a complete, immutable audit trail." },
        doc: null,
      };
    }

    case "SETTLED": {
      const elapsed = state.startedAt && state.settledAt ? ((state.settledAt - state.startedAt) / 1000).toFixed(2) : null;
      let settledTitle, settledBody;
      if (isCancelled) {
        settledTitle = "Authorization expired — balance restored";
        settledBody = elapsed
          ? `Authorization lifecycle complete in ${elapsed}s. The card auth expired before capture — a REVERSAL journal was posted, restoring ${fromName}'s full available balance. Two immutable documents remain: the original PENDING_CAPTURE journal and the REVERSAL journal. MongoDB's immutability model ensures the audit trail cannot be altered.`
          : `Authorization expired. ${fromName}'s balance fully restored via REVERSAL journal. Complete audit trail preserved.`;
      } else if (isFX) {
        settledTitle = "FX transfer settled";
        settledBody = elapsed
          ? `FX transfer settled in ${elapsed}s end-to-end. EUR→USD conversion captured at fxRateAt. Both balances reflect the new state; the immutable journal entries provide a complete BCBS 239 P6 compliant audit trail.`
          : "FX transfer settled. EUR→USD conversion complete; both customer balances updated.";
      } else {
        settledTitle = "Settled";
        settledBody = elapsed
          ? `Payment settled in ${elapsed}s end-to-end. Both customer balances reflect the new state; the immutable journal and sub-ledger entries provide a complete audit trail.`
          : "Payment settled. Both customer balances reflect the new state.";
      }
      return {
        overline: indexLabel,
        title: settledTitle,
        body: settledBody,
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
    case "EOD_RECONCILE_RUN": return "EOD Run";
    case "EOD_RECONCILE_RESULT": return "EOD Result";
    case "EOD_RECONCILE_RESOLVED": return "EOD Resolved";
    case "SETTLED": return "Settled";
    default: return stage;
  }
}
