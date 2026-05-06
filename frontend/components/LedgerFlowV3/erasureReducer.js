// erasureReducer.js — state machine for the GDPR crypto-shredding scene.

export const ERASURE_STAGE_LIST = [
  "ERASURE_REQUESTED",
  "ERASURE_DEK_LOCATED",
  "ERASURE_DEK_DELETED",
  "ERASURE_CIPHERTEXT_ORPHANED",
  "ERASURE_QUERY_ATTEMPT",
  "ERASURE_AUDIT_LOGGED",
];

export function indexOfErasureStage(stage) {
  return ERASURE_STAGE_LIST.indexOf(stage);
}

export const erasureInitialState = {
  status: "IDLE",
  mode: "SLOW",
  currentStage: null,
  stageIndex: -1,
  reachedStages: {},
  events: [],
  auditLog: null,
  startedAt: null,
  settledAt: null,
};

export function erasureReducer(state, action) {
  switch (action.type) {
    case "ERASURE_RESET":
      return { ...erasureInitialState, mode: state.mode };

    case "ERASURE_SET_MODE":
      return { ...state, mode: action.mode };

    case "ERASURE_START":
      return {
        ...erasureInitialState,
        mode: action.mode || state.mode || "STEP",
        status: (action.mode || state.mode) === "STEP" ? "STEP_PAUSED" : "AUTO_RUNNING",
        startedAt: Date.now(),
      };

    case "ERASURE_STEP_PREV": {
      if ((state.events?.length || 0) <= 1) return state;
      const events = state.events.slice(0, -1);
      let s = erasureReducer({ ...erasureInitialState, mode: state.mode }, {
        type: "ERASURE_START", mode: state.mode,
      });
      for (const evt of events) {
        s = erasureReducer(s, { type: "ERASURE_STAGE_EVENT", event: { stage: evt.stage, payload: evt.payload } });
      }
      return { ...s, status: "STEP_PAUSED" };
    }

    case "ERASURE_STAGE_EVENT": {
      const { event } = action;
      const { stage, payload = {} } = event;
      const stageIndex = indexOfErasureStage(stage);
      const next = {
        ...state,
        currentStage: stage,
        stageIndex,
        reachedStages: { ...state.reachedStages, [stage]: Date.now() },
        events: [...(state.events || []), { stage, payload, at: Date.now() }],
        status: state.mode === "STEP" ? "STEP_PAUSED" : "AUTO_RUNNING",
      };
      switch (stage) {
        case "ERASURE_AUDIT_LOGGED":
          return { ...next, auditLog: payload.auditLog || null, status: "SETTLED", settledAt: Date.now() };
        default:
          return next;
      }
    }

    default:
      return state;
  }
}

export function erasureHasNextStage(er) {
  if (!er || er.status === "SETTLED") return false;
  if (er.stageIndex < 0) return true;
  return er.stageIndex < ERASURE_STAGE_LIST.length - 1;
}

export function erasureHasPrevStage(er) {
  return (er?.events?.length || 0) > 1 && er?.status !== "IDLE";
}
