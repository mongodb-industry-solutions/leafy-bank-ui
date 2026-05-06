// reconcileReducer.js — redesigned 3-run reconciliation scene.

export const RECONCILE_STAGE_LIST = [
  "RECON_INTRO",
  "RUN_TGB_START",
  "RUN_TGB_RESULT",
  "TGB_EXCEPTION",
  "TGB_RESOLVED",
  "RUN_SGL_START",
  "RUN_SGL_RESULT",
  "GATE_RUN_BALANCED",
  "GATE_SOD",
  "GATE_TRIAL",
  "GATE_NO_EXCEPTIONS",
  "PERIOD_CLOSED",
];

export function indexOfReconcileStage(stage) {
  return RECONCILE_STAGE_LIST.indexOf(stage);
}

export function reconcileHasNextStage(reconcile) {
  if (!reconcile || reconcile.status === "SETTLED") return false;
  if (reconcile.stageIndex < 0) return true;
  return reconcile.stageIndex < RECONCILE_STAGE_LIST.length - 1;
}

export function reconcileHasPrevStage(reconcile) {
  return (reconcile?.events?.length || 0) > 1 && reconcile?.status !== "IDLE";
}

export const reconcileInitialState = {
  status: "IDLE",
  mode: "STEP",
  scenario: "BALANCED",
  currentStage: null,
  stageIndex: -1,
  reachedStages: {},
  events: [],
  tgbResult: null,
  tgbException: null,
  sglResult: null,
  gates: { runBalanced: false, sod: false, trial: false, noExceptions: false },
  startedAt: null,
  settledAt: null,
};

export function reconcileReducer(state = reconcileInitialState, action) {
  switch (action.type) {
    case "RECONCILE_RESET":
      return { ...reconcileInitialState, mode: state.mode, scenario: state.scenario };

    case "RECONCILE_SET_MODE":
      return { ...state, mode: action.mode };

    case "RECONCILE_SET_SCENARIO":
      return { ...reconcileInitialState, mode: state.mode, scenario: action.scenario };

    case "RECONCILE_START":
      return {
        ...reconcileInitialState,
        mode: action.mode || state.mode || "STEP",
        scenario: action.scenario || state.scenario || "BALANCED",
        status: "STEP_PAUSED",
        startedAt: Date.now(),
      };

    case "RECONCILE_STEP_PREV": {
      if ((state.events?.length || 0) <= 1) return state;
      const events = state.events.slice(0, -1);
      let s = reconcileReducer({ ...reconcileInitialState, mode: state.mode, scenario: state.scenario }, {
        type: "RECONCILE_START", mode: state.mode, scenario: state.scenario,
      });
      for (const evt of events) {
        s = reconcileReducer(s, { type: "RECONCILE_STAGE_EVENT", event: { stage: evt.stage, payload: evt.payload } });
      }
      return { ...s, status: "STEP_PAUSED" };
    }

    case "RECONCILE_STAGE_EVENT": {
      const { event } = action;
      const { stage, payload = {} } = event;
      const stageIndex = indexOfReconcileStage(stage);
      const next = {
        ...state,
        currentStage: stage,
        stageIndex,
        reachedStages: { ...state.reachedStages, [stage]: Date.now() },
        events: [...(state.events || []), { stage, payload, at: Date.now() }],
        status: "STEP_PAUSED",
      };

      switch (stage) {
        case "RUN_TGB_RESULT":
          return { ...next, tgbResult: payload };
        case "TGB_EXCEPTION":
          return { ...next, tgbException: payload };
        case "TGB_RESOLVED":
          return { ...next, tgbException: { ...state.tgbException, resolved: true } };
        case "RUN_SGL_RESULT":
          return { ...next, sglResult: payload };
        case "GATE_RUN_BALANCED":
          return { ...next, gates: { ...state.gates, runBalanced: true } };
        case "GATE_SOD":
          return { ...next, gates: { ...state.gates, runBalanced: true, sod: true } };
        case "GATE_TRIAL":
          return { ...next, gates: { ...state.gates, runBalanced: true, sod: true, trial: true } };
        case "GATE_NO_EXCEPTIONS":
          return { ...next, gates: { ...state.gates, runBalanced: true, sod: true, trial: true, noExceptions: true } };
        case "PERIOD_CLOSED":
          return { ...next, status: "SETTLED", settledAt: Date.now(), gates: { runBalanced: true, sod: true, trial: true, noExceptions: true } };
        default:
          return next;
      }
    }

    default:
      return state;
  }
}
