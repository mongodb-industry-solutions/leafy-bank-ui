export function buildArchRun() {
  return {
    timeline: [
      { stage: "ARCH_LAYERS",      payload: {} },
      { stage: "ARCH_COLLECTIONS", payload: {} },
      { stage: "ARCH_ENFORCED",    payload: {} },
      { stage: "ARCH_PRINCIPLES",  payload: {} },
    ],
  };
}

export function runArchMode(timeline, dispatch, mode = "STEP") {
  let cancelled = false, cursor = 0, autoHandles = [];
  const fire = (i) => { if (cancelled || i >= timeline.length) return; dispatch({ type: "ARCH_STAGE_EVENT", event: timeline[i] }); cursor = i + 1; };
  if (mode === "SLOW") autoHandles = timeline.map((_, i) => setTimeout(() => fire(i), i * 2000));
  return {
    next: () => { if (cancelled || cursor >= timeline.length) return; fire(cursor); },
    cancel: () => { cancelled = true; autoHandles.forEach(clearTimeout); autoHandles = []; },
  };
}
