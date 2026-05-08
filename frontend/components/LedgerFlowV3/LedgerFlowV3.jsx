"use client";

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { H1, Body } from "@leafygreen-ui/typography";
import Badge from "@leafygreen-ui/badge";
import Button from "@leafygreen-ui/button";
import Tooltip from "@leafygreen-ui/tooltip";
import Icon from "@leafygreen-ui/icon";
import Copyable from "@leafygreen-ui/copyable";

import LeafygreenProvider from "@leafygreen-ui/leafygreen-provider";
import { MotionConfig, motion } from "motion/react";
import { SPRING } from "../LedgerFlow/motionConfig";

import { ledgerReducerV3, initialStateV3, hasNextStage, hasPrevStage, SCENES } from "./ledgerReducerV3";
import { onboardingHasNextStage, onboardingHasPrevStage, ONBOARD_STAGE_LIST } from "./onboardingReducer";
import { erasureHasNextStage, erasureHasPrevStage, ERASURE_STAGE_LIST } from "./erasureReducer";
import { fanoutHasNextStage, fanoutHasPrevStage, FANOUT_STAGE_LIST } from "./fanoutReducer";
import { hardEdgeHasNextStage, hardEdgeHasPrevStage, HARD_EDGE_STAGE_LIST } from "./hardEdgeReducer";
import { engineHasNextStage, engineHasPrevStage, ENGINE_STAGE_LIST } from "./engineReducer";
import { reconcileHasNextStage, reconcileHasPrevStage, RECONCILE_STAGE_LIST } from "./reconcileReducer";
import { archHasNextStage, archHasPrevStage, ARCH_STAGE_LIST } from "./archReducer";
import { rbacHasNextStage, rbacHasPrevStage, RBAC_STAGE_LIST } from "./rbacReducer";
import { buildArchRun, runArchMode } from "./archSimulator";
import { buildRbacRun, runRbacMode } from "./rbacSimulator";
import { STAGE_LIST } from "../LedgerFlow/stageNarration";
import { buildPaymentRun, runMode } from "../LedgerFlow/simulator";
import { buildOnboardingRun, runOnboardingMode } from "./onboardingSimulator";
import { buildErasureRun, runErasureMode } from "./erasureSimulator";
import { buildFanoutRun, runFanoutMode } from "./fanoutSimulator";
import { buildHardEdgeRun, runHardEdgeMode } from "./hardEdgeSimulator";
import { buildEngineRun, runEngineMode } from "./engineSimulator";
import { buildReconcileRun, runReconcileMode } from "./reconcileSimulator";
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
const ONBOARDING_SCENE = "ONBOARDING";
const ARCH_SCENE = "ARCH";
const RBAC_SCENE = "RBAC";
const ERASURE_SCENE = "ERASURE";
const FANOUT_SCENE = "FANOUT";
const HARD_EDGE_SCENE = "HARD_EDGE";
const ENGINE_SCENE = "ENGINE";
const RECONCILE_SCENE = "RECONCILE";

const LedgerFlowV3 = () => {
  const router = useRouter();
  const [state, dispatch] = useReducer(ledgerReducerV3, initialStateV3);

  // Posting scene runner refs
  const runnerRef = useRef(null);
  const runRef = useRef(null);

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

  // Engine scene runner refs
  const engineRunnerRef = useRef(null);
  const engineRunRef = useRef(null);

  // Reconcile scene runner refs
  const reconcileRunnerRef = useRef(null);
  const reconcileRunRef = useRef(null);

  // Arch scene runner refs
  const archRunnerRef = useRef(null);
  const archRunRef = useRef(null);

  // Rbac scene runner refs
  const rbacRunnerRef = useRef(null);
  const rbacRunRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const isPostingScene = state.scene === POSTING_SCENE;
  const isOnboardingScene = state.scene === ONBOARDING_SCENE;
  const isArchScene = state.scene === ARCH_SCENE;
  const isRbacScene = state.scene === RBAC_SCENE;
  const isErasureScene = state.scene === ERASURE_SCENE;
  const isFanoutScene = state.scene === FANOUT_SCENE;
  const isHardEdgeScene = state.scene === HARD_EDGE_SCENE;
  const isEngineScene = state.scene === ENGINE_SCENE;
  const isReconcileScene = state.scene === RECONCILE_SCENE;

  const scenario = state.scenario || "FX_ROUNDING";
  const txType = state.txType || "DOMESTIC";
  // Keep refs so startSceneInStepMode (deps=[]) can read current values
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;
  const txTypeRef = useRef(txType);
  txTypeRef.current = txType;

  // ─── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      runnerRef.current?.cancel?.();
      onboardRunnerRef.current?.cancel?.();
      erasureRunnerRef.current?.cancel?.();
      fanoutRunnerRef.current?.cancel?.();
      hardEdgeRunnerRef.current?.cancel?.();
      engineRunnerRef.current?.cancel?.();
      reconcileRunnerRef.current?.cancel?.();
      archRunnerRef.current?.cancel?.();
      rbacRunnerRef.current?.cancel?.();
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
      scenario: scenarioRef.current,
      txType: txTypeRef.current,
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
      scenario: scenarioRef.current,
      txType: txTypeRef.current,
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

  // ─── Global scenario selector handler ─────────────────────────────────────
  const handleSetScenario = useCallback((s) => {
    if (state.status !== "IDLE" && isPostingScene) return;
    dispatch({ type: "SET_SCENARIO", scenario: s });
  }, [state.status, isPostingScene]);

  const handleSetTxType = useCallback((t) => {
    if (state.status !== "IDLE" && isPostingScene) return;
    dispatch({ type: "SET_TX_TYPE", txType: t });
  }, [state.status, isPostingScene]);

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

  // ─── Engine scene handlers ────────────────────────────────────────────────
  const engine = state.engine;
  const engineStatus = engine?.status || "IDLE";
  const engineMode = engine?.mode || "STEP";

  const handleEngineSimulate = useCallback(() => {
    if (!isEngineScene) return;
    engineRunnerRef.current?.cancel?.();
    const { timeline } = buildEngineRun();
    engineRunRef.current = { timeline };
    dispatch({ type: "ENGINE_START", mode: engineMode });
    engineRunnerRef.current = runEngineMode(timeline, dispatch, engineMode);
    if (engineMode === "STEP") engineRunnerRef.current.next();
  }, [isEngineScene, engineMode]);

  const handleEngineNext = useCallback(() => {
    if (!isEngineScene) return;
    if (engineStatus === "IDLE") { handleEngineSimulate(); return; }
    if (engineStatus === "SETTLED") return;
    const timeline = engineRunRef.current?.timeline;
    if (!timeline) return;
    const nextIdx = engine?.events?.length || 0;
    if (nextIdx >= timeline.length) return;
    engineRunnerRef.current?.cancel?.();
    dispatch({ type: "ENGINE_STAGE_EVENT", event: timeline[nextIdx] });
    engineRunnerRef.current = runEngineMode(timeline.slice(nextIdx + 1), dispatch, "STEP");
  }, [isEngineScene, engineStatus, engine?.events?.length, handleEngineSimulate]);

  const handleEnginePrev = useCallback(() => {
    if (!isEngineScene) return;
    if (!engineHasPrevStage(engine) || !engineRunRef.current) return;
    engineRunnerRef.current?.cancel?.();
    dispatch({ type: "ENGINE_STEP_PREV" });
  }, [isEngineScene, engineMode, engine]);

  const lastEngineEventCountRef = useRef(0);
  useEffect(() => {
    const n = engine?.events?.length || 0;
    if (n < lastEngineEventCountRef.current && engineRunRef.current) {
      const remaining = engineRunRef.current.timeline.slice(n);
      engineRunnerRef.current?.cancel?.();
      engineRunnerRef.current = runEngineMode(remaining, dispatch, "STEP");
    }
    lastEngineEventCountRef.current = n;
  }, [engine?.events?.length]);

  const handleEngineReset = useCallback(() => {
    engineRunnerRef.current?.cancel?.();
    engineRunnerRef.current = null;
    engineRunRef.current = null;
    dispatch({ type: "ENGINE_RESET" });
  }, []);

  const handleEngineModeChange = useCallback((value) => {
    engineRunnerRef.current?.cancel?.();
    engineRunnerRef.current = null;
    dispatch({ type: "ENGINE_SET_MODE", mode: value });
  }, []);

  // ─── Reconcile scene handlers ─────────────────────────────────────────────
  const reconcile = state.reconcile;
  const reconcileStatus = reconcile?.status || "IDLE";
  const reconcileMode = reconcile?.mode || "STEP";
  const reconcileScenario = reconcile?.scenario || "BALANCED";
  const reconcileScenarioRef = useRef(reconcileScenario);
  reconcileScenarioRef.current = reconcileScenario;

  const handleReconcileSimulate = useCallback(() => {
    if (!isReconcileScene) return;
    reconcileRunnerRef.current?.cancel?.();
    const { timeline } = buildReconcileRun({ scenario: reconcileScenarioRef.current });
    reconcileRunRef.current = { timeline };
    dispatch({ type: "RECONCILE_START", mode: reconcileMode, scenario: reconcileScenarioRef.current });
    reconcileRunnerRef.current = runReconcileMode(timeline, dispatch, reconcileMode);
    if (reconcileMode === "STEP") reconcileRunnerRef.current.next();
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
    if (!reconcileHasPrevStage(reconcile) || !reconcileRunRef.current) return;
    reconcileRunnerRef.current?.cancel?.();
    dispatch({ type: "RECONCILE_STEP_PREV" });
  }, [isReconcileScene, reconcile]);

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

  const handleSetReconcileScenario = useCallback((s) => {
    if (reconcileStatus !== "IDLE" && isReconcileScene) return;
    dispatch({ type: "RECONCILE_SET_SCENARIO", scenario: s });
  }, [reconcileStatus, isReconcileScene]);

  // ─── Arch scene handlers ──────────────────────────────────────────────────
  const arch = state.arch;
  const archStatus = arch?.status || "IDLE";
  const archMode = arch?.mode || "STEP";

  const handleArchSimulate = useCallback(() => {
    if (!isArchScene) return;
    archRunnerRef.current?.cancel?.();
    const { timeline } = buildArchRun();
    archRunRef.current = { timeline };
    dispatch({ type: "ARCH_START", mode: archMode });
    archRunnerRef.current = runArchMode(timeline, dispatch, archMode);
    if (archMode === "STEP") archRunnerRef.current.next();
  }, [isArchScene, archMode]);

  const handleArchNext = useCallback(() => {
    if (!isArchScene) return;
    if (archStatus === "IDLE") { handleArchSimulate(); return; }
    if (archStatus === "SETTLED") return;
    const timeline = archRunRef.current?.timeline;
    if (!timeline) return;
    const nextIdx = arch?.events?.length || 0;
    if (nextIdx >= timeline.length) return;
    archRunnerRef.current?.cancel?.();
    dispatch({ type: "ARCH_STAGE_EVENT", event: timeline[nextIdx] });
    archRunnerRef.current = runArchMode(timeline.slice(nextIdx + 1), dispatch, "STEP");
  }, [isArchScene, archStatus, arch?.events?.length, handleArchSimulate]);

  const handleArchPrev = useCallback(() => {
    if (!isArchScene) return;
    if (!archHasPrevStage(arch) || !archRunRef.current) return;
    archRunnerRef.current?.cancel?.();
    dispatch({ type: "ARCH_STEP_PREV" });
  }, [isArchScene, arch]);

  const lastArchEventCountRef = useRef(0);
  useEffect(() => {
    const n = arch?.events?.length || 0;
    if (n < lastArchEventCountRef.current && archRunRef.current) {
      const remaining = archRunRef.current.timeline.slice(n);
      archRunnerRef.current?.cancel?.();
      archRunnerRef.current = runArchMode(remaining, dispatch, "STEP");
    }
    lastArchEventCountRef.current = n;
  }, [arch?.events?.length]);

  const handleArchReset = useCallback(() => {
    archRunnerRef.current?.cancel?.();
    archRunnerRef.current = null;
    archRunRef.current = null;
    dispatch({ type: "ARCH_RESET" });
  }, []);

  const handleArchModeChange = useCallback((value) => {
    archRunnerRef.current?.cancel?.();
    archRunnerRef.current = null;
    dispatch({ type: "ARCH_SET_MODE", mode: value });
  }, []);

  // ─── Rbac scene handlers ──────────────────────────────────────────────────
  const rbac = state.rbac;
  const rbacStatus = rbac?.status || "IDLE";
  const rbacMode = rbac?.mode || "STEP";

  const handleRbacSimulate = useCallback(() => {
    if (!isRbacScene) return;
    rbacRunnerRef.current?.cancel?.();
    const { timeline } = buildRbacRun();
    rbacRunRef.current = { timeline };
    dispatch({ type: "RBAC_START", mode: rbacMode });
    rbacRunnerRef.current = runRbacMode(timeline, dispatch, rbacMode);
    if (rbacMode === "STEP") rbacRunnerRef.current.next();
  }, [isRbacScene, rbacMode]);

  const handleRbacNext = useCallback(() => {
    if (!isRbacScene) return;
    if (rbacStatus === "IDLE") { handleRbacSimulate(); return; }
    if (rbacStatus === "SETTLED") return;
    const timeline = rbacRunRef.current?.timeline;
    if (!timeline) return;
    const nextIdx = rbac?.events?.length || 0;
    if (nextIdx >= timeline.length) return;
    rbacRunnerRef.current?.cancel?.();
    dispatch({ type: "RBAC_STAGE_EVENT", event: timeline[nextIdx] });
    rbacRunnerRef.current = runRbacMode(timeline.slice(nextIdx + 1), dispatch, "STEP");
  }, [isRbacScene, rbacStatus, rbac?.events?.length, handleRbacSimulate]);

  const handleRbacPrev = useCallback(() => {
    if (!isRbacScene) return;
    if (!rbacHasPrevStage(rbac) || !rbacRunRef.current) return;
    rbacRunnerRef.current?.cancel?.();
    dispatch({ type: "RBAC_STEP_PREV" });
  }, [isRbacScene, rbac]);

  const lastRbacEventCountRef = useRef(0);
  useEffect(() => {
    const n = rbac?.events?.length || 0;
    if (n < lastRbacEventCountRef.current && rbacRunRef.current) {
      const remaining = rbacRunRef.current.timeline.slice(n);
      rbacRunnerRef.current?.cancel?.();
      rbacRunnerRef.current = runRbacMode(remaining, dispatch, "STEP");
    }
    lastRbacEventCountRef.current = n;
  }, [rbac?.events?.length]);

  const handleRbacReset = useCallback(() => {
    rbacRunnerRef.current?.cancel?.();
    rbacRunnerRef.current = null;
    rbacRunRef.current = null;
    dispatch({ type: "RBAC_RESET" });
  }, []);

  const handleRbacModeChange = useCallback((value) => {
    rbacRunnerRef.current?.cancel?.();
    rbacRunnerRef.current = null;
    dispatch({ type: "RBAC_SET_MODE", mode: value });
  }, []);

  // ─── Cancel + clear all runners ───────────────────────────────────────────
  const cancelAll = useCallback(() => {
    runnerRef.current?.cancel?.(); runnerRef.current = null; runRef.current = null;
    onboardRunnerRef.current?.cancel?.(); onboardRunnerRef.current = null; onboardRunRef.current = null;
    erasureRunnerRef.current?.cancel?.(); erasureRunnerRef.current = null; erasureRunRef.current = null;
    fanoutRunnerRef.current?.cancel?.(); fanoutRunnerRef.current = null; fanoutRunRef.current = null;
    hardEdgeRunnerRef.current?.cancel?.(); hardEdgeRunnerRef.current = null; hardEdgeRunRef.current = null;
    engineRunnerRef.current?.cancel?.(); engineRunnerRef.current = null; engineRunRef.current = null;
    reconcileRunnerRef.current?.cancel?.(); reconcileRunnerRef.current = null; reconcileRunRef.current = null;
    archRunnerRef.current?.cancel?.(); archRunnerRef.current = null; archRunRef.current = null;
    rbacRunnerRef.current?.cancel?.(); rbacRunnerRef.current = null; rbacRunRef.current = null;
  }, []);

  // ─── Scene switch ──────────────────────────────────────────────────────────
  const handleSetScene = useCallback((sceneKey) => {
    cancelAll();
    dispatch({ type: "SET_SCENE", scene: sceneKey });
  }, [cancelAll]);

  // ─── Start a scene in STEP mode and fire its first stage ──────────────────
  const startSceneInStepMode = useCallback((sceneKey) => {
    switch (sceneKey) {
      case "ONBOARDING": {
        const { timeline } = buildOnboardingRun();
        onboardRunRef.current = { timeline };
        dispatch({ type: "ONBOARD_START", mode: "STEP" });
        dispatch({ type: "ONBOARD_STAGE_EVENT", event: timeline[0] });
        onboardRunnerRef.current = runOnboardingMode(timeline.slice(1), dispatch, "STEP");
        break;
      }
      case "POSTING": {
        const run = buildPaymentRun({ from: FRIDA, to: BO, amount: DEFAULT_PAYMENT.amount, currency: DEFAULT_PAYMENT.currency, description: DEFAULT_PAYMENT.description, scenario: scenarioRef.current, txType: txTypeRef.current });
        runRef.current = run;
        dispatch({ type: "START", from: FRIDA, to: BO, identifiers: run.identifiers, amount: DEFAULT_PAYMENT.amount, currency: DEFAULT_PAYMENT.currency, mode: "STEP", scenario: scenarioRef.current, txType: txTypeRef.current });
        dispatch({ type: "STAGE_EVENT", event: run.timeline[0] });
        runnerRef.current = runMode(run.timeline.slice(1), dispatch, "STEP");
        break;
      }
      case "FANOUT": {
        const { timeline: ft } = buildFanoutRun();
        fanoutRunRef.current = { timeline: ft };
        dispatch({ type: "FANOUT_START", mode: "STEP" });
        dispatch({ type: "FANOUT_STAGE_EVENT", event: ft[0] });
        fanoutRunnerRef.current = runFanoutMode(ft.slice(1), dispatch, "STEP");
        break;
      }
      case "HARD_EDGE": {
        const { timeline: ht } = buildHardEdgeRun();
        hardEdgeRunRef.current = { timeline: ht };
        dispatch({ type: "HARD_EDGE_START", mode: "STEP" });
        dispatch({ type: "HARD_EDGE_STAGE_EVENT", event: ht[0] });
        hardEdgeRunnerRef.current = runHardEdgeMode(ht.slice(1), dispatch, "STEP");
        break;
      }
      case "ENGINE": {
        const { timeline: engt } = buildEngineRun();
        engineRunRef.current = { timeline: engt };
        dispatch({ type: "ENGINE_START", mode: "STEP" });
        dispatch({ type: "ENGINE_STAGE_EVENT", event: engt[0] });
        engineRunnerRef.current = runEngineMode(engt.slice(1), dispatch, "STEP");
        break;
      }
      case "RECONCILE": {
        const { timeline: rect } = buildReconcileRun({ scenario: reconcileScenarioRef.current });
        reconcileRunRef.current = { timeline: rect };
        dispatch({ type: "RECONCILE_START", mode: "STEP", scenario: reconcileScenarioRef.current });
        dispatch({ type: "RECONCILE_STAGE_EVENT", event: rect[0] });
        reconcileRunnerRef.current = runReconcileMode(rect.slice(1), dispatch, "STEP");
        break;
      }
      case "ERASURE": {
        const { timeline: et } = buildErasureRun();
        erasureRunRef.current = { timeline: et };
        dispatch({ type: "ERASURE_START", mode: "STEP" });
        dispatch({ type: "ERASURE_STAGE_EVENT", event: et[0] });
        erasureRunnerRef.current = runErasureMode(et.slice(1), dispatch, "STEP");
        break;
      }
      case "ARCH": {
        const { timeline: at } = buildArchRun();
        archRunRef.current = { timeline: at };
        dispatch({ type: "ARCH_START", mode: "STEP" });
        dispatch({ type: "ARCH_STAGE_EVENT", event: at[0] });
        archRunnerRef.current = runArchMode(at.slice(1), dispatch, "STEP");
        break;
      }
      case "RBAC": {
        const { timeline: rt } = buildRbacRun();
        rbacRunRef.current = { timeline: rt };
        dispatch({ type: "RBAC_START", mode: "STEP" });
        dispatch({ type: "RBAC_STAGE_EVENT", event: rt[0] });
        rbacRunnerRef.current = runRbacMode(rt.slice(1), dispatch, "STEP");
        break;
      }
      default: break;
    }
  }, []);

  // ─── Global Next — advances one stage, crossing scene boundaries ──────────
  const handleGlobalNext = useCallback(() => {
    const scene = state.scene;
    const sceneIdx = state.sceneIndex;

    let currentStatus, currentEvents, currentTimeline, stageEventType, sceneRunnerRef, sceneRunnerFn;
    switch (scene) {
      case "ONBOARDING":
        currentStatus = onboarding?.status || "IDLE"; currentEvents = onboarding?.events;
        currentTimeline = onboardRunRef.current?.timeline; stageEventType = "ONBOARD_STAGE_EVENT";
        sceneRunnerRef = onboardRunnerRef; sceneRunnerFn = runOnboardingMode; break;
      case "POSTING":
        currentStatus = state.status; currentEvents = state.events;
        currentTimeline = runRef.current?.timeline; stageEventType = "STAGE_EVENT";
        sceneRunnerRef = runnerRef; sceneRunnerFn = runMode; break;
      case "ENGINE":
        currentStatus = engine?.status || "IDLE"; currentEvents = engine?.events;
        currentTimeline = engineRunRef.current?.timeline; stageEventType = "ENGINE_STAGE_EVENT";
        sceneRunnerRef = engineRunnerRef; sceneRunnerFn = runEngineMode; break;
      case "RECONCILE":
        currentStatus = reconcile?.status || "IDLE"; currentEvents = reconcile?.events;
        currentTimeline = reconcileRunRef.current?.timeline; stageEventType = "RECONCILE_STAGE_EVENT";
        sceneRunnerRef = reconcileRunnerRef; sceneRunnerFn = runReconcileMode; break;
      case "FANOUT":
        currentStatus = fanout?.status || "IDLE"; currentEvents = fanout?.events;
        currentTimeline = fanoutRunRef.current?.timeline; stageEventType = "FANOUT_STAGE_EVENT";
        sceneRunnerRef = fanoutRunnerRef; sceneRunnerFn = runFanoutMode; break;
      case "HARD_EDGE":
        currentStatus = hardEdge?.status || "IDLE"; currentEvents = hardEdge?.events;
        currentTimeline = hardEdgeRunRef.current?.timeline; stageEventType = "HARD_EDGE_STAGE_EVENT";
        sceneRunnerRef = hardEdgeRunnerRef; sceneRunnerFn = runHardEdgeMode; break;
      case "ERASURE":
        currentStatus = erasure?.status || "IDLE"; currentEvents = erasure?.events;
        currentTimeline = erasureRunRef.current?.timeline; stageEventType = "ERASURE_STAGE_EVENT";
        sceneRunnerRef = erasureRunnerRef; sceneRunnerFn = runErasureMode; break;
      case "ARCH":
        currentStatus = arch?.status || "IDLE"; currentEvents = arch?.events;
        currentTimeline = archRunRef.current?.timeline; stageEventType = "ARCH_STAGE_EVENT";
        sceneRunnerRef = archRunnerRef; sceneRunnerFn = runArchMode; break;
      case "RBAC":
        currentStatus = rbac?.status || "IDLE"; currentEvents = rbac?.events;
        currentTimeline = rbacRunRef.current?.timeline; stageEventType = "RBAC_STAGE_EVENT";
        sceneRunnerRef = rbacRunnerRef; sceneRunnerFn = runRbacMode; break;
      default: return;
    }

    if (currentStatus === "SETTLED") {
      const nextSceneIdx = sceneIdx + 1;
      if (nextSceneIdx >= SCENES.length) return;
      // Null current run ref so lastEventCount effect doesn't reconstruct after SET_SCENE
      switch (scene) {
        case "ONBOARDING": onboardRunRef.current = null; break;
        case "POSTING": runRef.current = null; break;
        case "ENGINE": engineRunRef.current = null; break;
        case "RECONCILE": reconcileRunRef.current = null; break;
        case "FANOUT": fanoutRunRef.current = null; break;
        case "HARD_EDGE": hardEdgeRunRef.current = null; break;
        case "ERASURE": erasureRunRef.current = null; break;
        case "ARCH": archRunRef.current = null; break;
        case "RBAC": rbacRunRef.current = null; break;
      }
      const nextKey = SCENES[nextSceneIdx].key;
      dispatch({ type: "SET_SCENE", scene: nextKey });
      // POSTING and RECONCILE have scenario selectors — pause so the user can configure before starting
      if (nextKey !== "POSTING" && nextKey !== "RECONCILE") {
        startSceneInStepMode(nextKey);
      }
      return;
    }

    if (currentStatus === "IDLE") {
      startSceneInStepMode(scene);
      return;
    }

    const nextIdx = currentEvents?.length || 0;
    if (!currentTimeline || nextIdx >= currentTimeline.length) return;
    sceneRunnerRef.current?.cancel?.();
    dispatch({ type: stageEventType, event: currentTimeline[nextIdx] });
    sceneRunnerRef.current = sceneRunnerFn(currentTimeline.slice(nextIdx + 1), dispatch, "STEP");
  }, [state.scene, state.sceneIndex, state.status, state.events, onboarding, engine, reconcile, fanout, hardEdge, erasure, arch, rbac, startSceneInStepMode]);

  // ─── Global Prev — step back within scene, or jump to previous scene ────────
  const handleGlobalPrev = useCallback(() => {
    // Try stepping back within the current scene first.
    switch (state.scene) {
      case "ONBOARDING":
        if (onboardingHasPrevStage(onboarding) && onboardRunRef.current) {
          onboardRunnerRef.current?.cancel?.();
          dispatch({ type: "ONBOARD_STEP_PREV" }); return;
        } break;
      case "POSTING":
        if (hasPrevStage(state) && runRef.current) {
          runnerRef.current?.cancel?.();
          dispatch({ type: "STEP_PREV" }); return;
        } break;
      case "ENGINE":
        if (engineHasPrevStage(engine) && engineRunRef.current) {
          engineRunnerRef.current?.cancel?.();
          dispatch({ type: "ENGINE_STEP_PREV" }); return;
        } break;
      case "RECONCILE":
        if (reconcileHasPrevStage(reconcile) && reconcileRunRef.current) {
          reconcileRunnerRef.current?.cancel?.();
          dispatch({ type: "RECONCILE_STEP_PREV" }); return;
        } break;
      case "FANOUT":
        if (fanoutHasPrevStage(fanout) && fanoutRunRef.current) {
          fanoutRunnerRef.current?.cancel?.();
          dispatch({ type: "FANOUT_STEP_PREV" }); return;
        } break;
      case "HARD_EDGE":
        if (hardEdgeHasPrevStage(hardEdge) && hardEdgeRunRef.current) {
          hardEdgeRunnerRef.current?.cancel?.();
          dispatch({ type: "HARD_EDGE_STEP_PREV" }); return;
        } break;
      case "ERASURE":
        if (erasureHasPrevStage(erasure) && erasureRunRef.current) {
          erasureRunnerRef.current?.cancel?.();
          dispatch({ type: "ERASURE_STEP_PREV" }); return;
        } break;
      case "ARCH":
        if (archHasPrevStage(arch) && archRunRef.current) {
          archRunnerRef.current?.cancel?.();
          dispatch({ type: "ARCH_STEP_PREV" }); return;
        } break;
      case "RBAC":
        if (rbacHasPrevStage(rbac) && rbacRunRef.current) {
          rbacRunnerRef.current?.cancel?.();
          dispatch({ type: "RBAC_STEP_PREV" }); return;
        } break;
      default: break;
    }
    // No step to go back to — navigate to the previous scene.
    if (state.sceneIndex > 0) {
      handleSetScene(SCENES[state.sceneIndex - 1].key);
    }
  }, [state, onboarding, engine, reconcile, fanout, hardEdge, erasure, arch, rbac, handleSetScene]);

  // ─── Global Reset ─────────────────────────────────────────────────────────
  const handleGlobalReset = useCallback(() => {
    cancelAll();
    dispatch({ type: "SET_SCENE", scene: "ONBOARDING" });
  }, [cancelAll]);

  // ─── Global computed state ────────────────────────────────────────────────
  const globalCurrentStatus = useMemo(() => {
    switch (state.scene) {
      case "ONBOARDING": return onboarding?.status || "IDLE";
      case "POSTING":    return state.status;
      case "ENGINE":     return engine?.status || "IDLE";
      case "RECONCILE":  return reconcile?.status || "IDLE";
      case "FANOUT":     return fanout?.status || "IDLE";
      case "HARD_EDGE":  return hardEdge?.status || "IDLE";
      case "ERASURE":    return erasure?.status || "IDLE";
      case "ARCH":       return arch?.status || "IDLE";
      case "RBAC":       return rbac?.status || "IDLE";
      default:           return "IDLE";
    }
  }, [state.scene, state.status, onboarding?.status, engine?.status, reconcile?.status, fanout?.status, hardEdge?.status, erasure?.status, arch?.status, rbac?.status]);

  const globalStarted = globalCurrentStatus !== "IDLE" || state.sceneIndex > 0 || Object.keys(state.scenesVisited).length > 0;
  const globalFinished = state.scene === "ERASURE" && (erasure?.status || "IDLE") === "SETTLED";

  const canGlobalNext = !globalFinished && (
    globalCurrentStatus !== "SETTLED" || state.sceneIndex < SCENES.length - 1
  );

  const canGlobalPrev = useMemo(() => {
    // Can always go left if a previous scene exists.
    if (state.sceneIndex > 0) return true;
    // Otherwise check if current scene has a step to go back to.
    switch (state.scene) {
      case "ONBOARDING": return onboardingHasPrevStage(onboarding);
      case "POSTING":    return hasPrevStage(state);
      case "ENGINE":     return engineHasPrevStage(engine);
      case "RECONCILE":  return reconcileHasPrevStage(reconcile);
      case "FANOUT":     return fanoutHasPrevStage(fanout);
      case "HARD_EDGE":  return hardEdgeHasPrevStage(hardEdge);
      case "ERASURE":    return erasureHasPrevStage(erasure);
      case "ARCH":       return archHasPrevStage(arch);
      case "RBAC":       return rbacHasPrevStage(rbac);
      default:           return false;
    }
  }, [state, onboarding, engine, reconcile, fanout, hardEdge, erasure, arch, rbac]);

  // ─── Keyboard stepping ─────────────────────────────────────────────────────
  useStepperKeys({
    onNext: handleGlobalNext,
    onPrev: handleGlobalPrev,
    enabled: canGlobalNext,
    enabledPrev: canGlobalPrev,
  });

  // ─── Stage status label ────────────────────────────────────────────────────
  const stageStatus = useMemo(() => {
    const sceneName = SCENES.find((s) => s.key === state.scene)?.label || state.scene;
    if (globalCurrentStatus === "IDLE") return "Ready";
    if (globalCurrentStatus === "SETTLED") {
      if (globalFinished) return "Complete";
      return `${sceneName} · done`;
    }
    const stageListLen = { // eslint-disable-line no-shadow
      ONBOARDING: ONBOARD_STAGE_LIST.length,
      POSTING: STAGE_LIST.length,
      ENGINE: ENGINE_STAGE_LIST.length,
      RECONCILE: RECONCILE_STAGE_LIST.length,
      FANOUT: FANOUT_STAGE_LIST.length,
      HARD_EDGE: HARD_EDGE_STAGE_LIST.length,
      ERASURE: ERASURE_STAGE_LIST.length,
      ARCH: ARCH_STAGE_LIST.length,
      RBAC: RBAC_STAGE_LIST.length,
    }[state.scene] || 0;
    const stageIdx = (() => {
      switch (state.scene) {
        case "ONBOARDING": return (onboarding?.stageIndex ?? -1) + 1;
        case "POSTING":    return (state.stageIndex ?? -1) + 1;
        case "ENGINE":     return (engine?.stageIndex ?? -1) + 1;
        case "RECONCILE":  return (reconcile?.stageIndex ?? -1) + 1;
        case "FANOUT":     return (fanout?.stageIndex ?? -1) + 1;
        case "HARD_EDGE":  return (hardEdge?.stageIndex ?? -1) + 1;
        case "ERASURE":    return (erasure?.stageIndex ?? -1) + 1;
        case "ARCH":       return (arch?.stageIndex ?? -1) + 1;
        case "RBAC":       return (rbac?.stageIndex ?? -1) + 1;
        default:           return 0;
      }
    })();
    return `${sceneName} · ${stageIdx} / ${stageListLen}`;
  }, [state.scene, state.stageIndex, globalCurrentStatus, globalFinished, onboarding, engine, reconcile, fanout, hardEdge, erasure, arch, rbac]);

  const stageProgress = useMemo(() => {
    if (globalCurrentStatus === "IDLE" || globalCurrentStatus === "SETTLED") return null;
    const total = {
      ONBOARDING: ONBOARD_STAGE_LIST.length,
      POSTING: STAGE_LIST.length,
      ENGINE: ENGINE_STAGE_LIST.length,
      RECONCILE: RECONCILE_STAGE_LIST.length,
      FANOUT: FANOUT_STAGE_LIST.length,
      HARD_EDGE: HARD_EDGE_STAGE_LIST.length,
      ERASURE: ERASURE_STAGE_LIST.length,
      ARCH: ARCH_STAGE_LIST.length,
      RBAC: RBAC_STAGE_LIST.length,
    }[state.scene] || 0;
    if (!total) return null;
    const current = (() => {
      switch (state.scene) {
        case "ONBOARDING": return (onboarding?.stageIndex ?? -1) + 1;
        case "POSTING":    return (state.stageIndex ?? -1) + 1;
        case "ENGINE":     return (engine?.stageIndex ?? -1) + 1;
        case "RECONCILE":  return (reconcile?.stageIndex ?? -1) + 1;
        case "FANOUT":     return (fanout?.stageIndex ?? -1) + 1;
        case "HARD_EDGE":  return (hardEdge?.stageIndex ?? -1) + 1;
        case "ERASURE":    return (erasure?.stageIndex ?? -1) + 1;
        case "ARCH":       return (arch?.stageIndex ?? -1) + 1;
        case "RBAC":       return (rbac?.stageIndex ?? -1) + 1;
        default:           return 0;
      }
    })();
    return { current, total };
  }, [state.scene, state.stageIndex, globalCurrentStatus, onboarding, engine, reconcile, fanout, hardEdge, erasure, arch, rbac]);

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
              <div className={styles.progressWrap}>
                <Badge variant={globalCurrentStatus === "IDLE" ? "lightgray" : globalCurrentStatus === "SETTLED" ? "green" : "blue"}>
                  {globalCurrentStatus === "SETTLED" ? `✓ ${stageStatus}` : stageStatus}
                </Badge>
                {stageProgress && (
                  <div className={styles.progressMeter}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${Math.round((stageProgress.current / stageProgress.total) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.controls}>
            {canGlobalNext && (
              <span className={styles.stepHint} aria-live="polite">
                <kbd className={styles.kbd}>←</kbd>
                <kbd className={styles.kbd}>→</kbd>
                <kbd className={styles.kbd}>Space</kbd>
                step
              </span>
            )}

            <div className={styles.btnRow}>
              {!globalStarted ? (
                <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                  <Button variant="primary" onClick={handleGlobalNext} leftGlyph={<Icon glyph="Play" />} size="small">
                    Start
                  </Button>
                </motion.div>
              ) : (
                <>
                  <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                    <Button variant="default" onClick={handleGlobalPrev} disabled={!canGlobalPrev} leftGlyph={<Icon glyph="ChevronLeft" />} size="small">
                      Prev
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                    <Button variant="primary" onClick={handleGlobalNext} disabled={!canGlobalNext} rightGlyph={<Icon glyph="ChevronRight" />} size="small">
                      Next
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                    <Button variant="default" onClick={handleGlobalReset} leftGlyph={<Icon glyph="Refresh" />} size="small">
                      Reset
                    </Button>
                  </motion.div>
                </>
              )}

              <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                <Button variant="default" onClick={() => setDrawerOpen(true)} rightGlyph={<Icon glyph="Visibility" />} size="small">
                  Collections
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                <Button variant="default" onClick={() => router.push("/ledger-flow")} leftGlyph={<Icon glyph="ChevronLeft" />} size="small">
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

        {/* ID / SCENARIO ROW — one grid slot, content depends on state */}
        <div className={styles.idRow}>
          {isPostingScene && state.identifiers.idempotencyKey ? (
            <>
              <span className={styles.scenarioLabel}>Transaction:</span>
              <Badge
                variant={
                  txType === "DOMESTIC" ? "green" :
                  txType === "FX" ? "blue" :
                  "yellow"
                }
                className={styles.txTypeBadge}
              >
                {txType === "DOMESTIC" ? "FedNow Domestic" :
                 txType === "FX"       ? "FX Transfer EUR→USD" :
                                         "Cancelled Auth"}
              </Badge>
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
            </>
          ) : isReconcileScene && reconcileStatus === "IDLE" ? (
            <>
              <span className={styles.scenarioLabel}>Reconcile scenario:</span>
              {[
                { key: "BALANCED",     label: "Perfect Balance" },
                { key: "STRAND_DRIFT", label: "Strand Drift Δ$0.10" },
                { key: "SUB_GL_LAG",   label: "Pipeline Lag" },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={`${styles.scenarioPill} ${reconcileScenario === s.key ? styles.scenarioPillActive : ""}`}
                  onClick={() => handleSetReconcileScenario(s.key)}
                >
                  {reconcileScenario === s.key && <span className={styles.pillCheck}>✓ </span>}
                  {s.label}
                </button>
              ))}
            </>
          ) : (isOnboardingScene || isPostingScene) && !state.identifiers.idempotencyKey ? (
            <>
              <span className={styles.scenarioLabel}>Transaction:</span>
              {[
                { key: "DOMESTIC",  label: "FedNow Domestic" },
                { key: "FX",        label: "FX Transfer EUR→USD" },
                { key: "CANCELLED", label: "Cancelled Auth" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`${styles.scenarioPill} ${txType === t.key ? styles.scenarioPillActive : ""}`}
                  onClick={() => handleSetTxType(t.key)}
                >
                  {txType === t.key && <span className={styles.pillCheck}>✓ </span>}
                  {t.label}
                </button>
              ))}
              {txType === "DOMESTIC" && (
                <>
                  <span className={styles.scenarioLabel} style={{ marginLeft: "16px" }}>EOD scenario:</span>
                  {[
                    { key: "FX_ROUNDING", label: "FX Rounding Δ$1" },
                    { key: "DUPLICATE",   label: "Duplicate Δ$250" },
                    { key: "MATCH",       label: "Perfect Balance" },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      className={`${styles.scenarioPill} ${scenario === s.key ? styles.scenarioPillActive : ""}`}
                      onClick={() => handleSetScenario(s.key)}
                    >
                      {scenario === s.key && <span className={styles.pillCheck}>✓ </span>}
                      {s.label}
                    </button>
                  ))}
                </>
              )}
            </>
          ) : null}
        </div>

        {/* CANVAS */}
        <main className={styles.canvasBand}>
          <SceneCanvas
            scene={state.scene}
            state={state}
            sceneStatus={globalCurrentStatus}
            nextSceneLabel={SCENES[state.sceneIndex + 1]?.label}
          />
        </main>

        {/* BALANCES — only visible during POSTING scene */}
        <section className={styles.balancesBand}>
          {isPostingScene && <AccountBalanceCards balances={state.balances} />}
        </section>

        {/* INTERPRETER */}
        <section className={styles.interpreterBand}>
          {isPostingScene
            ? <StageInterpreter state={state} onOpenDrawer={() => setDrawerOpen(true)} narrationFn={narrationFor} />
            : <ScenePlaceholderInterpreter content={narrationFor(state)} onOpenDrawer={() => setDrawerOpen(true)} />
          }
        </section>

        {/* COLLECTION DRAWER */}
        <CollectionDrawerV3 open={drawerOpen} setOpen={setDrawerOpen} />

        {/* BIAN footer strip */}
        <footer className={styles.bianStrip} aria-label="BIAN classification">
          <span>SD{" "}
            <Tooltip
              trigger={<strong style={{ cursor: "help", borderBottom: "1px dotted #5C6C75" }}>FinancialAccounting</strong>}
              align="top"
              darkMode={false}
            >
              Service Domain — BIAN&apos;s primary classification unit. Owns the GL, sub-ledger, trial balance, and period close lifecycle.
            </Tooltip>
          </span>
          <span className={styles.sep}>·</span>
          <span>CR{" "}
            <Tooltip
              trigger={<strong style={{ cursor: "help", borderBottom: "1px dotted #5C6C75" }}>FinancialBookingLog</strong>}
              align="top"
              darkMode={false}
            >
              Control Record — the persistent data entity managed by this Service Domain. An immutable log of all financial book entries.
            </Tooltip>
          </span>
          <span className={styles.sep}>·</span>
          <span>BQ{" "}
            <Tooltip
              trigger={<strong style={{ cursor: "help", borderBottom: "1px dotted #5C6C75" }}>LedgerPosting</strong>}
              align="top"
              darkMode={false}
            >
              Behavior Qualifier — the specific posting operation within the Control Record lifecycle: debit, credit, and GL commit.
            </Tooltip>
          </span>
          <span className={styles.sep}>·</span>
          <span>Pattern{" "}
            <Tooltip
              trigger={<strong style={{ cursor: "help", borderBottom: "1px dotted #5C6C75" }}>Management</strong>}
              align="top"
              darkMode={false}
            >
              BIAN Interaction Pattern — lifecycle management of the Control Record, as opposed to Execute, Process, or Monitor patterns.
            </Tooltip>
          </span>
        </footer>
      </div>
    </MotionConfig>
    </LeafygreenProvider>
  );
};

export default LedgerFlowV3;
