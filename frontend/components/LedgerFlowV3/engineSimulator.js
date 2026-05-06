// engineSimulator.js — event generator for the ENGINE scene.
// Shows the 3 MongoDB validation gates: Pacioli $expr, SoD $expr, externalRef unique index.

const STEP_MS = 1800;

export function buildEngineRun() {
  const timeline = [
    {
      t: 0,
      stage: "ENGINE_BALANCE_FAIL",
      payload: {
        document: {
          journalType: "SYSTEM",
          createdBy: "payment-svc",
          approvedBy: "risk-engine",
          externalRef: "FEDNOW-uetr-0f3a-4b11",
          lines: [
            { lineNumber: 1, side: "DEBIT",  accountCode: "2100", amountBaseMinor: -24990 },
            { lineNumber: 2, side: "CREDIT", accountCode: "2100", amountBaseMinor: 25000 },
          ],
        },
        check: "PACIOLI",
        result: "FAIL",
        error: "WriteError: Document failed validation — $expr: { $eq: [{ $sum: '$lines.amountBaseMinor' }, 0] }",
        delta: "$0.10 (Σ = −$0.10)",
      },
    },
    {
      t: STEP_MS,
      stage: "ENGINE_SOD_FAIL",
      payload: {
        document: {
          journalType: "SYSTEM",
          createdBy: "alice",
          approvedBy: "alice",
          externalRef: "FEDNOW-uetr-0f3a-4b11",
          lines: [
            { lineNumber: 1, side: "DEBIT",  accountCode: "2100", amountBaseMinor: -25000 },
            { lineNumber: 2, side: "CREDIT", accountCode: "2100", amountBaseMinor:  25000 },
          ],
        },
        check: "SOD",
        result: "FAIL",
        error: "WriteError: Document failed validation — $expr: { $ne: ['$createdBy', '$approvedBy'] }",
        violator: "createdBy === approvedBy === 'alice'",
      },
    },
    {
      t: STEP_MS * 2,
      stage: "ENGINE_IDEMPOTENCY_FAIL",
      payload: {
        document: {
          journalType: "SYSTEM",
          createdBy: "payment-svc",
          approvedBy: "risk-engine",
          externalRef: "FEDNOW-uetr-0f3a-4b11",
          lines: [
            { lineNumber: 1, side: "DEBIT",  accountCode: "2100", amountBaseMinor: -25000 },
            { lineNumber: 2, side: "CREDIT", accountCode: "2100", amountBaseMinor:  25000 },
          ],
        },
        check: "IDEMPOTENCY",
        result: "FAIL",
        error: "E11000 duplicate key error — index: externalRef_1 (partial unique)",
        duplicate: "FEDNOW-uetr-0f3a-4b11",
      },
    },
    {
      t: STEP_MS * 3,
      stage: "ENGINE_COMMIT",
      payload: {
        document: {
          journalType: "SYSTEM",
          createdBy: "payment-svc",
          approvedBy: "risk-engine",
          externalRef: "FEDNOW-uetr-9a7c-2e88",
          lines: [
            { lineNumber: 1, side: "DEBIT",  accountCode: "2100", amountBaseMinor: -25000 },
            { lineNumber: 2, side: "CREDIT", accountCode: "2100", amountBaseMinor:  25000 },
          ],
        },
        checks: { pacioli: "PASS", sod: "PASS", idempotency: "PASS" },
        result: "COMMITTED",
      },
    },
  ];

  return { timeline };
}

export function runEngineMode(timeline, dispatch, mode = "STEP") {
  let cancelled = false;
  let cursor = 0;
  let autoHandles = [];

  const fire = (i) => {
    if (cancelled || i >= timeline.length) return;
    dispatch({ type: "ENGINE_STAGE_EVENT", event: timeline[i] });
    cursor = i + 1;
  };

  if (mode === "SLOW") {
    autoHandles = timeline.map((_, i) => setTimeout(() => fire(i), i * 2000));
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
