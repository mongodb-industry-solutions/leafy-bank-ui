// reconcileSimulator.js — generates timeline for the 3-run reconcile scene.

function dec(n) { return { $numberDecimal: Number(n).toFixed(2) }; }

const TGB_BALANCED = {
  runId: "TGB-20260506-001",
  runType: "transferGroupBalance",
  strandCount: 142,
  balancedStrands: 142,
  unbalancedStrands: 0,
  totalDebit: dec(984723.11),
  totalCredit: dec(984723.11),
  delta: dec(0.00),
  status: "BALANCED",
};

const TGB_DRIFT = {
  runId: "TGB-20260506-002",
  runType: "transferGroupBalance",
  strandCount: 142,
  balancedStrands: 141,
  unbalancedStrands: 1,
  totalDebit: dec(984723.11),
  totalCredit: dec(984722.01),
  delta: dec(0.10),
  status: "UNBALANCED",
  offendingStrand: "STR-20260506-0047",
};

const TGB_DRIFT_EXCEPTION = {
  exceptionId: "EXC-RECON-001",
  exceptionType: "STRAND_DRIFT",
  strandId: "STR-20260506-0047",
  breakAmount: dec(0.10),
  currency: "USD",
  priority: "HIGH",
  status: "OPEN",
};

const TGB_DRIFT_CORRECTED = {
  ...TGB_BALANCED,
  runId: "TGB-20260506-002-RERUN",
  note: "Re-run after correction — all 142 strands balanced",
};

const SGL_BALANCED = {
  runId: "SGL-20260506-001",
  runType: "subledgerToGL",
  controlAccountCode: "2100",
  subLedgerCount: 58947,
  glCount: 58947,
  subLedgerTotal: dec(984723.11),
  glTotal: dec(984723.11),
  delta: dec(0.00),
  aspLag: null,
  status: "BALANCED",
};

const SGL_LAG = {
  runId: "SGL-20260506-002",
  runType: "subledgerToGL",
  controlAccountCode: "2100",
  subLedgerCount: 58947,
  glCount: 58831,
  subLedgerTotal: dec(984723.11),
  glTotal: dec(982411.22),
  delta: dec(2311.89),
  aspLag: {
    pipeline: "glSummaryPipeline",
    lagMs: 4200,
    lastCheckpoint: "2026-05-06T17:58:00Z",
    errorClass: "pipeline_stall",
  },
  status: "PIPELINE_LAG",
};

const SCENARIO_DATA = {
  BALANCED: {
    tgbResult: TGB_BALANCED,
    tgbException: null,
    sglResult: SGL_BALANCED,
  },
  STRAND_DRIFT: {
    tgbResult: TGB_DRIFT,
    tgbException: TGB_DRIFT_EXCEPTION,
    sglResult: SGL_BALANCED,
  },
  SUB_GL_LAG: {
    tgbResult: TGB_BALANCED,
    tgbException: null,
    sglResult: SGL_LAG,
  },
};

export function buildReconcileRun({ scenario = "BALANCED" } = {}) {
  const data = SCENARIO_DATA[scenario] || SCENARIO_DATA.BALANCED;
  const isBalanced = scenario === "BALANCED";
  const isDrift = scenario === "STRAND_DRIFT";
  const isLag = scenario === "SUB_GL_LAG";

  const timeline = [
    { stage: "RECON_INTRO",    payload: { scenario } },
    { stage: "RUN_TGB_START",  payload: { scenario } },
    { stage: "RUN_TGB_RESULT", payload: { ...data.tgbResult, scenario } },
    ...(isDrift ? [
      { stage: "TGB_EXCEPTION", payload: { exception: data.tgbException, scenario } },
      { stage: "TGB_RESOLVED",  payload: { exception: data.tgbException, correctedRun: TGB_DRIFT_CORRECTED, scenario } },
    ] : []),
    { stage: "RUN_SGL_START",  payload: { scenario } },
    { stage: "RUN_SGL_RESULT", payload: { ...data.sglResult, scenario } },
    ...(isLag ? [
      { stage: "TGB_EXCEPTION", payload: { exception: { exceptionId: "EXC-RECON-SGL-001", exceptionType: "PIPELINE_LAG", pipeline: "glSummaryPipeline", priority: "HIGH", status: "OPEN" }, scenario } },
      { stage: "TGB_RESOLVED",  payload: { note: "Operator restarted glSummaryPipeline — pipeline caught up", scenario } },
    ] : []),
    { stage: "GATE_RUN_BALANCED",   payload: { scenario } },
    { stage: "GATE_SOD",            payload: { scenario } },
    { stage: "GATE_TRIAL",          payload: { trialBalance: dec(0.00), scenario } },
    { stage: "GATE_NO_EXCEPTIONS",  payload: { openExceptions: 0, scenario } },
    { stage: "PERIOD_CLOSED",       payload: { periodCode: "2026-05", scenario } },
  ];

  return { timeline };
}

export function runReconcileMode(timeline, dispatch, mode = "STEP") {
  let cancelled = false;
  let cursor = 0;
  let autoHandles = [];

  const fire = (i) => {
    if (cancelled || i >= timeline.length) return;
    dispatch({ type: "RECONCILE_STAGE_EVENT", event: timeline[i] });
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
