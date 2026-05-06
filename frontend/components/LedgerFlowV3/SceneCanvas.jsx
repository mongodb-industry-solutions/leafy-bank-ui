"use client";

import React from "react";
import PostingCanvas from "./PostingCanvas";
import OnboardingCanvas from "./OnboardingCanvas";
import FanoutCanvas from "./FanoutCanvas";
import HardEdgeCanvas from "./HardEdgeCanvas";
import ReconcileCanvas from "./ReconcileCanvas";
import ErasureCanvas from "./ErasureCanvas";

const CANVAS_MAP = {
  POSTING:    PostingCanvas,
  ONBOARDING: OnboardingCanvas,
  FANOUT:     FanoutCanvas,
  HARD_EDGE:  HardEdgeCanvas,
  RECONCILE:  ReconcileCanvas,
  ERASURE:    ErasureCanvas,
};

export default function SceneCanvas({ scene, state }) {
  const Canvas = CANVAS_MAP[scene] || PostingCanvas;
  return <Canvas state={state} />;
}
