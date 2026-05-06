// reconcileFixtures.js — fixed data for the EOD reconciliation demo.
// Exports three scenarios: FX_ROUNDING (default), MATCH, DUPLICATE.

function dec(n) { return { $numberDecimal: Number(n).toFixed(2) }; }
function isoDate(d) { return { $date: new Date(d).toISOString() }; }

export const RECONCILE_RUN_ID = "RUN-20260506-001";
export const RECONCILE_EXCEPTION_ID = "EXC-20260506-001";
export const RECONCILE_CORRECTION_ID = "JNL-20260506-CORR-001";

export const RECONCILE_RUN = {
  runId: RECONCILE_RUN_ID,
  periodCode: "2026-04",
  periodName: "April 2026",
  runType: "SUB_LEDGER_TO_GL",
  controlAccountCode: "2100",
  controlAccountName: "Customer Deposits — Current",
  sourceCollection: "subLedgerEntries",
  targetCollection: "glAccounts",
  sourceCount: 58947,
  targetCount: 58947,
  sourceTotal: dec(984723.11),
  targetTotal: dec(984722.11),
  breakAmount: dec(1.00),
  currency: "USD",
  status: "UNBALANCED",
  startedAt: isoDate("2026-05-06T18:00:00Z"),
  completedAt: isoDate("2026-05-06T18:00:04Z"),
};

export const RECONCILE_EXCEPTION = {
  exceptionId: RECONCILE_EXCEPTION_ID,
  runId: RECONCILE_RUN_ID,
  exceptionType: "AMOUNT_MISMATCH",
  breakAmount: dec(1.00),
  currency: "USD",
  controlAccountCode: "2100",
  priority: "HIGH",
  slaHours: 8,
  status: "OPEN",
  notes: [
    {
      addedBy: "system",
      addedAt: isoDate("2026-05-06T18:00:05Z"),
      text: "Auto-detected: Σ(subLedgerEntries) − Σ(GL 2100) = $1.00. Assigned to reconciliation team.",
    },
    {
      addedBy: "analyst.frida",
      addedAt: isoDate("2026-05-06T18:14:22Z"),
      text: "Investigating — checking SL-20260430-047823 for pence-rounding error in FX conversion.",
    },
    {
      addedBy: "analyst.frida",
      addedAt: isoDate("2026-05-06T18:31:08Z"),
      text: "Root cause confirmed: rounding loss on FX convert in SL-20260430-047823. Posting correction journal.",
    },
  ],
  createdAt: isoDate("2026-05-06T18:00:05Z"),
  updatedAt: isoDate("2026-05-06T18:31:08Z"),
  relatedEntryId: "SL-20260430-047823",
};

export const CORRECTION_JOURNAL = {
  journalId: RECONCILE_CORRECTION_ID,
  journalType: "ADJUSTMENT",
  status: "POSTED",
  currency: "USD",
  totalAmount: dec(1.00),
  description: "Pence-rounding correction — SL-20260430-047823 FX rounding loss",
  relatedExceptionId: RECONCILE_EXCEPTION_ID,
  sourceReference: {
    sourceSystem: "RECONCILIATION",
    sourceId: RECONCILE_EXCEPTION_ID,
    sourceType: "RECONCILIATION_EXCEPTION",
    sourceCollection: "reconciliationExceptions",
  },
  createdAt: isoDate("2026-05-06T18:32:00Z"),
};

// ─── MATCH scenario — zero delta, gate opens immediately ─────────────────────

export const MATCH_RUN = {
  runId: "RUN-20260506-002",
  periodCode: "2026-04",
  periodName: "April 2026",
  runType: "SUB_LEDGER_TO_GL",
  controlAccountCode: "2100",
  controlAccountName: "Customer Deposits — Current",
  sourceCollection: "subLedgerEntries",
  targetCollection: "glAccounts",
  sourceCount: 58947,
  targetCount: 58947,
  sourceTotal: dec(984723.11),
  targetTotal: dec(984723.11),
  breakAmount: dec(0.00),
  currency: "USD",
  status: "BALANCED",
  startedAt: isoDate("2026-05-06T18:00:00Z"),
  completedAt: isoDate("2026-05-06T18:00:03Z"),
};

// ─── DUPLICATE scenario — $250 double-posting ────────────────────────────────

export const DUPLICATE_RUN = {
  runId: "RUN-20260506-003",
  periodCode: "2026-04",
  periodName: "April 2026",
  runType: "SUB_LEDGER_TO_GL",
  controlAccountCode: "2100",
  controlAccountName: "Customer Deposits — Current",
  sourceCollection: "subLedgerEntries",
  targetCollection: "glAccounts",
  sourceCount: 58948,
  targetCount: 58947,
  sourceTotal: dec(984973.11),
  targetTotal: dec(984723.11),
  breakAmount: dec(250.00),
  currency: "USD",
  status: "UNBALANCED",
  startedAt: isoDate("2026-05-06T18:00:00Z"),
  completedAt: isoDate("2026-05-06T18:00:05Z"),
};

export const DUPLICATE_EXCEPTION = {
  exceptionId: "EXC-20260506-002",
  runId: "RUN-20260506-003",
  exceptionType: "DUPLICATE_POSTING",
  breakAmount: dec(250.00),
  currency: "USD",
  controlAccountCode: "2100",
  priority: "CRITICAL",
  slaHours: 2,
  status: "OPEN",
  notes: [
    {
      addedBy: "system",
      addedAt: isoDate("2026-05-06T18:00:06Z"),
      text: "Auto-detected: Σ(subLedgerEntries) − Σ(GL 2100) = $250.00. Possible duplicate insert.",
    },
    {
      addedBy: "analyst.frida",
      addedAt: isoDate("2026-05-06T18:08:14Z"),
      text: "Confirmed: PAY-20260506-0042 posted twice — idempotency key not checked before second insert.",
    },
    {
      addedBy: "analyst.frida",
      addedAt: isoDate("2026-05-06T18:19:30Z"),
      text: "Reversal journal raised for duplicate SL-20260506-089112. MDT rollback path confirmed safe.",
    },
  ],
  createdAt: isoDate("2026-05-06T18:00:06Z"),
  updatedAt: isoDate("2026-05-06T18:19:30Z"),
  relatedEntryId: "SL-20260506-089112",
};

export const DUPLICATE_CORRECTION = {
  journalId: "JNL-20260506-REV-001",
  journalType: "REVERSAL",
  status: "POSTED",
  currency: "USD",
  totalAmount: dec(250.00),
  description: "Reversal of duplicate SL-20260506-089112 — PAY-20260506-0042 idempotency breach",
  relatedExceptionId: "EXC-20260506-002",
  sourceReference: {
    sourceSystem: "RECONCILIATION",
    sourceId: "EXC-20260506-002",
    sourceType: "RECONCILIATION_EXCEPTION",
    sourceCollection: "reconciliationExceptions",
  },
  createdAt: isoDate("2026-05-06T18:20:00Z"),
};

// ─── Scenario map ─────────────────────────────────────────────────────────────

export const SCENARIO_DATA = {
  FX_ROUNDING: {
    run: RECONCILE_RUN,
    exception: RECONCILE_EXCEPTION,
    correction: CORRECTION_JOURNAL,
    label: "FX Rounding",
    delta: "$1.00",
    exceptionType: "AMOUNT_MISMATCH",
    priority: "HIGH",
  },
  MATCH: {
    run: MATCH_RUN,
    exception: null,
    correction: null,
    label: "Perfect Balance",
    delta: "$0.00",
    exceptionType: null,
    priority: null,
  },
  DUPLICATE: {
    run: DUPLICATE_RUN,
    exception: DUPLICATE_EXCEPTION,
    correction: DUPLICATE_CORRECTION,
    label: "Duplicate Post",
    delta: "$250.00",
    exceptionType: "DUPLICATE_POSTING",
    priority: "CRITICAL",
  },
};
