// reconcileFixtures.js — fixed data for the EOD reconciliation demo.

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
