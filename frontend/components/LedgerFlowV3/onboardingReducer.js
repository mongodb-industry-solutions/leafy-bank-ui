// onboardingReducer.js — state machine for the QE onboarding scene.

export const ONBOARD_STAGE_LIST = [
  "ONBOARD_KYC_CAPTURED",
  "ONBOARD_DEK_GENERATED",
  "ONBOARD_DEK_WRAPPED",
  "ONBOARD_FIELDS_ENCRYPTED",
  "ONBOARD_CUSTOMER_WRITTEN",
  "ONBOARD_QUERY_DEMO",
];

export function indexOfOnboardStage(stage) {
  return ONBOARD_STAGE_LIST.indexOf(stage);
}

export const onboardingInitialState = {
  status: "IDLE",
  mode: "STEP",
  currentStage: null,
  stageIndex: -1,
  reachedStages: {},
  events: [],
  customerDoc: null,
  dekDoc: null,
  startedAt: null,
  settledAt: null,
};

export function onboardingReducer(state, action) {
  switch (action.type) {
    case "ONBOARD_RESET":
      return { ...onboardingInitialState, mode: state.mode };

    case "ONBOARD_SET_MODE":
      return { ...state, mode: action.mode };

    case "ONBOARD_START":
      return {
        ...onboardingInitialState,
        mode: action.mode || state.mode || "STEP",
        status: (action.mode || state.mode) === "STEP" ? "STEP_PAUSED" : "AUTO_RUNNING",
        startedAt: Date.now(),
      };

    case "ONBOARD_STEP_PREV": {
      if ((state.events?.length || 0) <= 1) return state;
      const events = state.events.slice(0, -1);
      let s = onboardingReducer({ ...onboardingInitialState, mode: state.mode }, {
        type: "ONBOARD_START", mode: state.mode,
      });
      for (const evt of events) {
        s = onboardingReducer(s, { type: "ONBOARD_STAGE_EVENT", event: { stage: evt.stage, payload: evt.payload } });
      }
      return { ...s, status: "STEP_PAUSED" };
    }

    case "ONBOARD_STAGE_EVENT": {
      const { event } = action;
      const { stage, payload = {} } = event;
      const stageIndex = indexOfOnboardStage(stage);
      const next = {
        ...state,
        currentStage: stage,
        stageIndex,
        reachedStages: { ...state.reachedStages, [stage]: Date.now() },
        events: [...(state.events || []), { stage, payload, at: Date.now() }],
        status: state.mode === "STEP" ? "STEP_PAUSED" : "AUTO_RUNNING",
      };
      switch (stage) {
        case "ONBOARD_DEK_WRAPPED":
          return { ...next, dekDoc: payload.dek || null };
        case "ONBOARD_CUSTOMER_WRITTEN":
          return { ...next, customerDoc: payload.customer || null };
        case "ONBOARD_QUERY_DEMO":
          return { ...next, status: "SETTLED", settledAt: Date.now() };
        default:
          return next;
      }
    }

    default:
      return state;
  }
}

export function onboardingHasNextStage(ob) {
  if (!ob || ob.status === "SETTLED") return false;
  if (ob.stageIndex < 0) return true;
  return ob.stageIndex < ONBOARD_STAGE_LIST.length - 1;
}

export function onboardingHasPrevStage(ob) {
  return (ob?.events?.length || 0) > 1 && ob?.status !== "IDLE";
}
