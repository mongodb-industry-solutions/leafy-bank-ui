export const RBAC_STAGE_LIST = [
  "RBAC_ROLES",
  "RBAC_BLAST_RADIUS",
  "RBAC_BREAKGLASS",
  "RBAC_OCSF",
  "RBAC_WORM",
];

export function indexOfRbacStage(stage) {
  return RBAC_STAGE_LIST.indexOf(stage);
}

export function rbacHasNextStage(state) {
  if (state?.status === "SETTLED") return false;
  if (!state || state.stageIndex < 0) return true;
  return state.stageIndex < RBAC_STAGE_LIST.length - 1;
}

export function rbacHasPrevStage(state) {
  return (state?.events?.length || 0) > 1 && state?.status !== "IDLE";
}

export const rbacInitialState = {
  status: "IDLE",
  mode: "STEP",
  currentStage: null,
  stageIndex: -1,
  reachedStages: {},
  events: [],
  startedAt: null,
  settledAt: null,
};

export function rbacReducer(state = rbacInitialState, action) {
  switch (action.type) {
    case "RBAC_RESET":
      return { ...rbacInitialState, mode: state.mode };
    case "RBAC_SET_MODE":
      return { ...state, mode: action.mode };
    case "RBAC_START":
      return {
        ...rbacInitialState,
        mode: action.mode || state.mode || "STEP",
        status: "STEP_PAUSED",
        startedAt: Date.now(),
      };
    case "RBAC_STEP_PREV": {
      if (!state.events || state.events.length <= 1) return state;
      const events = state.events.slice(0, -1);
      let s = rbacReducer(rbacInitialState, { type: "RBAC_START", mode: state.mode });
      for (const evt of events) {
        s = rbacReducer(s, { type: "RBAC_STAGE_EVENT", event: { stage: evt.stage, payload: evt.payload } });
      }
      return { ...s, status: "STEP_PAUSED" };
    }
    case "RBAC_STAGE_EVENT": {
      const { event } = action;
      const { stage, payload = {} } = event;
      const stageIndex = indexOfRbacStage(stage);
      const next = {
        ...state,
        currentStage: stage,
        stageIndex,
        reachedStages: { ...state.reachedStages, [stage]: Date.now() },
        events: [...(state.events || []), { stage, payload, at: Date.now() }],
        status: "STEP_PAUSED",
      };
      if (stage === "RBAC_WORM") {
        next.status = "SETTLED";
        next.settledAt = Date.now();
      }
      return next;
    }
    default:
      return state;
  }
}
