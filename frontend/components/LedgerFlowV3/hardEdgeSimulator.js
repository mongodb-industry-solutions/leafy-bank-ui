// hardEdgeSimulator.js

export function buildHardEdgeRun() {
  return {
    timeline: [
      { stage: "HARD_EDGE_CONSUMER_OFFLINE", payload: {} },
      { stage: "HARD_EDGE_OPLOG_ROLLS",      payload: {} },
      { stage: "HARD_EDGE_RESUME_ATTEMPT",   payload: {} },
      { stage: "HARD_EDGE_ERROR_286",         payload: {} },
      { stage: "HARD_EDGE_WORM_RECOVERY",    payload: {} },
      { stage: "HARD_EDGE_CAUGHT_UP",        payload: {} },
    ],
  };
}

export function runHardEdgeMode(timeline, dispatch, mode = "STEP") {
  let cancelled = false, cursor = 0, autoHandles = [];
  const fire = (i) => { if (cancelled || i >= timeline.length) return; dispatch({ type: "HARD_EDGE_STAGE_EVENT", event: timeline[i] }); cursor = i + 1; };
  if (mode === "SLOW") autoHandles = timeline.map((_, i) => setTimeout(() => fire(i), i * 2000));
  return {
    next: () => { if (cancelled || cursor >= timeline.length) return; fire(cursor); },
    cancel: () => { cancelled = true; autoHandles.forEach(clearTimeout); autoHandles = []; },
  };
}
