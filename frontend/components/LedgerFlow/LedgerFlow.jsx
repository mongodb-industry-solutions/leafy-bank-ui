"use client";

import React, { useCallback, useEffect, useReducer, useRef } from "react";
import Modal from "@leafygreen-ui/modal";
import { H3, Body } from "@leafygreen-ui/typography";
import Badge from "@leafygreen-ui/badge";
import Button from "@leafygreen-ui/button";
import styles from "./LedgerFlow.module.css";
import { ledgerReducer, initialState } from "./ledgerReducer";
import { buildPaymentRun, runTimeline } from "./simulator";
import { FRIDA, BO, DEFAULT_PAYMENT } from "./ledgerFixtures";
import ActivityPanel from "./ActivityPanel";
import FlowDiagram from "./FlowDiagram";
import CopyChip from "./CopyChip";

const TITLE_ID = "ledger-flow-title";

const LedgerFlow = ({ open, setOpen }) => {
  const [state, dispatch] = useReducer(ledgerReducer, initialState);
  const cancelRef = useRef(null);

  // Lock body scroll while modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Cancel any in-flight timeline + reset on close.
  useEffect(() => {
    if (open) return;
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    dispatch({ type: "RESET" });
  }, [open]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (cancelRef.current) cancelRef.current();
    };
  }, []);

  const handleSimulate = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    const run = buildPaymentRun({
      from: FRIDA,
      to: BO,
      amount: DEFAULT_PAYMENT.amount,
      currency: DEFAULT_PAYMENT.currency,
      description: DEFAULT_PAYMENT.description,
    });
    dispatch({
      type: "START",
      from: FRIDA,
      to: BO,
      identifiers: run.identifiers,
      amount: DEFAULT_PAYMENT.amount,
      currency: DEFAULT_PAYMENT.currency,
    });
    cancelRef.current = runTimeline(run.timeline, dispatch);
  }, []);

  const handleReset = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    dispatch({ type: "RESET" });
  }, []);

  const isRunning = state.status === "RUNNING";
  const elapsed =
    state.startedAt && state.settledAt
      ? ((state.settledAt - state.startedAt) / 1000).toFixed(2)
      : null;

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      darkMode
      className={styles.modal}
      contentClassName={styles.modalDialog}
      aria-labelledby={TITLE_ID}
    >
      <div className={styles.modalContent}>
        <header className={styles.headerStrip}>
          <div>
            <div className={styles.headerTitleRow}>
              <H3 id={TITLE_ID} className={styles.title}>
                Ledger Flow — Payment to Balance
              </H3>
              <Badge variant="green">BIAN v14</Badge>
              <Badge variant="darkgray">MVP · write-only journal</Badge>
              {state.status === "SETTLED" && elapsed && (
                <Badge variant="green">Settled · {elapsed}s</Badge>
              )}
            </div>
            <Body className={styles.subtitle}>
              {FRIDA.displayName} → {BO.displayName} · payment ↦ sub-ledger legs ↦ GL journal ↦ change stream ↦ account balances
            </Body>
          </div>
          <div className={styles.controls}>
            <Button
              darkMode
              variant="primary"
              onClick={handleSimulate}
              disabled={isRunning}
            >
              {isRunning ? "Running…" : "Simulate ▸"}
            </Button>
            <Button
              darkMode
              variant="default"
              onClick={handleReset}
              disabled={state.status === "IDLE"}
            >
              Reset
            </Button>
          </div>
        </header>

        <div className={styles.body}>
          <section className={styles.diagramPane} aria-label="Flow diagram">
            <FlowDiagram state={state} />
          </section>
          <aside className={styles.activityPane} aria-label="Activity panel">
            <ActivityPanel state={state} />
          </aside>
        </div>

        <div className={styles.bianStrip} aria-label="BIAN classification">
          <span>SD <strong>FinancialAccounting</strong></span>
          <span className={styles.sep}>·</span>
          <span>CR <strong>FinancialBookingLog</strong></span>
          <span className={styles.sep}>·</span>
          <span>BQ <strong>LedgerPosting</strong></span>
          <span className={styles.sep}>·</span>
          <span>Pattern <strong>Management</strong></span>
          {state.identifiers.journalId && (
            <>
              <span className={styles.sep}>·</span>
              <CopyChip
                label="journalId"
                value={state.identifiers.journalId}
                title="Copy journalId to clipboard"
              />
            </>
          )}
          {state.identifiers.idempotencyKey && (
            <>
              <span className={styles.sep}>·</span>
              <CopyChip
                label="idempotencyKey"
                value={state.identifiers.idempotencyKey}
                title="Copy idempotencyKey to clipboard"
              />
            </>
          )}
          {state.identifiers.resumeToken && (
            <>
              <span className={styles.sep}>·</span>
              <CopyChip
                label="resumeToken"
                value={state.identifiers.resumeToken}
                title="Copy Change Stream resumeToken"
              />
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default LedgerFlow;
