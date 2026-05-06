// onboardingSimulator.js — builds the onboarding event timeline.

import { FRIDA_CUSTOMER_DOC, FRIDA_DEK } from "./onboardingFixtures";

export function buildOnboardingRun() {
  const timeline = [
    { stage: "ONBOARD_KYC_CAPTURED",    payload: {} },
    { stage: "ONBOARD_DEK_GENERATED",   payload: {} },
    { stage: "ONBOARD_DEK_WRAPPED",     payload: { dek: FRIDA_DEK } },
    { stage: "ONBOARD_FIELDS_ENCRYPTED", payload: {} },
    { stage: "ONBOARD_CUSTOMER_WRITTEN", payload: { customer: FRIDA_CUSTOMER_DOC } },
    { stage: "ONBOARD_QUERY_DEMO",       payload: {} },
  ];
  return { timeline };
}

export function runOnboardingMode(timeline, dispatch, mode = "STEP") {
  let cancelled = false;
  let cursor = 0;
  let autoHandles = [];

  const fire = (i) => {
    if (cancelled || i >= timeline.length) return;
    dispatch({ type: "ONBOARD_STAGE_EVENT", event: timeline[i] });
    cursor = i + 1;
  };

  if (mode === "SLOW") {
    const STEP_MS = 5000;
    autoHandles = timeline.map((_, i) => setTimeout(() => fire(i), i * STEP_MS));
  }

  const next = () => {
    if (mode !== "STEP" || cancelled || cursor >= timeline.length) return;
    fire(cursor);
  };

  const cancel = () => {
    cancelled = true;
    autoHandles.forEach(clearTimeout);
    autoHandles = [];
  };

  return { next, cancel };
}
