// simulator.js — pure event generator for the ledger flow demo.
// Same event shape the backend Change Stream subscriber will eventually emit,
// so the UI can swap data sources without re-rendering logic.


const PERIOD_CODE = "2026-05";
const PERIOD_NAME = "May 2026";

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function ymd(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function dec(n) {
  return { $numberDecimal: Number(n).toFixed(2) };
}

function isoDate(date) {
  return { $date: date.toISOString() };
}

// Returns an object containing:
//   - identifiers (journalId, sub-ledger ids, idempotencyKey, paymentId)
//   - the canonical journalEntry document (status='POSTED')
//   - the two subLedgerEntries documents (debit + credit legs)
//   - the ordered event timeline (delays in ms)
export function buildPaymentRun({ from, to, amount, currency = "USD", description, txType = "DOMESTIC" }) {
  const now = new Date();
  const stamp = ymd(now);
  const idempotencyKey = `pay-${uuid()}`;
  const paymentId = `PAY-${stamp}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
  const journalId = `JNL-${stamp}-${String(Math.floor(Math.random() * 999999)).padStart(6, "0")}`;
  const subLedgerDebitId = `SL-${stamp}-${String(Math.floor(Math.random() * 999999)).padStart(6, "0")}`;
  const subLedgerCreditId = `SL-${stamp}-${String(Math.floor(Math.random() * 999999)).padStart(6, "0")}`;
  const resumeToken = `rt-${uuid().slice(0, 12)}`;

  // FX type: EUR source, USD functional
  const isFX = txType === "FX";
  const isCancelled = txType === "CANCELLED";
  // For FX: Frida sends €220.00, converted at 1.136 → $250.00 USD
  const txCurrency = isFX ? "EUR" : currency;
  const txAmountMinor = isFX ? Math.round(amount / 1.136 * 100) : Math.round(amount * 100);
  const fxRate = isFX ? "1.136" : null;
  const fxRateAt = isFX ? isoDate(now) : null;
  // CANCELLED: card auth, PENDING stage
  const entryStage = isCancelled ? "PENDING" : "POSTED";
  const journalStatus = isCancelled ? "PENDING_CAPTURE" : "POSTED";
  const journalType = isCancelled ? "CARD_AUTH" : "SYSTEM";
  const sourceReference = {
    sourceSystem: isCancelled ? "CARD_AUTHORIZATION" : isFX ? "SWIFT_MX" : "PAYMENT_ORDER",
    sourceId: paymentId,
    sourceType: isCancelled ? "CARD_AUTH" : "PAYMENT",
    sourceCollection: isCancelled ? "cardAuthorizations" : "payments",
  };

  const journalEntry = {
    journalId,
    idempotencyKey,
    periodCode: PERIOD_CODE,
    periodName: PERIOD_NAME,
    valueDate: isoDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))),
    postingDate: isoDate(now),
    journalType,
    status: journalStatus,
    currency,
    totalAmount: dec(amount),
    description: description || (isCancelled ? `Card auth — ${from.displayName} at merchant` : isFX ? `FX transfer — ${from.displayName} → ${to.displayName} (EUR→USD)` : `Customer transfer — ${from.displayName} → ${to.displayName}`),
    sourceReference,
    entries: [
      {
        lineNumber: 1,
        accountCode: from.controlAccountCode,
        accountName: "Customer Deposits — Current",
        side: "DEBIT",
        amount: dec(amount),
        currency,
        amountTransactionMinor: txAmountMinor,
        transactionCurrency: txCurrency,
        fxRate,
        fxRateAt,
        functionalAmount: dec(amount),
        subLedgerRef: subLedgerDebitId,
        costCenter: "RETAIL-BANKING",
        lineDescription: isFX ? `Debit ${from.displayName} — FX ${txCurrency}→${currency}` : `Debit ${from.displayName} — ${from.accountId}`,
      },
      {
        lineNumber: 2,
        accountCode: to.controlAccountCode,
        accountName: "Customer Deposits — Current",
        side: "CREDIT",
        amount: dec(amount),
        currency,
        amountTransactionMinor: txAmountMinor,
        transactionCurrency: txCurrency,
        fxRate,
        fxRateAt,
        functionalAmount: dec(amount),
        subLedgerRef: subLedgerCreditId,
        costCenter: "RETAIL-BANKING",
        lineDescription: `Credit ${to.displayName} — ${to.accountId}`,
      },
    ],
    reversalOf: null,
    reversedBy: null,
    approvedBy: "SYSTEM",
    approvedAt: isoDate(now),
    postedBy: "SYSTEM",
    createdAt: isoDate(now),
    updatedAt: isoDate(now),
  };

  const subLedgerDebit = {
    subLedgerId: subLedgerDebitId,
    idempotencyKey,
    journalEntryId: journalId,
    periodCode: PERIOD_CODE,
    periodName: PERIOD_NAME,
    subLedgerType: from.subLedgerType,
    controlAccountCode: from.controlAccountCode,
    entityReference: {
      entityType: "ACCOUNT",
      entityId: from.accountId,
      entityName: `${from.displayName} — Current Account`,
    },
    side: "DEBIT",
    amount: dec(amount),
    currency,
    functionalAmount: dec(amount),
    runningBalance: dec(from.balance - amount),
    valueDate: journalEntry.valueDate,
    postingDate: journalEntry.postingDate,
    transactionType: "PAYMENT_OUT",
    status: entryStage,
    sourceReference,
    description: isCancelled ? `Card auth hold — debit ${from.accountId}` : `Outbound transfer — debit ${from.accountId}`,
    reversalOf: null,
    reversedBy: null,
    createdAt: journalEntry.createdAt,
    updatedAt: journalEntry.updatedAt,
  };

  const subLedgerCredit = {
    subLedgerId: subLedgerCreditId,
    idempotencyKey,
    journalEntryId: journalId,
    periodCode: PERIOD_CODE,
    periodName: PERIOD_NAME,
    subLedgerType: to.subLedgerType,
    controlAccountCode: to.controlAccountCode,
    entityReference: {
      entityType: "ACCOUNT",
      entityId: to.accountId,
      entityName: `${to.displayName} — Current Account`,
    },
    side: "CREDIT",
    amount: dec(amount),
    currency,
    functionalAmount: dec(amount),
    runningBalance: dec(to.balance + amount),
    valueDate: journalEntry.valueDate,
    postingDate: journalEntry.postingDate,
    transactionType: "PAYMENT_IN",
    status: entryStage,
    sourceReference,
    description: isCancelled ? `Card auth hold — credit ${to.accountId}` : `Inbound transfer — credit ${to.accountId}`,
    reversalOf: null,
    reversedBy: null,
    createdAt: journalEntry.createdAt,
    updatedAt: journalEntry.updatedAt,
  };

  // Timeline. `t` is ms from run start. The reducer reads `payload` keys it
  // cares about — additional fields are kept for backend parity.
  const timeline = [
    {
      t: 0,
      stage: "PAYMENT_INITIATED",
      payload: {
        paymentId,
        idempotencyKey,
        from: { accountId: from.accountId, displayName: from.displayName, balance: from.balance },
        to: { accountId: to.accountId, displayName: to.displayName, balance: to.balance },
        amount,
        currency,
      },
    },
    { t: 1100, stage: "SUBLEDGER_DEBIT", payload: { document: subLedgerDebit } },
    { t: 1900, stage: "SUBLEDGER_CREDIT", payload: { document: subLedgerCredit } },
    {
      t: 2900,
      stage: "RECONCILE_SKIPPED",
      payload: {
        reason: "mvp-write-only",
        wouldHaveMatched: true,
        note: "App-enforced double-entry balance; period close gate deferred to Phase 2.",
      },
    },
    { t: 3800, stage: "JOURNAL_POSTED", payload: { document: journalEntry } },
    {
      t: 5000,
      stage: "CHANGE_STREAM",
      payload: { resumeToken, op: "insert", ns: "leafy_bank_bian.journalEntries" },
    },
    {
      t: 6000,
      stage: "BALANCE_PROJECTED_DEBIT",
      payload: { accountId: from.accountId, before: from.balance, after: from.balance - amount },
    },
    {
      t: 6500,
      stage: "BALANCE_PROJECTED_CREDIT",
      payload: { accountId: to.accountId, before: to.balance, after: to.balance + amount },
    },
    { t: 7300, stage: "SETTLED", payload: {} },
  ];

  return {
    identifiers: { journalId, subLedgerDebitId, subLedgerCreditId, idempotencyKey, paymentId },
    documents: { journalEntry, subLedgerDebit, subLedgerCredit },
    timeline,
  };
}

// Drives a timeline against a dispatch fn. Returns a cancel handle.
// (Kept for backward compatibility with the v1 modal — not used by v2.)
export function runTimeline(timeline, dispatch) {
  const handles = timeline.map((evt) =>
    setTimeout(() => dispatch({ type: "STAGE_EVENT", event: evt }), evt.t)
  );
  return () => handles.forEach(clearTimeout);
}

// ─────────────────────────────────────────────────────────────────────────────
// runMode — v2 entry point. Drives a timeline in one of three modes:
//
//   STEP  — caller invokes next() once per stage; no timers.
//   SLOW  — auto-fires every ~1500ms; total ~13.5s.
//   DEMO  — original v1 pacing (timeline.t values); total ~7.3s.
//
// Returns { next, cancel } in all modes. In STEP mode, AUTO modes also
// expose next() but it's a no-op (the timer already advances).
// ─────────────────────────────────────────────────────────────────────────────
export function runMode(timeline, dispatch, mode = "STEP") {
  let cancelled = false;
  let cursor = 0;
  let autoHandles = [];

  const fire = (i) => {
    if (cancelled || i >= timeline.length) return;
    const evt = timeline[i];
    dispatch({ type: "STAGE_EVENT", event: evt });
    cursor = i + 1;
  };

  if (mode === "SLOW") {
    const STEP_MS = 2000;
    autoHandles = timeline.map((_evt, i) =>
      setTimeout(() => fire(i), i * STEP_MS)
    );
  }

  const next = () => {
    if (cancelled || cursor >= timeline.length) return;
    fire(cursor);
  };

  const cancel = () => {
    cancelled = true;
    autoHandles.forEach(clearTimeout);
    autoHandles = [];
  };

  return { next, cancel };
}
