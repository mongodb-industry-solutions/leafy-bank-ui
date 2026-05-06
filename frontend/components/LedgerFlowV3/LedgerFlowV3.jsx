"use client";

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { H1, Body } from "@leafygreen-ui/typography";
import Badge from "@leafygreen-ui/badge";
import Button from "@leafygreen-ui/button";
import Icon from "@leafygreen-ui/icon";
import Copyable from "@leafygreen-ui/copyable";
import { SegmentedControl, SegmentedControlOption } from "@leafygreen-ui/segmented-control";
import LeafygreenProvider from "@leafygreen-ui/leafygreen-provider";
import { MotionConfig, motion } from "motion/react";
import { SPRING } from "../LedgerFlow/motionConfig";

import { ledgerReducerV3, initialStateV3, hasNextStage, hasPrevStage, SCENES } from "./ledgerReducerV3";
import { reconcileHasNextStage, reconcileHasPrevStage, RECONCILE_STAGE_LIST } from "./reconcileReducer";
import { onboardingHasNextStage, onboardingHasPrevStage, ONBOARD_STAGE_LIST } from "./onboardingReducer";
import { erasureHasNextStage, erasureHasPrevStage, ERASURE_STAGE_LIST } from "./erasureReducer";
import { fanoutHasNextStage, fanoutHasPrevStage, FANOUT_STAGE_LIST } from "./fanoutReducer";
import { hardEdgeHasNextStage, hardEdgeHasPrevStage, HARD_EDGE_STAGE_LIST } from "./hardEdgeReducer";
import { buildPaymentRun, runMode } from "../LedgerFlow/simulator";
import { buildReconcileRun, runReconcileMode } from "./reconcileSimulator";
import { buildOnboardingRun, runOnboardingMode } from "./onboardingSimulator";
import { buildErasureRun, runErasureMode } from "./erasureSimulator";
import { buildFanoutRun, runFanoutMode } from "./fanoutSimulator";
import { buildHardEdgeRun, runHardEdgeMode } from "./hardEdgeSimulator";
import { FRIDA, BO, DEFAULT_PAYMENT } from "../LedgerFlow/ledgerFixtures";
import { useStepperKeys } from "../LedgerFlow/useStepperKeys";
import SceneCanvas from "./SceneCanvas";
import StageInterpreter from "../LedgerFlow/StageInterpreter";
import CollectionDrawerV3 from "./CollectionDrawerV3";
import AccountBalanceCards from "../LedgerFlow/AccountBalanceCards";
import { narrationFor } from "./stageNarrationV3";
import ScenePlaceholderInterpreter from "./ScenePlaceholderInterpreter";
import styles from "./LedgerFlowV3.module.css";

const POSTING_SCENE = "POSTING";
const RECONCILE_SCENE = "RECONCILE";
const ONBOARDING_SCENE = "ONBOARDING";
const ERASURE_SCENE = "ERASURE";
const FANOUT_SCENE = "FANOUT";
const HARD_EDGE_SCENE = "HARD_EDGE";

const LedgerFlowV3 = () => {
  const router = useRouter();
  const [state, dispatch] = useReducer(ledgerReducerV3, initialStateV3);

  // Posting scene runner refs
  const runnerRef = useRef(null);
  const runRef = useRef(null);

  // Reconcile scene runner refs
  const reconcileRunnerRef = useRef(null);
  const reconcileRunRef = useRef(null);

  // Onboarding scene runner refs
  const onboardRunnerRef = useRef(null);
  const onboardRunRef = useRef(null);

  // Erasure scene runner refs
  const erasureRunnerRef = useRef(null);
  const erasureRunRef = useRef(null);

  // Fanout scene runner refs
  const fanoutRunnerRef = useRef(null);
  const fanoutRunRef = useRef(null);

  // Hard Edge scene runner refs
  const hardEdgeRunnerRef = useRef(null);
  const hardEdgeRunRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const isPostingScene = state.scene === POSTING_SCENE;
  const isReconcileScene = state.scene === RECONCILE_SCENE;
  const isOnboardingScene = state.scene === ONBOARDING_SCENE;
  const isErasureScene = state.scene === ERASURE_SCENE;
  const isFanoutScene = state.scene === FANOUT_SCENE;
  const isHardEdgeScene = state.scene === HARD_EDGE_SCENE;

  const reconcile = state.reconcile;
  const reconcileStatus = reconcile?.status || "IDLE";
  const reconcileMode = reconcile?.mode || "STEP";

  // ─── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      runnerRef.current?.cancel?.();
      reconcileRunnerRef.current?.cancel?.();
      onboardRunnerRef.current?.cancel?.();
      erasureRunnerRef.current?.cancel?.();
      fanoutRunnerRef.current?.cancel?.();
      hardEdgeRunnerRef.current?.cancel?.();
    };
  }, []);

  // ─── Posting scene handlers ────────────────────────────────────────────────
  const handleSimulate = useCallback(() => {
    if (!isPostingScene) return;
    runnerRef.current?.cancel?.();
    const run = buildPaymentRun({
      from: FRIDA,
      to: BO,
      amount: DEFAULT_PAYMENT.amount,
      currency: DEFAULT_PAYMENT.currency,
      description: DEFAULT_PAYMENT.description,
    });
    runRef.current = run;
    dispatch({
      type: "START",
      from: FRIDA,
      to: BO,
      identifiers: run.identifiers,
      amount: DEFAULT_PAYMENT.amount,
      currency: DEFAULT_PAYMENT.currency,
      mode: state.mode,
    });
    runnerRef.current = runMode(run.timeline, dispatch, state.mode);
    if (state.mode === "STEP") {
      runnerRef.current.next();
    }
  }, [state.mode, isPostingScene]);

  const handleNext = useCallback(() => {
    if (!isPostingScene) return;
    if (state.status === "IDLE") { handleSimulate(); return; }
    if (state.status === "SETTLED") return;
    const timeline = runRef.current?.timeline;
    if (!timeline) return;
    const nextIdx = state.events?.length || 0;
    if (nextIdx >= timeline.length) return;
    runnerRef.current?.cancel?.();
    dispatch({ type: "STAGE_EVENT", event: timeline[nextIdx] });
    runnerRef.current = runMode(timeline.slice(nextIdx + 1), dispatch, "STEP");
  }, [isPostingScene, state.status, state.events?.length, handleSimulate]);

  const handlePrev = useCallback(() => {
    if (!isPostingScene) return;
    if (!hasPrevStage(state)) return;
    if (!runRef.current) return;
    runnerRef.current?.cancel?.();
    dispatch({ type: "STEP_PREV" });
  }, [state, isPostingScene]);

  const lastEventCountRef = useRef(0);
  useEffect(() => {
    const n = state.events?.length || 0;
    if (n < lastEventCountRef.current && runRef.current) {
      const remaining = runRef.current.timeline.slice(n);
      runnerRef.current?.cancel?.();
      runnerRef.current = runMode(remaining, dispatch, "STEP");
    }
    lastEventCountRef.current = n;
  }, [state.events?.length]);

  const handleReset = useCallback(() => {
    runnerRef.current?.cancel?.();
    runnerRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  const handleModeChange = useCallback((value) => {
    runnerRef.current?.cancel?.();
    runnerRef.current = null;
    dispatch({ type: "SET_MODE", mode: value });
  }, []);

  // ─── Reconcile scene handlers ──────────────────────────────────────────────
  const handleReconcileSimulate = useCallback(() => {
    if (!isReconcileScene) return;
    reconcileRunnerRef.current?.cancel?.();
    const { timeline } = buildReconcileRun();
    reconcileRunRef.current = { timeline };
    const mode = reconcileMode;
    dispatch({ type: "RECONCILE_START", mode });
    reconcileRunnerRef.current = runReconcileMode(timeline, dispatch, mode);
    if (mode === "STEP") {
      reconcileRunnerRef.current.next();
    }
  }, [isReconcileScene, reconcileMode]);

  const handleReconcileNext = useCallback(() => {
    if (!isReconcileScene) return;
    if (reconcileStatus === "IDLE") { handleReconcileSimulate(); return; }
    if (reconcileStatus === "SETTLED") return;
    const timeline = reconcileRunRef.current?.timeline;
    if (!timeline) return;
    const nextIdx = reconcile?.events?.length || 0;
    if (nextIdx >= timeline.length) return;
    reconcileRunnerRef.current?.cancel?.();
    dispatch({ type: "RECONCILE_STAGE_EVENT", event: timeline[nextIdx] });
    reconcileRunnerRef.current = runReconcileMode(timeline.slice(nextIdx + 1), dispatch, "STEP");
  }, [isReconcileScene, reconcileStatus, reconcile?.events?.length, handleReconcileSimulate]);

  const handleReconcilePrev = useCallback(() => {
    if (!isReconcileScene) return;
    if (!reconcileHasPrevStage(reconcile)) return;
    if (!reconcileRunRef.current) return;
    reconcileRunnerRef.current?.cancel?.();
    dispatch({ type: "RECONCILE_STEP_PREV" });
  }, [isReconcileScene, reconcileMode, reconcile]);

  const lastReconcileEventCountRef = useRef(0);
  useEffect(() => {
    const n = reconcile?.events?.length || 0;
    if (n < lastReconcileEventCountRef.current && reconcileRunRef.current) {
      const remaining = reconcileRunRef.current.timeline.slice(n);
      reconcileRunnerRef.current?.cancel?.();
      reconcileRunnerRef.current = runReconcileMode(remaining, dispatch, "STEP");
    }
    lastReconcileEventCountRef.current = n;
  }, [reconcile?.events?.length]);

  const handleReconcileReset = useCallback(() => {
    reconcileRunnerRef.current?.cancel?.();
    reconcileRunnerRef.current = null;
    reconcileRunRef.current = null;
    dispatch({ type: "RECONCILE_RESET" });
  }, []);

  const handleReconcileModeChange = useCallback((value) => {
    reconcileRunnerRef.current?.cancel?.();
    reconcileRunnerRef.current = null;
    dispatch({ type: "RECONCILE_SET_MODE", mode: value });
  }, []);

  // ─── Onboarding scene handlers ────────────────────────────────────────────
  const onboarding = state.onboarding;
  const onboardStatus = onboarding?.status || "IDLE";
  const onboardMode = onboarding?.mode || "STEP";

  const handleOnboardSimulate = useCallback(() => {
    if (!isOnboardingScene) return;
    onboardRunnerRef.current?.cancel?.();
    const { timeline } = buildOnboardingRun();
    onboardRunRef.current = { timeline };
    const mode = onboardMode;
    dispatch({ type: "ONBOARD_START", mode });
    onboardRunnerRef.current = runOnboardingMode(timeline, dispatch, mode);
    if (mode === "STEP") onboardRunnerRef.current.next();
  }, [isOnboardingScene, onboardMode]);

  const handleOnboardNext = useCallback(() => {
    if (!isOnboardingScene) return;
    if (onboardStatus === "IDLE") { handleOnboardSimulate(); return; }
    if (onboardStatus === "SETTLED") return;
    const timeline = onboardRunRef.current?.timeline;
    if (!timeline) return;
    const nextIdx = onboarding?.events?.length || 0;
    if (nextIdx >= timeline.length) return;
    onboardRunnerRef.current?.cancel?.();
    dispatch({ type: "ONBOARD_STAGE_EVENT", event: timeline[nextIdx] });
    onboardRunnerRef.current = runOnboardingMode(timeline.slice(nextIdx + 1), dispatch, "STEP");
  }, [isOnboardingScene, onboardStatus, onboarding?.events?.length, handleOnboardSimulate]);

  const handleOnboardPrev = useCallback(() => {
    if (!isOnboardingScene) return;
    if (!onboardingHasPrevStage(onboarding)) return;
    if (!onboardRunRef.current) return;
    onboardRunnerRef.current?.cancel?.();
    dispatch({ type: "ONBOARD_STEP_PREV" });
  }, [isOnboardingScene, onboardMode, onboarding]);

  const lastOnboardEventCountRef = useRef(0);
  useEffect(() => {
    const n = onboarding?.events?.length || 0;
    if (n < lastOnboardEventCountRef.current && onboardRunRef.current) {
      const remaining = onboardRunRef.current.timeline.slice(n);
      onboardRunnerRef.current?.cancel?.();
      onboardRunnerRef.current = runOnboardingMode(remaining, dispatch, "STEP");
    }
    lastOnboardEventCountRef.current = n;
  }, [onboarding?.events?.length]);

  const handleOnboardReset = useCallback(() => {
    onboardRunnerRef.current?.cancel?.();
    onboardRunnerRef.current = null;
    onboardRunRef.current = null;
    dispatch({ type: "ONBOARD_RESET" });
  }, []);

  const handleOnboardModeChange = useCallback((value) => {
    onboardRunnerRef.current?.cancel?.();
    onboardRunnerRef.current = null;
    dispatch({ type: "ONBOARD_SET_MODE", mode: value });
  }, []);

  // ─── Erasure scene handlers ───────────────────────────────────────────────
  const erasure = state.erasure;
  const erasureStatus = erasure?.status || "IDLE";
  const erasureMode = erasure?.mode || "STEP";

  const handleErasureSimulate = useCallback(() => {
    if (!isErasureScene) return;
    erasureRunnerRef.current?.cancel?.();
    const { timeline } = buildErasureRun();
    erasureRunRef.current = { timeline };
    const mode = erasureMode;
    dispatch({ type: "ERASURE_START", mode });
    erasureRunnerRef.current = runErasureMode(timeline, dispatch, mode);
    if (mode === "STEP") erasureRunnerRef.current.next();
  }, [isErasureScene, erasureMode]);

  const handleErasureNext = useCallback(() => {
    if (!isErasureScene) return;
    if (erasureStatus === "IDLE") { handleErasureSimulate(); return; }
    if (erasureStatus === "SETTLED") return;
    const timeline = erasureRunRef.current?.timeline;
    if (!timeline) return;
    const nextIdx = erasure?.events?.length || 0;
    if (nextIdx >= timeline.length) return;
    erasureRunnerRef.current?.cancel?.();
    dispatch({ type: "ERASURE_STAGE_EVENT", event: timeline[nextIdx] });
    erasureRunnerRef.current = runErasureMode(timeline.slice(nextIdx + 1), dispatch, "STEP");
  }, [isErasureScene, erasureStatus, erasure?.events?.length, handleErasureSimulate]);

  const handleErasurePrev = useCallback(() => {
    if (!isErasureScene) return;
    if (!erasureHasPrevStage(erasure)) return;
    if (!erasureRunRef.current) return;
    erasureRunnerRef.current?.cancel?.();
    dispatch({ type: "ERASURE_STEP_PREV" });
  }, [isErasureScene, erasureMode, erasure]);

  const lastErasureEventCountRef = useRef(0);
  useEffect(() => {
    const n = erasure?.events?.length || 0;
    if (n < lastErasureEventCountRef.current && erasureRunRef.current) {
      const remaining = erasureRunRef.current.timeline.slice(n);
      erasureRunnerRef.current?.cancel?.();
      erasureRunnerRef.current = runErasureMode(remaining, dispatch, "STEP");
    }
    lastErasureEventCountRef.current = n;
  }, [erasure?.events?.length]);

  const handleErasureReset = useCallback(() => {
    erasureRunnerRef.current?.cancel?.();
    erasureRunnerRef.current = null;
    erasureRunRef.current = null;
    dispatch({ type: "ERASURE_RESET" });
  }, []);

  const handleErasureModeChange = useCallback((value) => {
    erasureRunnerRef.current?.cancel?.();
    erasureRunnerRef.current = null;
    dispatch({ type: "ERASURE_SET_MODE", mode: value });
  }, []);

  // ─── Fanout scene handlers ────────────────────────────────────────────────
  const fanout = state.fanout;
  const fanoutStatus = fanout?.status || "IDLE";
  const fanoutMode = fanout?.mode || "STEP";

  const handleFanoutSimulate = useCallback(() => {
    if (!isFanoutScene) return;
    fanoutRunnerRef.current?.cancel?.();
    const { timeline } = buildFanoutRun();
    fanoutRunRef.current = { timeline };
    const mode = fanoutMode;
    dispatch({ type: "FANOUT_START", mode });
    fanoutRunnerRef.current = runFanoutMode(timeline, dispatch, mode);
    if (mode === "STEP") fanoutRunnerRef.current.next();
  }, [isFanoutScene, fanoutMode]);

  const handleFanoutNext = useCallback(() => {
    if (!isFanoutScene) return;
    if (fanoutStatus === "IDLE") { handleFanoutSimulate(); return; }
    if (fanoutStatus === "SETTLED") return;
    const timeline = fanoutRunRef.current?.timeline;
    if (!timeline) return;
    const nextIdx = fanout?.events?.length || 0;
    if (nextIdx >= timeline.length) return;
    fanoutRunnerRef.current?.cancel?.();
    dispatch({ type: "FANOUT_STAGE_EVENT", event: timeline[nextIdx] });
    fanoutRunnerRef.current = runFanoutMode(timeline.slice(nextIdx + 1), dispatch, "STEP");
  }, [isFanoutScene, fanoutStatus, fanout?.events?.length, handleFanoutSimulate]);

  const handleFanoutPrev = useCallback(() => {
    if (!isFanoutScene) return;
    if (!fanoutHasPrevStage(fanout)) return;
    if (!fanoutRunRef.current) return;
    fanoutRunnerRef.current?.cancel?.();
    dispatch({ type: "FANOUT_STEP_PREV" });
  }, [isFanoutScene, fanoutMode, fanout]);

  const lastFanoutEventCountRef = useRef(0);
  useEffect(() => {
    const n = fanout?.events?.length || 0;
    if (n < lastFanoutEventCountRef.current && fanoutRunRef.current) {
      const remaining = fanoutRunRef.current.timeline.slice(n);
      fanoutRunnerRef.current?.cancel?.();
      fanoutRunnerRef.current = runFanoutMode(remaining, dispatch, "STEP");
    }
    lastFanoutEventCountRef.current = n;
  }, [fanout?.events?.length]);

  const handleFanoutReset = useCallback(() => {
    fanoutRunnerRef.current?.cancel?.();
    fanoutRunnerRef.current = null;
    fanoutRunRef.current = null;
    dispatch({ type: "FANOUT_RESET" });
  }, []);

  const handleFanoutModeChange = useCallback((value) => {
    fanoutRunnerRef.current?.cancel?.();
    fanoutRunnerRef.current = null;
    dispatch({ type: "FANOUT_SET_MODE", mode: value });
  }, []);

  // ─── Hard Edge scene handlers ─────────────────────────────────────────────
  const hardEdge = state.hardEdge;
  const hardEdgeStatus = hardEdge?.status || "IDLE";
  const hardEdgeMode = hardEdge?.mode || "STEP";

  const handleHardEdgeSimulate = useCallback(() => {
    if (!isHardEdgeScene) return;
    hardEdgeRunnerRef.current?.cancel?.();
    const { timeline } = buildHardEdgeRun();
    hardEdgeRunRef.current = { timeline };
    const mode = hardEdgeMode;
    dispatch({ type: "HARD_EDGE_START", mode });
    hardEdgeRunnerRef.current = runHardEdgeMode(timeline, dispatch, mode);
    if (mode === "STEP") hardEdgeRunnerRef.current.next();
  }, [isHardEdgeScene, hardEdgeMode]);

  const handleHardEdgeNext = useCallback(() => {
    if (!isHardEdgeScene) return;
    if (hardEdgeStatus === "IDLE") { handleHardEdgeSimulate(); return; }
    if (hardEdgeStatus === "SETTLED") return;
    const timeline = hardEdgeRunRef.current?.timeline;
    if (!timeline) return;
    const nextIdx = hardEdge?.events?.length || 0;
    if (nextIdx >= timeline.length) return;
    hardEdgeRunnerRef.current?.cancel?.();
    dispatch({ type: "HARD_EDGE_STAGE_EVENT", event: timeline[nextIdx] });
    hardEdgeRunnerRef.current = runHardEdgeMode(timeline.slice(nextIdx + 1), dispatch, "STEP");
  }, [isHardEdgeScene, hardEdgeStatus, hardEdge?.events?.length, handleHardEdgeSimulate]);

  const handleHardEdgePrev = useCallback(() => {
    if (!isHardEdgeScene) return;
    if (!hardEdgeHasPrevStage(hardEdge)) return;
    if (!hardEdgeRunRef.current) return;
    hardEdgeRunnerRef.current?.cancel?.();
    dispatch({ type: "HARD_EDGE_STEP_PREV" });
  }, [isHardEdgeScene, hardEdgeMode, hardEdge]);

  const lastHardEdgeEventCountRef = useRef(0);
  useEffect(() => {
    const n = hardEdge?.events?.length || 0;
    if (n < lastHardEdgeEventCountRef.current && hardEdgeRunRef.current) {
      const remaining = hardEdgeRunRef.current.timeline.slice(n);
      hardEdgeRunnerRef.current?.cancel?.();
      hardEdgeRunnerRef.current = runHardEdgeMode(remaining, dispatch, "STEP");
    }
    lastHardEdgeEventCountRef.current = n;
  }, [hardEdge?.events?.length]);

  const handleHardEdgeReset = useCallback(() => {
    hardEdgeRunnerRef.current?.cancel?.();
    hardEdgeRunnerRef.current = null;
    hardEdgeRunRef.current = null;
    dispatch({ type: "HARD_EDGE_RESET" });
  }, []);

  const handleHardEdgeModeChange = useCallback((value) => {
    hardEdgeRunnerRef.current?.cancel?.();
    hardEdgeRunnerRef.current = null;
    dispatch({ type: "HARD_EDGE_SET_MODE", mode: value });
  }, []);

  // ─── Scene switch ──────────────────────────────────────────────────────────
  const handleSetScene = useCallback((sceneKey) => {
    runnerRef.current?.cancel?.();
    runnerRef.current = null;
    runRef.current = null;
    reconcileRunnerRef.current?.cancel?.();
    reconcileRunnerRef.current = null;
    reconcileRunRef.current = null;
    onboardRunnerRef.current?.cancel?.();
    onboardRunnerRef.current = null;
    onboardRunRef.current = null;
    erasureRunnerRef.current?.cancel?.();
    erasureRunnerRef.current = null;
    erasureRunRef.current = null;
    fanoutRunnerRef.current?.cancel?.();
    fanoutRunnerRef.current = null;
    fanoutRunRef.current = null;
    hardEdgeRunnerRef.current?.cancel?.();
    hardEdgeRunnerRef.current = null;
    hardEdgeRunRef.current = null;
    dispatch({ type: "SET_SCENE", scene: sceneKey });
  }, []);

  // ─── Keyboard stepping ─────────────────────────────────────────────────────
  useStepperKeys({
    onNext: handleNext,
    onPrev: handlePrev,
    enabled: isPostingScene && state.status === "STEP_PAUSED",
    enabledPrev: isPostingScene && hasPrevStage(state),
  });

  useStepperKeys({
    onNext: handleReconcileNext,
    onPrev: handleReconcilePrev,
    enabled: isReconcileScene && reconcileStatus === "STEP_PAUSED",
    enabledPrev: isReconcileScene && reconcileHasPrevStage(reconcile),
  });

  useStepperKeys({
    onNext: handleOnboardNext,
    onPrev: handleOnboardPrev,
    enabled: isOnboardingScene && onboardStatus === "STEP_PAUSED",
    enabledPrev: isOnboardingScene && onboardingHasPrevStage(onboarding),
  });

  useStepperKeys({
    onNext: handleErasureNext,
    onPrev: handleErasurePrev,
    enabled: isErasureScene && erasureStatus === "STEP_PAUSED",
    enabledPrev: isErasureScene && erasureHasPrevStage(erasure),
  });

  useStepperKeys({
    onNext: handleFanoutNext,
    onPrev: handleFanoutPrev,
    enabled: isFanoutScene && fanoutStatus === "STEP_PAUSED",
    enabledPrev: isFanoutScene && fanoutHasPrevStage(fanout),
  });

  useStepperKeys({
    onNext: handleHardEdgeNext,
    onPrev: handleHardEdgePrev,
    enabled: isHardEdgeScene && hardEdgeStatus === "STEP_PAUSED",
    enabledPrev: isHardEdgeScene && hardEdgeHasPrevStage(hardEdge),
  });

  // ─── Stage status label ────────────────────────────────────────────────────
  const stageStatus = useMemo(() => {
    if (isHardEdgeScene) {
      if (hardEdgeStatus === "IDLE") return "Ready";
      if (hardEdgeStatus === "SETTLED") {
        const elapsed =
          hardEdge.startedAt && hardEdge.settledAt
            ? ((hardEdge.settledAt - hardEdge.startedAt) / 1000).toFixed(2)
            : null;
        return elapsed ? `Settled · ${elapsed}s` : "Settled";
      }
      const idx = hardEdge.stageIndex >= 0 ? hardEdge.stageIndex + 1 : 0;
      return `Stage ${idx} of ${HARD_EDGE_STAGE_LIST.length}`;
    }
    if (isFanoutScene) {
      if (fanoutStatus === "IDLE") return "Ready";
      if (fanoutStatus === "SETTLED") {
        const elapsed =
          fanout.startedAt && fanout.settledAt
            ? ((fanout.settledAt - fanout.startedAt) / 1000).toFixed(2)
            : null;
        return elapsed ? `Settled · ${elapsed}s` : "Settled";
      }
      const idx = fanout.stageIndex >= 0 ? fanout.stageIndex + 1 : 0;
      return `Stage ${idx} of ${FANOUT_STAGE_LIST.length}`;
    }
    if (isErasureScene) {
      if (erasureStatus === "IDLE") return "Ready";
      if (erasureStatus === "SETTLED") {
        const elapsed =
          erasure.startedAt && erasure.settledAt
            ? ((erasure.settledAt - erasure.startedAt) / 1000).toFixed(2)
            : null;
        return elapsed ? `Settled · ${elapsed}s` : "Settled";
      }
      const idx = erasure.stageIndex >= 0 ? erasure.stageIndex + 1 : 0;
      return `Stage ${idx} of ${ERASURE_STAGE_LIST.length}`;
    }
    if (isOnboardingScene) {
      if (onboardStatus === "IDLE") return "Ready";
      if (onboardStatus === "SETTLED") {
        const elapsed =
          onboarding.startedAt && onboarding.settledAt
            ? ((onboarding.settledAt - onboarding.startedAt) / 1000).toFixed(2)
            : null;
        return elapsed ? `Settled · ${elapsed}s` : "Settled";
      }
      const idx = onboarding.stageIndex >= 0 ? onboarding.stageIndex + 1 : 0;
      return `Stage ${idx} of ${ONBOARD_STAGE_LIST.length}`;
    }
    if (isReconcileScene) {
      if (reconcileStatus === "IDLE") return "Ready";
      if (reconcileStatus === "SETTLED") {
        const elapsed =
          reconcile.startedAt && reconcile.settledAt
            ? ((reconcile.settledAt - reconcile.startedAt) / 1000).toFixed(2)
            : null;
        return elapsed ? `Settled · ${elapsed}s` : "Settled";
      }
      const idx = reconcile.stageIndex >= 0 ? reconcile.stageIndex + 1 : 0;
      return `Stage ${idx} of ${RECONCILE_STAGE_LIST.length}`;
    }
    if (!isPostingScene) return SCENES.find((s) => s.key === state.scene)?.label || state.scene;
    if (state.status === "IDLE") return "Ready";
    if (state.status === "SETTLED") {
      const elapsed =
        state.startedAt && state.settledAt
          ? ((state.settledAt - state.startedAt) / 1000).toFixed(2)
          : null;
      return elapsed ? `Settled · ${elapsed}s` : "Settled";
    }
    const idx = state.stageIndex >= 0 ? state.stageIndex + 1 : 0;
    return `Stage ${idx} of 9`;
  }, [isPostingScene, isReconcileScene, isOnboardingScene, isErasureScene, isFanoutScene, isHardEdgeScene, state.status, state.stageIndex, state.startedAt, state.settledAt, state.scene, reconcileStatus, reconcile, onboardStatus, onboarding, erasureStatus, erasure, fanoutStatus, fanout, hardEdgeStatus, hardEdge]);

  const canSimulate = isPostingScene && state.status === "IDLE";
  const canStep = isPostingScene && state.status !== "IDLE" && state.status !== "SETTLED" && hasNextStage(state);

  const canReconcileSimulate = isReconcileScene && reconcileStatus === "IDLE";
  const canReconcileStep = isReconcileScene && reconcileStatus !== "IDLE" && reconcileStatus !== "SETTLED" && reconcileHasNextStage(reconcile);

  const canOnboardSimulate = isOnboardingScene && onboardStatus === "IDLE";
  const canOnboardStep = isOnboardingScene && onboardStatus !== "IDLE" && onboardStatus !== "SETTLED" && onboardingHasNextStage(onboarding);

  const canErasureSimulate = isErasureScene && erasureStatus === "IDLE";
  const canErasureStep = isErasureScene && erasureStatus !== "IDLE" && erasureStatus !== "SETTLED" && erasureHasNextStage(erasure);

  const canFanoutSimulate = isFanoutScene && fanoutStatus === "IDLE";
  const canFanoutStep = isFanoutScene && fanoutStatus !== "IDLE" && fanoutStatus !== "SETTLED" && fanoutHasNextStage(fanout);

  const canHardEdgeSimulate = isHardEdgeScene && hardEdgeStatus === "IDLE";
  const canHardEdgeStep = isHardEdgeScene && hardEdgeStatus !== "IDLE" && hardEdgeStatus !== "SETTLED" && hardEdgeHasNextStage(hardEdge);

  return (
    <LeafygreenProvider darkMode={false}>
    <MotionConfig reducedMotion="user" transition={SPRING.default}>
      <style dangerouslySetInnerHTML={{
        __html: `dialog[data-lgid^="lg-drawer"]{width:min(1100px,96vw)!important;min-width:min(1100px,96vw)!important;max-width:96vw!important;}`
      }} />
      <div className={styles.page} data-lf-v3-route>

        {/* TOP BAR */}
        <header className={styles.topBar}>
          <div className={styles.titleBlock}>
            <div className={styles.titleRow}>
              <H1 className={styles.title}>Ledger Flow</H1>
              <Badge variant="green">v2</Badge>
              <Badge variant="blue">BIAN v14</Badge>
              <Badge variant="lightgray">{stageStatus}</Badge>
            </div>
          </div>

          <div className={styles.controls}>
            {/* Step hint — any scene paused */}
            {(
              (isPostingScene && canStep) ||
              (isOnboardingScene && canOnboardStep) ||
              (isErasureScene && canErasureStep) ||
              (isReconcileScene && canReconcileStep) ||
              (isFanoutScene && canFanoutStep) ||
              (isHardEdgeScene && canHardEdgeStep)
            ) && (
              <span className={styles.stepHint} aria-live="polite">
                <kbd className={styles.kbd}>←</kbd>
                <kbd className={styles.kbd}>→</kbd>
                <kbd className={styles.kbd}>Space</kbd>
                step
              </span>
            )}

            {/* Mode selector — posting */}
            {isPostingScene && (
              <SegmentedControl
                size="small"
                aria-label="Demo speed"
                value={state.mode}
                onChange={handleModeChange}
                className={styles.modeControl}
              >
                <SegmentedControlOption value="STEP">Step</SegmentedControlOption>
                <SegmentedControlOption value="SLOW">Slow</SegmentedControlOption>
              </SegmentedControl>
            )}

            {/* Mode selector — onboarding */}
            {isOnboardingScene && (
              <SegmentedControl
                size="small"
                aria-label="Onboarding demo speed"
                value={onboardMode}
                onChange={handleOnboardModeChange}
                className={styles.modeControl}
              >
                <SegmentedControlOption value="STEP">Step</SegmentedControlOption>
                <SegmentedControlOption value="SLOW">Slow</SegmentedControlOption>
              </SegmentedControl>
            )}

            {/* Mode selector — erasure */}
            {isErasureScene && (
              <SegmentedControl
                size="small"
                aria-label="Erasure demo speed"
                value={erasureMode}
                onChange={handleErasureModeChange}
                className={styles.modeControl}
              >
                <SegmentedControlOption value="STEP">Step</SegmentedControlOption>
                <SegmentedControlOption value="SLOW">Slow</SegmentedControlOption>
              </SegmentedControl>
            )}

            {/* Mode selector — reconcile */}
            {isReconcileScene && (
              <SegmentedControl
                size="small"
                aria-label="Reconcile demo speed"
                value={reconcileMode}
                onChange={handleReconcileModeChange}
                className={styles.modeControl}
              >
                <SegmentedControlOption value="STEP">Step</SegmentedControlOption>
                <SegmentedControlOption value="SLOW">Slow</SegmentedControlOption>
              </SegmentedControl>
            )}

            {/* Mode selector — fanout */}
            {isFanoutScene && (
              <SegmentedControl
                size="small"
                aria-label="Fanout demo speed"
                value={fanoutMode}
                onChange={handleFanoutModeChange}
                className={styles.modeControl}
              >
                <SegmentedControlOption value="STEP">Step</SegmentedControlOption>
                <SegmentedControlOption value="SLOW">Slow</SegmentedControlOption>
              </SegmentedControl>
            )}

            {/* Mode selector — hard edge */}
            {isHardEdgeScene && (
              <SegmentedControl
                size="small"
                aria-label="Hard Edge demo speed"
                value={hardEdgeMode}
                onChange={handleHardEdgeModeChange}
                className={styles.modeControl}
              >
                <SegmentedControlOption value="STEP">Step</SegmentedControlOption>
                <SegmentedControlOption value="SLOW">Slow</SegmentedControlOption>
              </SegmentedControl>
            )}

            <div className={styles.btnRow}>
              {/* Posting scene controls */}
              {isPostingScene ? (
                canSimulate ? (
                  <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                    <Button variant="primary" onClick={handleSimulate} leftGlyph={<Icon glyph="Play" />} size="small">
                      Simulate
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    {state.status !== "IDLE" && (
                      <>
                        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                          <Button
                            variant="default"
                            onClick={handlePrev}
                            disabled={!hasPrevStage(state)}
                            leftGlyph={<Icon glyph="ChevronLeft" />}
                            size="small"
                          >
                            Prev
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                          <Button
                            variant="primary"
                            onClick={handleNext}
                            disabled={!canStep}
                            rightGlyph={<Icon glyph="ChevronRight" />}
                            size="small"
                          >
                            Next
                          </Button>
                        </motion.div>
                      </>
                    )}
                    <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                      <Button variant="default" onClick={handleReset} leftGlyph={<Icon glyph="Refresh" />} size="small">
                        Reset
                      </Button>
                    </motion.div>
                  </>
                )
              ) : null}

              {/* Onboarding scene controls */}
              {isOnboardingScene ? (
                canOnboardSimulate ? (
                  <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                    <Button variant="primary" onClick={handleOnboardSimulate} leftGlyph={<Icon glyph="Play" />} size="small">
                      Simulate
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    {onboardStatus !== "IDLE" && (
                      <>
                        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                          <Button
                            variant="default"
                            onClick={handleOnboardPrev}
                            disabled={!onboardingHasPrevStage(onboarding)}
                            leftGlyph={<Icon glyph="ChevronLeft" />}
                            size="small"
                          >
                            Prev
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                          <Button
                            variant="primary"
                            onClick={handleOnboardNext}
                            disabled={!canOnboardStep}
                            rightGlyph={<Icon glyph="ChevronRight" />}
                            size="small"
                          >
                            Next
                          </Button>
                        </motion.div>
                      </>
                    )}
                    <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                      <Button variant="default" onClick={handleOnboardReset} leftGlyph={<Icon glyph="Refresh" />} size="small">
                        Reset
                      </Button>
                    </motion.div>
                  </>
                )
              ) : null}

              {/* Erasure scene controls */}
              {isErasureScene ? (
                canErasureSimulate ? (
                  <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                    <Button variant="primary" onClick={handleErasureSimulate} leftGlyph={<Icon glyph="Play" />} size="small">
                      Simulate
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    {erasureStatus !== "IDLE" && (
                      <>
                        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                          <Button
                            variant="default"
                            onClick={handleErasurePrev}
                            disabled={!erasureHasPrevStage(erasure)}
                            leftGlyph={<Icon glyph="ChevronLeft" />}
                            size="small"
                          >
                            Prev
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                          <Button
                            variant="primary"
                            onClick={handleErasureNext}
                            disabled={!canErasureStep}
                            rightGlyph={<Icon glyph="ChevronRight" />}
                            size="small"
                          >
                            Next
                          </Button>
                        </motion.div>
                      </>
                    )}
                    <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                      <Button variant="default" onClick={handleErasureReset} leftGlyph={<Icon glyph="Refresh" />} size="small">
                        Reset
                      </Button>
                    </motion.div>
                  </>
                )
              ) : null}

              {/* Reconcile scene controls */}
              {isReconcileScene ? (
                canReconcileSimulate ? (
                  <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                    <Button variant="primary" onClick={handleReconcileSimulate} leftGlyph={<Icon glyph="Play" />} size="small">
                      Simulate
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    {reconcileStatus !== "IDLE" && (
                      <>
                        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                          <Button
                            variant="default"
                            onClick={handleReconcilePrev}
                            disabled={!reconcileHasPrevStage(reconcile)}
                            leftGlyph={<Icon glyph="ChevronLeft" />}
                            size="small"
                          >
                            Prev
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                          <Button
                            variant="primary"
                            onClick={handleReconcileNext}
                            disabled={!canReconcileStep}
                            rightGlyph={<Icon glyph="ChevronRight" />}
                            size="small"
                          >
                            Next
                          </Button>
                        </motion.div>
                      </>
                    )}
                    <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                      <Button variant="default" onClick={handleReconcileReset} leftGlyph={<Icon glyph="Refresh" />} size="small">
                        Reset
                      </Button>
                    </motion.div>
                  </>
                )
              ) : null}

              {/* Fanout scene controls */}
              {isFanoutScene ? (
                canFanoutSimulate ? (
                  <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                    <Button variant="primary" onClick={handleFanoutSimulate} leftGlyph={<Icon glyph="Play" />} size="small">
                      Simulate
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    {fanoutStatus !== "IDLE" && (
                      <>
                        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                          <Button
                            variant="default"
                            onClick={handleFanoutPrev}
                            disabled={!fanoutHasPrevStage(fanout)}
                            leftGlyph={<Icon glyph="ChevronLeft" />}
                            size="small"
                          >
                            Prev
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                          <Button
                            variant="primary"
                            onClick={handleFanoutNext}
                            disabled={!canFanoutStep}
                            rightGlyph={<Icon glyph="ChevronRight" />}
                            size="small"
                          >
                            Next
                          </Button>
                        </motion.div>
                      </>
                    )}
                    <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                      <Button variant="default" onClick={handleFanoutReset} leftGlyph={<Icon glyph="Refresh" />} size="small">
                        Reset
                      </Button>
                    </motion.div>
                  </>
                )
              ) : null}

              {/* Hard Edge scene controls */}
              {isHardEdgeScene ? (
                canHardEdgeSimulate ? (
                  <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                    <Button variant="primary" onClick={handleHardEdgeSimulate} leftGlyph={<Icon glyph="Play" />} size="small">
                      Simulate
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    {hardEdgeStatus !== "IDLE" && (
                      <>
                        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                          <Button
                            variant="default"
                            onClick={handleHardEdgePrev}
                            disabled={!hardEdgeHasPrevStage(hardEdge)}
                            leftGlyph={<Icon glyph="ChevronLeft" />}
                            size="small"
                          >
                            Prev
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                          <Button
                            variant="primary"
                            onClick={handleHardEdgeNext}
                            disabled={!canHardEdgeStep}
                            rightGlyph={<Icon glyph="ChevronRight" />}
                            size="small"
                          >
                            Next
                          </Button>
                        </motion.div>
                      </>
                    )}
                    <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                      <Button variant="default" onClick={handleHardEdgeReset} leftGlyph={<Icon glyph="Refresh" />} size="small">
                        Reset
                      </Button>
                    </motion.div>
                  </>
                )
              ) : null}

              <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                <Button
                  variant="default"
                  onClick={() => setDrawerOpen(true)}
                  rightGlyph={<Icon glyph="Visibility" />}
                  size="small"
                >
                  Collections
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                <Button
                  variant="default"
                  onClick={() => router.push("/ledger-flow")}
                  leftGlyph={<Icon glyph="ChevronLeft" />}
                  size="small"
                >
                  v1
                </Button>
              </motion.div>
            </div>
          </div>
        </header>

        {/* SCENE STRIP */}
        <nav className={styles.sceneStrip} aria-label="Scenes">
          {SCENES.map((scene, i) => {
            const active = state.scene === scene.key;
            const done = !!state.scenesVisited[scene.key];
            return (
              <React.Fragment key={scene.key}>
                {i > 0 && <span className={styles.sceneChipDivider} aria-hidden>›</span>}
                <button
                  type="button"
                  className={`${styles.sceneChip} ${active ? styles.sceneChipActive : ""} ${done && !active ? styles.sceneChipDone : ""}`}
                  onClick={() => handleSetScene(scene.key)}
                  aria-current={active ? "true" : undefined}
                >
                  <span className={styles.sceneChipNum}>{scene.index + 1}</span>
                  {scene.label}
                  {scene.phase && !active && (
                    <Badge variant="lightgray">{scene.phase}</Badge>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* IDENTIFIER COPYABLES — only when POSTING scene has active identifiers */}
        {isPostingScene && state.identifiers.idempotencyKey && (
          <div className={styles.idRow}>
            {state.identifiers.journalId && (
              <Copyable label="journalId" size="small" className={styles.copyable}>
                {state.identifiers.journalId}
              </Copyable>
            )}
            <Copyable label="idempotencyKey" size="small" className={styles.copyable}>
              {state.identifiers.idempotencyKey}
            </Copyable>
            {state.identifiers.resumeToken && (
              <Copyable label="resumeToken" size="small" className={styles.copyable}>
                {state.identifiers.resumeToken}
              </Copyable>
            )}
          </div>
        )}
        {/* Spacer row when idRow is absent to maintain grid */}
        {!(isPostingScene && state.identifiers.idempotencyKey) && (
          <div style={{ height: 0 }} />
        )}

        {/* CANVAS */}
        <main className={styles.canvasBand}>
          <SceneCanvas scene={state.scene} state={state} />
        </main>

        {/* BALANCES — only visible during POSTING scene */}
        <section className={styles.balancesBand}>
          {isPostingScene && <AccountBalanceCards balances={state.balances} />}
        </section>

        {/* INTERPRETER */}
        <section className={styles.interpreterBand}>
          {isPostingScene
            ? <StageInterpreter state={state} onOpenDrawer={() => setDrawerOpen(true)} />
            : <ScenePlaceholderInterpreter content={narrationFor(state)} onOpenDrawer={() => setDrawerOpen(true)} />
          }
        </section>

        {/* COLLECTION DRAWER */}
        <CollectionDrawerV3 open={drawerOpen} setOpen={setDrawerOpen} />

        {/* BIAN footer strip */}
        <footer className={styles.bianStrip} aria-label="BIAN classification">
          <span>SD <strong>FinancialAccounting</strong></span>
          <span className={styles.sep}>·</span>
          <span>CR <strong>FinancialBookingLog</strong></span>
          <span className={styles.sep}>·</span>
          <span>BQ <strong>LedgerPosting</strong></span>
          <span className={styles.sep}>·</span>
          <span>Pattern <strong>Management</strong></span>
        </footer>
      </div>
    </MotionConfig>
    </LeafygreenProvider>
  );
};

export default LedgerFlowV3;
