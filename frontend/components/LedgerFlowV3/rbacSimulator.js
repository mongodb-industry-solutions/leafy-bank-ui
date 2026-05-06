export function buildRbacRun() {
  return {
    timeline: [
      { stage: "RBAC_ROLES",        payload: {} },
      { stage: "RBAC_BLAST_RADIUS", payload: {} },
      { stage: "RBAC_BREAKGLASS",   payload: {} },
      { stage: "RBAC_OCSF",         payload: {} },
      { stage: "RBAC_WORM",         payload: {} },
    ],
  };
}

export function runRbacMode(timeline, dispatch, mode = "STEP") {
  let cancelled = false, cursor = 0, autoHandles = [];
  const fire = (i) => { if (cancelled || i >= timeline.length) return; dispatch({ type: "RBAC_STAGE_EVENT", event: timeline[i] }); cursor = i + 1; };
  if (mode === "SLOW") autoHandles = timeline.map((_, i) => setTimeout(() => fire(i), i * 2000));
  return {
    next: () => { if (cancelled || cursor >= timeline.length) return; fire(cursor); },
    cancel: () => { cancelled = true; autoHandles.forEach(clearTimeout); autoHandles = []; },
  };
}
