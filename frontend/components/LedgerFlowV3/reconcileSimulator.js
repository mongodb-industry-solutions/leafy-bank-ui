// reconcileSimulator.js — generates the reconciliation event timeline.
// Mirrors v2 simulator.js structure but dispatches RECONCILE_STAGE_EVENT.

import { RECONCILE_RUN, RECONCILE_EXCEPTION, CORRECTION_JOURNAL } from "./reconcileFixtures";

export function buildReconcileRun() {
  const timeline = [
    { stage: "RECONCILE_RUN_TRIGGERED",    payload: { run: RECONCILE_RUN } },
    { stage: "RECONCILE_SCANNING_SOURCE",  payload: {} },
    { stage: "RECONCILE_SCANNING_TARGET",  payload: {} },
    { stage: "RECONCILE_BALANCE_CHECK",    payload: {} },
    { stage: "RECONCILE_RESULT_UNBALANCED", payload: { breakAmount: 1.00 } },
    { stage: "RECONCILE_EXCEPTION_CREATED", payload: { exception: RECONCILE_EXCEPTION } },
    { stage: "RECONCILE_INVESTIGATION_OPENED", payload: {} },
    { stage: "RECONCILE_CORRECTION_POSTED", payload: { journal: CORRECTION_JOURNAL } },
    { stage: "RECONCILE_RESOLVED",         payload: {} },
  ];
  return { timeline };
}

export function runReconcileMode(timeline, dispatch, mode = "STEP") {
  let cancelled = false;
  let cursor = 0;
  let autoHandles = [];

  const fire = (i) => {
    if (cancelled || i >= timeline.length) return;
    dispatch({ type: "RECONCILE_STAGE_EVENT", event: timeline[i] });
    cursor = i + 1;
  };

  if (mode === "SLOW") {
    const STEP_MS = 2000;
    autoHandles = timeline.map((_, i) => setTimeout(() => fire(i), i * STEP_MS));
  }

  const next = () => {
    if (cancelled || cursor >= timeline.length) return;
    fire(cursor);
  };

  const cancel = () => {
    cancelled = true;
    autoHandles.forEach(clearTimeout);
    autoHandles = [];
  };

  return { next, cancel };
}
