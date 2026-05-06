"use client";

import React from "react";
import PostingCanvas from "./PostingCanvas";
import OnboardingCanvas from "./OnboardingCanvas";
import FanoutCanvas from "./FanoutCanvas";
import HardEdgeCanvas from "./HardEdgeCanvas";
import ErasureCanvas from "./ErasureCanvas";
import EngineCanvas from "./EngineCanvas";
import ReconcileCanvas from "./ReconcileCanvas";
import ArchCanvas from "./ArchCanvas";
import RbacCanvas from "./RbacCanvas";

const CANVAS_MAP = {
  POSTING:    PostingCanvas,
  ONBOARDING: OnboardingCanvas,
  ARCH:       ArchCanvas,
  RBAC:       RbacCanvas,
  ENGINE:     EngineCanvas,
  FANOUT:     FanoutCanvas,
  HARD_EDGE:  HardEdgeCanvas,
  RECONCILE:  ReconcileCanvas,
  ERASURE:    ErasureCanvas,
};

export default function SceneCanvas({ scene, state }) {
  const Canvas = CANVAS_MAP[scene] || PostingCanvas;
  return <Canvas state={state} />;
}
