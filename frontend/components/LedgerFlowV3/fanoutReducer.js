// fanoutReducer.js — state machine for the CDC fan-out scene.

export const FANOUT_STAGE_LIST = [
  "FANOUT_JOURNAL_COMMITTED",
  "FANOUT_STREAM_OPENED",
  "FANOUT_EVENT_RECEIVED",
  "FANOUT_CONSUMER_BALANCE",
  "FANOUT_CONSUMER_FRAUD",
  "FANOUT_CONSUMER_WORM",
];

export function indexOfFanoutStage(stage) {
  return FANOUT_STAGE_LIST.indexOf(stage);
}

export const fanoutInitialState = {
  status: "IDLE", mode: "SLOW", currentStage: null, stageIndex: -1,
  reachedStages: {}, events: [], startedAt: null, settledAt: null,
};

export function fanoutReducer(state, action) {
  switch (action.type) {
    case "FANOUT_RESET":
      return { ...fanoutInitialState, mode: state.mode };
    case "FANOUT_SET_MODE":
      return { ...state, mode: action.mode };
    case "FANOUT_START":
      return {
        ...fanoutInitialState,
        mode: action.mode || state.mode || "STEP",
        status: (action.mode || state.mode) === "STEP" ? "STEP_PAUSED" : "AUTO_RUNNING",
        startedAt: Date.now(),
      };
    case "FANOUT_STEP_PREV": {
      if ((state.events?.length || 0) <= 1) return state;
      const events = state.events.slice(0, -1);
      let s = fanoutReducer({ ...fanoutInitialState, mode: state.mode }, { type: "FANOUT_START", mode: state.mode });
      for (const evt of events) {
        s = fanoutReducer(s, { type: "FANOUT_STAGE_EVENT", event: { stage: evt.stage, payload: evt.payload } });
      }
      return { ...s, status: "STEP_PAUSED" };
    }
    case "FANOUT_STAGE_EVENT": {
      const { stage, payload = {} } = action.event;
      const stageIndex = indexOfFanoutStage(stage);
      const next = {
        ...state, currentStage: stage, stageIndex,
        reachedStages: { ...state.reachedStages, [stage]: Date.now() },
        events: [...(state.events || []), { stage, payload, at: Date.now() }],
        status: state.mode === "STEP" ? "STEP_PAUSED" : "AUTO_RUNNING",
      };
      if (stage === "FANOUT_CONSUMER_WORM") return { ...next, status: "SETTLED", settledAt: Date.now() };
      return next;
    }
    default: return state;
  }
}

export function fanoutHasNextStage(f) {
  if (!f || f.status === "SETTLED") return false;
  if (f.stageIndex < 0) return true;
  return f.stageIndex < FANOUT_STAGE_LIST.length - 1;
}
export function fanoutHasPrevStage(f) {
  return (f?.events?.length || 0) > 1 && f?.status !== "IDLE";
}
