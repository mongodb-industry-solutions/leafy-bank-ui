"use client";

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { H1, Body } from "@leafygreen-ui/typography";
import Badge from "@leafygreen-ui/badge";
import Button from "@leafygreen-ui/button";
import Tooltip from "@leafygreen-ui/tooltip";
import IconButton from "@leafygreen-ui/icon-button";
import Icon from "@leafygreen-ui/icon";
import Copyable from "@leafygreen-ui/copyable";
import { SegmentedControl, SegmentedControlOption } from "@leafygreen-ui/segmented-control";
import LeafygreenProvider from "@leafygreen-ui/leafygreen-provider";
import { MotionConfig, motion, AnimatePresence } from "motion/react";
import { SPRING } from "./motionConfig";

import { ledgerReducer, initialState, hasNextStage, hasPrevStage } from "./ledgerReducer";
import { buildPaymentRun, runMode } from "./simulator";
import { FRIDA, BO, DEFAULT_PAYMENT } from "./ledgerFixtures";
import { useStepperKeys } from "./useStepperKeys";
import StageCanvas from "./StageCanvas";
import StageInterpreter from "./StageInterpreter";
import CollectionDrawer from "./CollectionDrawer";
import AccountBalanceCards from "./AccountBalanceCards";
import styles from "./LedgerFlow.module.css";

const LedgerFlow = () => {
  const router = useRouter();
  const [state, dispatch] = useReducer(ledgerReducer, initialState);
  const runnerRef = useRef(null);
  const runRef = useRef(null); // last-built run (timeline + identifiers); preserved across STEP_PREV
  const [drawerOpen, setDrawerOpen] = useState(false);

  const txType = state.txType || "DOMESTIC";
  const txTypeRef = useRef(txType);
  txTypeRef.current = txType;

  // Cancel in-flight run on unmount.
  useEffect(() => {
    return () => {
      runnerRef.current?.cancel?.();
    };
  }, []);

  const handleSetTxType = useCallback((t) => {
    if (state.status !== "IDLE") return;
    dispatch({ type: "SET_TX_TYPE", txType: t });
  }, [state.status]);

  const handleSimulate = useCallback(() => {
    runnerRef.current?.cancel?.();
    const run = buildPaymentRun({
      from: FRIDA,
      to: BO,
      amount: DEFAULT_PAYMENT.amount,
      currency: DEFAULT_PAYMENT.currency,
      description: DEFAULT_PAYMENT.description,
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
      txType: txTypeRef.current,
    });
    runnerRef.current = runMode(run.timeline, dispatch, state.mode);
    if (state.mode === "STEP") {
      runnerRef.current.next();
    }
  }, [state.mode]);

  const handleNext = useCallback(() => {
    if (state.mode !== "STEP") return;
    if (!runnerRef.current) {
      handleSimulate();
      return;
    }
    runnerRef.current.next();
  }, [state.mode, handleSimulate]);

  const handlePrev = useCallback(() => {
    if (state.mode !== "STEP") return;
    if (!hasPrevStage(state)) return;
    if (!runRef.current) return;
    // Cancel current runner; rewind state; rebuild runner so the cursor sits
    // at the next-to-fire event after rewind. We pass a starting cursor by
    // pre-firing N events on a fresh runner (cheaper than tracking cursor).
    runnerRef.current?.cancel?.();
    dispatch({ type: "STEP_PREV" });
    // We don't know the new cursor synchronously (state hasn't applied yet);
    // a useEffect below resyncs the runner whenever events.length changes
    // outside the runner's own dispatch path.
  }, [state]);

  // Re-sync the runner after STEP_PREV — when the events length shrinks,
  // rebuild the runner with its cursor advanced to events.length so the next
  // call to .next() fires the correct event from the original timeline.
  const lastEventCountRef = useRef(0);
  useEffect(() => {
    const n = state.events?.length || 0;
    if (n < lastEventCountRef.current && runRef.current) {
      // Step-back: rebuild runner skipping the first n events (they're already in state)
      const remaining = runRef.current.timeline.slice(n);
      runnerRef.current?.cancel?.();
      runnerRef.current = runMode(remaining, dispatch, state.mode);
    }
    lastEventCountRef.current = n;
  }, [state.events?.length, state.mode]);

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

  // Keyboard stepping (Step mode only).
  useStepperKeys({
    onNext: handleNext,
    onPrev: handlePrev,
    enabled: state.mode === "STEP" && state.status === "STEP_PAUSED",
    enabledPrev: state.mode === "STEP" && hasPrevStage(state),
  });

  const stageStatus = useMemo(() => {
    if (state.status === "IDLE") return "Ready";
    if (state.status === "SETTLED") {
      const elapsed = state.startedAt && state.settledAt ? ((state.settledAt - state.startedAt) / 1000).toFixed(2) : null;
      return elapsed ? `Settled · ${elapsed}s` : "Settled";
    }
    const idx = state.stageIndex >= 0 ? state.stageIndex + 1 : 0;
    return `Stage ${idx} of 9`;
  }, [state.status, state.stageIndex, state.startedAt, state.settledAt]);

  const stageProgress = useMemo(() => {
    if (state.status === "IDLE" || state.status === "SETTLED") return null;
    const current = state.stageIndex >= 0 ? state.stageIndex + 1 : 0;
    return current > 0 ? { current, total: 9 } : null;
  }, [state.status, state.stageIndex]);

  const canSimulate = state.status === "IDLE";
  const canStep = state.mode === "STEP" && state.status === "STEP_PAUSED" && hasNextStage(state);

  return (
    <LeafygreenProvider darkMode={false}>
    <MotionConfig reducedMotion="user" transition={SPRING.default}>
      {/* Drawer renders as a portaled <dialog> at document root, beyond the
          reach of CSS Modules. Inject a width override globally. */}
      <style dangerouslySetInnerHTML={{
        __html: `dialog[data-lgid^="lg-drawer"]{width:min(1100px,96vw)!important;min-width:min(1100px,96vw)!important;max-width:96vw!important;}`
      }} />
      <div className={styles.page} data-lf-route>
        {/* TOP BAR */}
        <header className={styles.topBar}>
          <div className={styles.titleBlock}>
            <div className={styles.titleRow}>
              <H1 className={styles.title}>Ledger Flow</H1>
              <Badge variant="lightgray">v1</Badge>
              <Badge variant="green">BIAN v14</Badge>
              <Badge variant="yellow">MVP · write-only</Badge>
              <div className={styles.progressWrap}>
                <Badge variant={state.status === "IDLE" ? "lightgray" : state.status === "SETTLED" ? "green" : "blue"}>
                  {state.status === "SETTLED" ? `✓ ${stageStatus}` : stageStatus}
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
            {state.mode === "STEP" && state.status === "STEP_PAUSED" && (
              <span className={styles.stepHint} aria-live="polite">
                <kbd className={styles.kbd}>←</kbd>
                <kbd className={styles.kbd}>→</kbd>
                <kbd className={styles.kbd}>Space</kbd>
                step
              </span>
            )}

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

            <div className={styles.btnRow}>
              {canSimulate ? (
                <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={SPRING.tap}>
                  <Button variant="primary" onClick={handleSimulate} leftGlyph={<Icon glyph="Play" />} size="small">
                    Simulate
                  </Button>
                </motion.div>
              ) : (
                <>
                  {state.mode === "STEP" && (
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
                        <Button variant="primary" onClick={handleNext} disabled={!canStep} rightGlyph={<Icon glyph="ChevronRight" />} size="small">
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
              )}
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
                  onClick={() => router.push("/ledger-flow/v3")}
                  rightGlyph={<Icon glyph="Sparkle" />}
                  size="small"
                >
                  v2
                </Button>
              </motion.div>
            </div>
          </div>
        </header>

        {/* SCENARIO SELECTOR (IDLE) / IDENTIFIER COPYABLES (running) */}
        <div className={styles.idRow}>
          {state.identifiers.idempotencyKey ? (
            <>
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
          ) : (
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
            </>
          )}
        </div>

        {/* CANVAS — hero band: SVG diagram only, takes all leftover height */}
        <main className={styles.canvasBand}>
          <div style={{ position: "relative", flex: 1, display: "flex" }}>
            <StageCanvas state={state} />
            <AnimatePresence>
              {state.status === "SETTLED" && (
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
                    overflow: "visible",
                  }}
                >
                  {/* Sparkle burst on settlement */}
                  {[
                    { x: -20, y: -14, c: "#00ED64", s: 5 },
                    { x:  22, y: -16, c: "#00ED64", s: 4 },
                    { x: -12, y:  18, c: "#00A35C", s: 4 },
                    { x:  26, y:  12, c: "#00ED64", s: 3 },
                    { x:   6, y: -22, c: "#C0FAE6", s: 4 },
                  ].map((sp, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                      animate={{ opacity: [0, 0.95, 0], x: sp.x, y: sp.y, scale: [0, 1.3, 0] }}
                      transition={{ duration: 0.65, delay: 0.08 + i * 0.055, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: sp.s,
                        height: sp.s,
                        marginLeft: -sp.s / 2,
                        marginTop: -sp.s / 2,
                        borderRadius: "50%",
                        background: sp.c,
                        boxShadow: `0 0 ${sp.s * 2}px ${sp.c}`,
                        pointerEvents: "none",
                      }}
                    />
                  ))}
                  <span style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 16, height: 16, borderRadius: "50%",
                    background: "#00A35C", color: "#fff", fontSize: 9, fontWeight: 700, flexShrink: 0,
                  }}>✓</span>
                  All 9 stages posted
                  {state.settledAt && state.startedAt && (
                    <span style={{ color: "#3D7A61", fontWeight: 400 }}>
                      · {((state.settledAt - state.startedAt) / 1000).toFixed(2)}s
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* BALANCES — its own page-grid row, never compresses the canvas */}
        <section className={styles.balancesBand}>
          <AccountBalanceCards balances={state.balances} />
        </section>

        {/* INTERPRETER — narration + active doc + Pipeline */}
        <section className={styles.interpreterBand}>
          <StageInterpreter state={state} onOpenDrawer={() => setDrawerOpen(true)} />
        </section>

        {/* COLLECTION DRAWER */}
        <CollectionDrawer open={drawerOpen} setOpen={setDrawerOpen} />

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

export default LedgerFlow;
