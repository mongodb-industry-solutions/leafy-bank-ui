"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { SPRING } from "../LedgerFlow/motionConfig";
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

function SettledBadge({ nextLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.94 }}
      transition={SPRING.hero}
      style={{
        position: "absolute",
        bottom: 12,
        right: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 14px 5px 10px",
        borderRadius: 20,
        background: "#E3FCF7",
        border: "1.5px solid #00A35C",
        fontSize: 12,
        fontWeight: 600,
        color: "#00684A",
        fontFamily: "'Euclid Circular A', sans-serif",
        pointerEvents: "none",
        zIndex: 10,
        boxShadow: "0 2px 8px rgba(0, 104, 74, 0.14)",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#00A35C",
        color: "#fff",
        fontSize: 9,
        fontWeight: 700,
        flexShrink: 0,
      }}>✓</span>
      Scene complete
      {nextLabel && (
        <span style={{ color: "#3D7A61", fontWeight: 400 }}>
          — Next: {nextLabel}
        </span>
      )}
    </motion.div>
  );
}

export default function SceneCanvas({ scene, state, sceneStatus, nextSceneLabel }) {
  const Canvas = CANVAS_MAP[scene] || PostingCanvas;
  const isSettled = sceneStatus === "SETTLED";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", flex: 1 }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={scene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <Canvas state={state} />
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {isSettled && <SettledBadge nextLabel={nextSceneLabel} />}
      </AnimatePresence>
    </div>
  );
}
