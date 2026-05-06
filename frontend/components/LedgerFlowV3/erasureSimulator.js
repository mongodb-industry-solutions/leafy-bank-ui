// erasureSimulator.js — builds the GDPR erasure event timeline.

import { ERASURE_AUDIT_LOG } from "./erasureFixtures";

export function buildErasureRun() {
  const timeline = [
    { stage: "ERASURE_REQUESTED",          payload: {} },
    { stage: "ERASURE_DEK_LOCATED",        payload: {} },
    { stage: "ERASURE_DEK_DELETED",        payload: {} },
    { stage: "ERASURE_CIPHERTEXT_ORPHANED", payload: {} },
    { stage: "ERASURE_QUERY_ATTEMPT",      payload: {} },
    { stage: "ERASURE_AUDIT_LOGGED",       payload: { auditLog: ERASURE_AUDIT_LOG } },
  ];
  return { timeline };
}

export function runErasureMode(timeline, dispatch, mode = "STEP") {
  let cancelled = false;
  let cursor = 0;
  let autoHandles = [];

  const fire = (i) => {
    if (cancelled || i >= timeline.length) return;
    dispatch({ type: "ERASURE_STAGE_EVENT", event: timeline[i] });
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
