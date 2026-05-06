// ledgerReducerV3.js — scene-level navigation + per-scene sub-reducers.

import {
  ledgerReducer,
  initialState as v2InitialState,
  hasNextStage,
  hasPrevStage,
} from "../LedgerFlow/ledgerReducer";
import { onboardingReducer, onboardingInitialState } from "./onboardingReducer";
import { erasureReducer, erasureInitialState } from "./erasureReducer";
import { fanoutReducer, fanoutInitialState } from "./fanoutReducer";
import { hardEdgeReducer, hardEdgeInitialState } from "./hardEdgeReducer";
import { engineReducer, engineInitialState } from "./engineReducer";
import { reconcileReducer, reconcileInitialState } from "./reconcileReducer";
import { archReducer, archInitialState } from "./archReducer";
import { rbacReducer, rbacInitialState } from "./rbacReducer";

// ENGINE is intentionally not a standalone scene — engine-reconcile (Pacioli /
// SoD / idempotency gates) is part of POSTING, fired before the GL journal
// commits. RECONCILE remains as the detective EOD reconciliation scene.
export const SCENES = [
  { key: "ONBOARDING", label: "Onboarding",   index: 0 },
  { key: "ARCH",       label: "Architecture", index: 1 },
  { key: "POSTING",    label: "The Posting",  index: 2 },
  { key: "RBAC",       label: "RBAC",         index: 3 },
  { key: "FANOUT",     label: "Fan-out",      index: 4 },
  { key: "HARD_EDGE",  label: "Hard Edge",    index: 5 },
  { key: "RECONCILE",  label: "Reconcile",    index: 6 },
  { key: "ERASURE",    label: "Erasure",      index: 7 },
];

export const initialStateV3 = {
  ...v2InitialState,
  scene: "ONBOARDING",
  sceneIndex: 0,
  scenesVisited: {},
  onboarding: onboardingInitialState,
  arch: archInitialState,
  rbac: rbacInitialState,
  erasure: erasureInitialState,
  fanout: fanoutInitialState,
  hardEdge: hardEdgeInitialState,
  engine: engineInitialState,
  reconcile: reconcileInitialState,
};

export function ledgerReducerV3(state, action) {
  switch (action.type) {
    case "SET_SCENE": {
      const idx = SCENES.findIndex((s) => s.key === action.scene);
      return {
        ...v2InitialState,
        mode: state.mode,
        scenario: state.scenario || "FX_ROUNDING",
        txType: state.txType || "DOMESTIC",
        scene: action.scene,
        sceneIndex: idx >= 0 ? idx : 1,
        scenesVisited: { ...state.scenesVisited },
        onboarding: onboardingInitialState,
        arch: archInitialState,
        rbac: rbacInitialState,
        erasure: erasureInitialState,
        fanout: fanoutInitialState,
        hardEdge: hardEdgeInitialState,
        engine: engineInitialState,
        reconcile: reconcileInitialState,
      };
    }

    case "SET_SCENARIO":
      return { ...state, scenario: action.scenario };

    case "SET_TX_TYPE":
      return { ...state, txType: action.txType };

    case "ONBOARD_RESET":
    case "ONBOARD_SET_MODE":
    case "ONBOARD_START":
    case "ONBOARD_STEP_PREV":
    case "ONBOARD_STAGE_EVENT": {
      const nextOnboarding = onboardingReducer(state.onboarding || onboardingInitialState, action);
      const isDone =
        action.type === "ONBOARD_STAGE_EVENT" &&
        action.event?.stage === "ONBOARD_QUERY_DEMO";
      return {
        ...state,
        onboarding: nextOnboarding,
        scenesVisited: isDone
          ? { ...state.scenesVisited, [state.scene]: true }
          : state.scenesVisited,
      };
    }

    case "ERASURE_RESET":
    case "ERASURE_SET_MODE":
    case "ERASURE_START":
    case "ERASURE_STEP_PREV":
    case "ERASURE_STAGE_EVENT": {
      const nextErasure = erasureReducer(state.erasure || erasureInitialState, action);
      const isDone =
        action.type === "ERASURE_STAGE_EVENT" &&
        action.event?.stage === "ERASURE_AUDIT_LOGGED";
      return {
        ...state,
        erasure: nextErasure,
        scenesVisited: isDone
          ? { ...state.scenesVisited, [state.scene]: true }
          : state.scenesVisited,
      };
    }

    case "FANOUT_RESET":
    case "FANOUT_SET_MODE":
    case "FANOUT_START":
    case "FANOUT_STEP_PREV":
    case "FANOUT_STAGE_EVENT": {
      const nextFanout = fanoutReducer(state.fanout || fanoutInitialState, action);
      const isDone =
        action.type === "FANOUT_STAGE_EVENT" &&
        action.event?.stage === "FANOUT_DLQ";
      return {
        ...state,
        fanout: nextFanout,
        scenesVisited: isDone
          ? { ...state.scenesVisited, [state.scene]: true }
          : state.scenesVisited,
      };
    }

    case "HARD_EDGE_RESET":
    case "HARD_EDGE_SET_MODE":
    case "HARD_EDGE_START":
    case "HARD_EDGE_STEP_PREV":
    case "HARD_EDGE_STAGE_EVENT": {
      const nextHardEdge = hardEdgeReducer(state.hardEdge || hardEdgeInitialState, action);
      const isDone =
        action.type === "HARD_EDGE_STAGE_EVENT" &&
        action.event?.stage === "HARD_EDGE_CAUGHT_UP";
      return {
        ...state,
        hardEdge: nextHardEdge,
        scenesVisited: isDone
          ? { ...state.scenesVisited, [state.scene]: true }
          : state.scenesVisited,
      };
    }

    case "RECONCILE_RESET":
    case "RECONCILE_SET_MODE":
    case "RECONCILE_SET_SCENARIO":
    case "RECONCILE_START":
    case "RECONCILE_STEP_PREV":
    case "RECONCILE_STAGE_EVENT": {
      const nextReconcile = reconcileReducer(state.reconcile || reconcileInitialState, action);
      const isDone =
        action.type === "RECONCILE_STAGE_EVENT" &&
        action.event?.stage === "PERIOD_CLOSED";
      return {
        ...state,
        reconcile: nextReconcile,
        scenesVisited: isDone
          ? { ...state.scenesVisited, [state.scene]: true }
          : state.scenesVisited,
      };
    }

    case "ARCH_RESET":
    case "ARCH_SET_MODE":
    case "ARCH_START":
    case "ARCH_STEP_PREV":
    case "ARCH_STAGE_EVENT": {
      const nextArch = archReducer(state.arch || archInitialState, action);
      const isDone =
        action.type === "ARCH_STAGE_EVENT" &&
        action.event?.stage === "ARCH_PRINCIPLES";
      return {
        ...state,
        arch: nextArch,
        scenesVisited: isDone
          ? { ...state.scenesVisited, [state.scene]: true }
          : state.scenesVisited,
      };
    }

    case "RBAC_RESET":
    case "RBAC_SET_MODE":
    case "RBAC_START":
    case "RBAC_STEP_PREV":
    case "RBAC_STAGE_EVENT": {
      const nextRbac = rbacReducer(state.rbac || rbacInitialState, action);
      const isDone =
        action.type === "RBAC_STAGE_EVENT" &&
        action.event?.stage === "RBAC_WORM";
      return {
        ...state,
        rbac: nextRbac,
        scenesVisited: isDone
          ? { ...state.scenesVisited, [state.scene]: true }
          : state.scenesVisited,
      };
    }

    case "ENGINE_RESET":
    case "ENGINE_SET_MODE":
    case "ENGINE_START":
    case "ENGINE_STEP_PREV":
    case "ENGINE_STAGE_EVENT": {
      const nextEngine = engineReducer(state.engine || engineInitialState, action);
      const isDone =
        action.type === "ENGINE_STAGE_EVENT" &&
        action.event?.stage === "ENGINE_COMMIT";
      return {
        ...state,
        engine: nextEngine,
        scenesVisited: isDone
          ? { ...state.scenesVisited, [state.scene]: true }
          : state.scenesVisited,
      };
    }

    default: {
      const v2Result = ledgerReducer(state, action);
      return {
        ...v2Result,
        scene: state.scene,
        sceneIndex: state.sceneIndex,
        scenesVisited:
          action.type === "STAGE_EVENT" && action.event?.stage === "SETTLED"
            ? { ...state.scenesVisited, [state.scene]: true }
            : state.scenesVisited,
        onboarding: state.onboarding || onboardingInitialState,
        arch: state.arch || archInitialState,
        rbac: state.rbac || rbacInitialState,
        erasure: state.erasure || erasureInitialState,
        fanout: state.fanout || fanoutInitialState,
        hardEdge: state.hardEdge || hardEdgeInitialState,
        engine: state.engine || engineInitialState,
        reconcile: state.reconcile || reconcileInitialState,
      };
    }
  }
}

export { hasNextStage, hasPrevStage };
