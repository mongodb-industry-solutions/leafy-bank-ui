// reconcileReducer.js — state machine for the EOD reconciliation scene.

export const RECONCILE_STAGE_LIST = [
  "RECONCILE_RUN_TRIGGERED",
  "RECONCILE_SCANNING_SOURCE",
  "RECONCILE_SCANNING_TARGET",
  "RECONCILE_BALANCE_CHECK",
  "RECONCILE_RESULT_UNBALANCED",
  "RECONCILE_EXCEPTION_CREATED",
  "RECONCILE_INVESTIGATION_OPENED",
  "RECONCILE_CORRECTION_POSTED",
  "RECONCILE_RESOLVED",
];

export function indexOfReconcileStage(stage) {
  return RECONCILE_STAGE_LIST.indexOf(stage);
}

export const reconcileInitialState = {
  status: "IDLE",
  mode: "SLOW",
  currentStage: null,
  stageIndex: -1,
  reachedStages: {},
  events: [],
  run: null,
  exception: null,
  correctionJournal: null,
  startedAt: null,
  settledAt: null,
};

export function reconcileReducer(state, action) {
  switch (action.type) {
    case "RECONCILE_RESET":
      return { ...reconcileInitialState, mode: state.mode };

    case "RECONCILE_SET_MODE":
      return { ...state, mode: action.mode };

    case "RECONCILE_START":
      return {
        ...reconcileInitialState,
        mode: action.mode || state.mode || "STEP",
        status: (action.mode || state.mode) === "STEP" ? "STEP_PAUSED" : "AUTO_RUNNING",
        startedAt: Date.now(),
      };

    case "RECONCILE_STEP_PREV": {
      if ((state.events?.length || 0) <= 1) return state;
      const events = state.events.slice(0, -1);
      let s = reconcileReducer({ ...reconcileInitialState, mode: state.mode }, {
        type: "RECONCILE_START", mode: state.mode,
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
        status: state.mode === "STEP" ? "STEP_PAUSED" : "AUTO_RUNNING",
      };

      switch (stage) {
        case "RECONCILE_RUN_TRIGGERED":
          return { ...next, run: payload.run || null };
        case "RECONCILE_EXCEPTION_CREATED":
          return { ...next, exception: payload.exception || null };
        case "RECONCILE_CORRECTION_POSTED":
          return { ...next, correctionJournal: payload.journal || null };
        case "RECONCILE_RESOLVED":
          return { ...next, status: "SETTLED", settledAt: Date.now() };
        default:
          return next;
      }
    }

    default:
      return state;
  }
}

export function reconcileHasNextStage(reconcile) {
  if (!reconcile || reconcile.status === "SETTLED") return false;
  if (reconcile.stageIndex < 0) return true;
  return reconcile.stageIndex < RECONCILE_STAGE_LIST.length - 1;
}

export function reconcileHasPrevStage(reconcile) {
  return (reconcile?.events?.length || 0) > 1 && reconcile?.status !== "IDLE";
}
