// hardEdgeReducer.js — state machine for the ChangeStreamHistoryLost scene.

export const HARD_EDGE_STAGE_LIST = [
  "HARD_EDGE_CONSUMER_OFFLINE",
  "HARD_EDGE_OPLOG_ROLLS",
  "HARD_EDGE_RESUME_ATTEMPT",
  "HARD_EDGE_ERROR_286",
  "HARD_EDGE_WORM_RECOVERY",
  "HARD_EDGE_CAUGHT_UP",
];

export function indexOfHardEdgeStage(stage) {
  return HARD_EDGE_STAGE_LIST.indexOf(stage);
}

export const hardEdgeInitialState = {
  status: "IDLE", mode: "STEP", currentStage: null, stageIndex: -1,
  reachedStages: {}, events: [], startedAt: null, settledAt: null,
};

export function hardEdgeReducer(state, action) {
  switch (action.type) {
    case "HARD_EDGE_RESET":
      return { ...hardEdgeInitialState, mode: state.mode };
    case "HARD_EDGE_SET_MODE":
      return { ...state, mode: action.mode };
    case "HARD_EDGE_START":
      return {
        ...hardEdgeInitialState,
        mode: action.mode || state.mode || "STEP",
        status: (action.mode || state.mode) === "STEP" ? "STEP_PAUSED" : "AUTO_RUNNING",
        startedAt: Date.now(),
      };
    case "HARD_EDGE_STEP_PREV": {
      if ((state.events?.length || 0) <= 1) return state;
      const events = state.events.slice(0, -1);
      let s = hardEdgeReducer({ ...hardEdgeInitialState, mode: state.mode }, { type: "HARD_EDGE_START", mode: state.mode });
      for (const evt of events) {
        s = hardEdgeReducer(s, { type: "HARD_EDGE_STAGE_EVENT", event: { stage: evt.stage, payload: evt.payload } });
      }
      return { ...s, status: "STEP_PAUSED" };
    }
    case "HARD_EDGE_STAGE_EVENT": {
      const { stage, payload = {} } = action.event;
      const stageIndex = indexOfHardEdgeStage(stage);
      const next = {
        ...state, currentStage: stage, stageIndex,
        reachedStages: { ...state.reachedStages, [stage]: Date.now() },
        events: [...(state.events || []), { stage, payload, at: Date.now() }],
        status: state.mode === "STEP" ? "STEP_PAUSED" : "AUTO_RUNNING",
      };
      if (stage === "HARD_EDGE_CAUGHT_UP") return { ...next, status: "SETTLED", settledAt: Date.now() };
      return next;
    }
    default: return state;
  }
}

export function hardEdgeHasNextStage(h) {
  if (!h || h.status === "SETTLED") return false;
  if (h.stageIndex < 0) return true;
  return h.stageIndex < HARD_EDGE_STAGE_LIST.length - 1;
}
export function hardEdgeHasPrevStage(h) {
  return (h?.events?.length || 0) > 1 && h?.status !== "IDLE";
}
