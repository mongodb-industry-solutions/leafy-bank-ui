export const ARCH_STAGE_LIST = [
  "ARCH_LAYERS",
  "ARCH_COLLECTIONS",
  "ARCH_ENFORCED",
  "ARCH_PRINCIPLES",
];

export function indexOfArchStage(stage) {
  return ARCH_STAGE_LIST.indexOf(stage);
}

export function archHasNextStage(state) {
  if (state?.status === "SETTLED") return false;
  if (!state || state.stageIndex < 0) return true;
  return state.stageIndex < ARCH_STAGE_LIST.length - 1;
}

export function archHasPrevStage(state) {
  return (state?.events?.length || 0) > 1 && state?.status !== "IDLE";
}

export const archInitialState = {
  status: "IDLE",
  mode: "STEP",
  currentStage: null,
  stageIndex: -1,
  reachedStages: {},
  events: [],
  startedAt: null,
  settledAt: null,
};

export function archReducer(state = archInitialState, action) {
  switch (action.type) {
    case "ARCH_RESET":
      return { ...archInitialState, mode: state.mode };
    case "ARCH_SET_MODE":
      return { ...state, mode: action.mode };
    case "ARCH_START":
      return {
        ...archInitialState,
        mode: action.mode || state.mode || "STEP",
        status: "STEP_PAUSED",
        startedAt: Date.now(),
      };
    case "ARCH_STEP_PREV": {
      if (!state.events || state.events.length <= 1) return state;
      const events = state.events.slice(0, -1);
      let s = archReducer(archInitialState, { type: "ARCH_START", mode: state.mode });
      for (const evt of events) {
        s = archReducer(s, { type: "ARCH_STAGE_EVENT", event: { stage: evt.stage, payload: evt.payload } });
      }
      return { ...s, status: "STEP_PAUSED" };
    }
    case "ARCH_STAGE_EVENT": {
      const { event } = action;
      const { stage, payload = {} } = event;
      const stageIndex = indexOfArchStage(stage);
      const next = {
        ...state,
        currentStage: stage,
        stageIndex,
        reachedStages: { ...state.reachedStages, [stage]: Date.now() },
        events: [...(state.events || []), { stage, payload, at: Date.now() }],
        status: "STEP_PAUSED",
      };
      if (stage === "ARCH_PRINCIPLES") {
        next.status = "SETTLED";
        next.settledAt = Date.now();
      }
      return next;
    }
    default:
      return state;
  }
}
