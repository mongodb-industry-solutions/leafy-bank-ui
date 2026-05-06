// engineReducer.js — 4-stage validation gate demo for the ENGINE scene.

export const ENGINE_STAGE_LIST = [
  "ENGINE_BALANCE_FAIL",
  "ENGINE_SOD_FAIL",
  "ENGINE_IDEMPOTENCY_FAIL",
  "ENGINE_COMMIT",
];

export function indexOfEngineStage(stage) {
  return ENGINE_STAGE_LIST.indexOf(stage);
}

export function engineHasNextStage(state) {
  if (state?.status === "SETTLED") return false;
  if (!state || state.stageIndex < 0) return true;
  return state.stageIndex < ENGINE_STAGE_LIST.length - 1;
}

export function engineHasPrevStage(state) {
  return (state?.events?.length || 0) > 1 && state?.status !== "IDLE";
}

export const engineInitialState = {
  status: "IDLE",
  mode: "STEP",
  currentStage: null,
  stageIndex: -1,
  reachedStages: {},
  events: [],
  startedAt: null,
  settledAt: null,
};

export function engineReducer(state = engineInitialState, action) {
  switch (action.type) {
    case "ENGINE_RESET":
      return { ...engineInitialState, mode: state.mode };

    case "ENGINE_SET_MODE":
      return { ...state, mode: action.mode };

    case "ENGINE_START":
      return {
        ...engineInitialState,
        mode: action.mode || state.mode || "STEP",
        status: "STEP_PAUSED",
        startedAt: Date.now(),
      };

    case "ENGINE_STEP_PREV": {
      if (!state.events || state.events.length <= 1) return state;
      const events = state.events.slice(0, -1);
      let s = engineReducer(engineInitialState, { type: "ENGINE_START", mode: state.mode });
      for (const evt of events) {
        s = engineReducer(s, { type: "ENGINE_STAGE_EVENT", event: { stage: evt.stage, payload: evt.payload } });
      }
      return { ...s, status: "STEP_PAUSED" };
    }

    case "ENGINE_STAGE_EVENT": {
      const { event } = action;
      const { stage, payload = {} } = event;
      const stageIndex = indexOfEngineStage(stage);
      const next = {
        ...state,
        currentStage: stage,
        stageIndex,
        reachedStages: { ...state.reachedStages, [stage]: Date.now() },
        events: [...(state.events || []), { stage, payload, at: Date.now() }],
        status: "STEP_PAUSED",
      };
      if (stage === "ENGINE_COMMIT") {
        next.status = "SETTLED";
        next.settledAt = Date.now();
      }
      return next;
    }

    default:
      return state;
  }
}
