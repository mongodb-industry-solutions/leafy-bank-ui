"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../LedgerFlow/motionConfig";
import { RECONCILE_RUN, RECONCILE_EXCEPTION, CORRECTION_JOURNAL } from "./reconcileFixtures";
import styles from "./ReconcileCanvas.module.css";

// ─── Layout constants ────────────────────────────────────────────────────────
const W = 1600, H = 440;

const COL_W = 430, COL_H = 272;
const COL_Y = 52;
const LEFT_X = 60;
const RIGHT_X = 1110;
const BAR_PAD = 18;
const BAR_W = COL_W - BAR_PAD * 2;
const BAR_H = 172;
const BAR_Y = COL_Y + 56;  // top of bar container

// Beam connects left column right-edge to right column left-edge
const BEAM_Y = COL_Y + 22;
const BEAM_X1 = LEFT_X + COL_W + 8;
const BEAM_X2 = RIGHT_X - 8;
const BEAM_MID_X = (BEAM_X1 + BEAM_X2) / 2;  // ≈ 800

// Delta box (centred in beam gap)
const DELTA_W = 260, DELTA_H = 92;
const DELTA_X = BEAM_MID_X - DELTA_W / 2;
const DELTA_Y = BEAM_Y + 30;

// Exception ticket
const TICKET_X = 140, TICKET_Y = 354, TICKET_W = 1320, TICKET_H = 70;

// Period gate
const GATE_X = 1330, GATE_Y = 8, GATE_W = 248, GATE_H = 24;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function fmtCount(n) {
  return new Intl.NumberFormat("en-US").format(n);
}
function dec(obj) {
  if (!obj) return 0;
  return parseFloat(typeof obj === "object" ? obj.$numberDecimal : obj);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Column({ x, label, sublabel, barFill, count, total, colorFill, colorStroke, colorText, show, labelFill, isBreakSide }) {
  const barHeight = show ? BAR_H : 0;
  return (
    <g>
      {/* Card */}
      <rect
        x={x}
        y={COL_Y}
        width={COL_W}
        height={COL_H}
        rx={12}
        className={styles.colCard}
        stroke={show ? (isBreakSide ? "#FFCDD2" : colorStroke) : "#E8EDEB"}
        fill="white"
      />
      {/* Top accent */}
      <rect x={x} y={COL_Y} width={COL_W} height={5} rx={4} fill={show ? colorFill : "#E8EDEB"} opacity={0.5} />

      {/* Header */}
      <text x={x + COL_W / 2} y={COL_Y + 22} textAnchor="middle" className={styles.colHeader} fill={show ? labelFill : "#889397"}>
        {label}
      </text>
      <text x={x + COL_W / 2} y={COL_Y + 38} textAnchor="middle" className={styles.colSub}>
        {sublabel}
      </text>

      {/* Bar container */}
      <rect x={x + BAR_PAD} y={BAR_Y} width={BAR_W} height={BAR_H} rx={6} fill="#F9FBFA" />

      {/* Animated fill bar (grows from bottom) */}
      <clipPath id={`clip-${label.replace(/\s+/g, "")}`}>
        <rect x={x + BAR_PAD} y={BAR_Y} width={BAR_W} height={BAR_H} rx={6} />
      </clipPath>
      <motion.rect
        x={x + BAR_PAD}
        width={BAR_W}
        rx={6}
        fill={isBreakSide ? "#FFCDD2" : colorFill}
        animate={{
          y: BAR_Y + BAR_H - barHeight,
          height: barHeight,
        }}
        transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
        clipPath={`url(#clip-${label.replace(/\s+/g, "")})`}
      />

      {/* Horizontal ruling lines inside bar */}
      {show && [1, 2, 3, 4, 5].map((i) => (
        <line
          key={i}
          x1={x + BAR_PAD + 8}
          y1={BAR_Y + (BAR_H / 6) * i}
          x2={x + BAR_PAD + BAR_W - 8}
          y2={BAR_Y + (BAR_H / 6) * i}
          stroke={isBreakSide ? "#FFAA99" : colorStroke}
          strokeWidth={0.7}
          opacity={0.4}
        />
      ))}

      {/* Count */}
      <motion.text
        x={x + COL_W / 2}
        y={COL_Y + COL_H - 46}
        textAnchor="middle"
        className={styles.colCount}
        animate={{ opacity: show ? 1 : 0.2 }}
      >
        {show ? `${fmtCount(count)} ${count === 58947 ? "entries" : "GL lines"}` : "—"}
      </motion.text>

      {/* Total */}
      <motion.text
        x={x + COL_W / 2}
        y={COL_Y + COL_H - 22}
        textAnchor="middle"
        className={styles.colTotal}
        fill={show ? colorText : "#C1C7C6"}
        animate={{ opacity: show ? 1 : 0.2 }}
      >
        {show ? fmtMoney(total) : "$—"}
      </motion.text>
    </g>
  );
}

// ─── Main Canvas ─────────────────────────────────────────────────────────────
export default function ReconcileCanvas({ state }) {
  const r = state?.reconcile || {};
  const reached = (s) => !!r.reachedStages?.[s];
  const isActive = r.status !== "IDLE";

  const srcFull    = reached("RECONCILE_SCANNING_SOURCE");
  const tgtFull    = reached("RECONCILE_SCANNING_TARGET");
  const isChecking = reached("RECONCILE_BALANCE_CHECK");
  const isUnbal    = reached("RECONCILE_RESULT_UNBALANCED") && !reached("RECONCILE_RESOLVED");
  const showExc    = reached("RECONCILE_EXCEPTION_CREATED");
  const isInv      = reached("RECONCILE_INVESTIGATION_OPENED");
  const hasCor     = reached("RECONCILE_CORRECTION_POSTED");
  const isResolved = reached("RECONCILE_RESOLVED");
  const isBalanced = isResolved;

  // Visual states
  const beamTilt   = isUnbal ? -2.8 : 0;
  const beamColor  = isBalanced ? "#00A35C" : (isUnbal ? "#C82430" : (isChecking ? "#016BF8" : "#C1C7C6"));

  const deltaColor = isBalanced ? "#00684A" : (isUnbal ? "#C82430" : (isChecking ? "#016BF8" : "#5C6C75"));
  const deltaAmt   = (isUnbal || isBalanced) ? (isBalanced ? "$0.00" : "$1.00") : (isChecking ? "…" : "—");
  const deltaLabel = isBalanced ? "✓ BALANCED" : (isUnbal ? "⚠ UNBALANCED" : (isChecking ? "CHECKING" : "—"));
  const deltaFill  = isBalanced ? "#E3FCF7" : (isUnbal ? "#FFEAE5" : (isChecking ? "#E1F7FF" : "#F9FBFA"));
  const deltaStroke = deltaColor;

  const gateBlocked = showExc && !isResolved;
  const gateColor  = isResolved ? "#00684A" : (gateBlocked ? "#C82430" : "#5C6C75");
  const gateFill   = isResolved ? "#E3FCF7" : (gateBlocked ? "#FFEAE5" : "#F9FBFA");
  const gateText   = isResolved ? "Period 2026-04 · gate: READY" : (gateBlocked ? "Period 2026-04 · gate: BLOCKED" : "Period 2026-04 · gate: PENDING");

  const excStatus  = isResolved ? "RESOLVED" : (hasCor ? "CORRECTION POSTED" : (isInv ? "INVESTIGATING" : "OPEN"));
  const excAccent  = isResolved ? "#00684A" : (isInv ? "#944F01" : "#C82430");
  const excBg      = isResolved ? "#E3FCF7" : (hasCor ? "#FEF7DB" : (isInv ? "#FEF7DB" : "#FFEAE5"));
  const excBorder  = isResolved ? "#00A35C" : (isInv ? "#944F01" : "#C82430");

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      {/* Background */}
      <rect width={W} height={H} fill="#FAFBFA" />

      {/* Header strip */}
      <rect x={0} y={0} width={W} height={38} fill="#F9FBFA" />
      <line x1={0} y1={38} x2={W} y2={38} stroke="#E8EDEB" strokeWidth={1} />

      {isActive ? (
        <text x={40} y={23} className={styles.headerText}>
          RECONCILIATION RUN · {RECONCILE_RUN.runId} · {RECONCILE_RUN.runType} · {RECONCILE_RUN.periodName}
        </text>
      ) : (
        <text x={W / 2} y={23} textAnchor="middle" className={styles.headerText} opacity={0.45}>
          EOD RECONCILIATION · SUB_LEDGER_TO_GL · Press Simulate to run
        </text>
      )}

      {/* Period-close gate */}
      <motion.g animate={{ opacity: isActive ? 1 : 0.35 }} transition={SPRING.default}>
        <rect x={GATE_X} y={GATE_Y} width={GATE_W} height={GATE_H} rx={GATE_H / 2}
          fill={gateFill} stroke={gateColor} strokeWidth={1} />
        <text x={GATE_X + GATE_W / 2} y={GATE_Y + 15.5} textAnchor="middle" className={styles.gateText} fill={gateColor}>
          {gateText}
        </text>
      </motion.g>

      {/* ── Scale beam (tilts on unbalanced) ────────────────────────────── */}
      <motion.g
        animate={{ rotate: beamTilt }}
        style={{ transformOrigin: `${BEAM_MID_X}px ${BEAM_Y}px` }}
        transition={SPRING.default}
      >
        {/* Horizontal beam */}
        <motion.line
          x1={BEAM_X1} y1={BEAM_Y} x2={BEAM_X2} y2={BEAM_Y}
          stroke={beamColor} strokeWidth={isChecking ? 2 : 1.5}
          strokeDasharray={isActive ? "none" : "8 5"}
          animate={{ stroke: beamColor }}
          transition={SPRING.default}
        />
        {/* Vertical arm – left */}
        <line x1={LEFT_X + COL_W / 2} y1={BEAM_Y} x2={LEFT_X + COL_W / 2} y2={COL_Y + 3}
          stroke="#C1C7C6" strokeWidth={1} />
        {/* Vertical arm – right */}
        <line x1={RIGHT_X + COL_W / 2} y1={BEAM_Y} x2={RIGHT_X + COL_W / 2} y2={COL_Y + 3}
          stroke="#C1C7C6" strokeWidth={1} />
        {/* Pivot triangle */}
        <motion.polygon
          points={`${BEAM_MID_X},${BEAM_Y - 14} ${BEAM_MID_X - 9},${BEAM_Y} ${BEAM_MID_X + 9},${BEAM_Y}`}
          animate={{ fill: beamColor }}
          transition={SPRING.default}
        />
      </motion.g>

      {/* ── Left column: Sub-Ledger ──────────────────────────────────────── */}
      <Column
        x={LEFT_X}
        label="SUB-LEDGER ENTRIES"
        sublabel="subLedgerEntries · controlAccountCode: 2100"
        show={srcFull}
        count={RECONCILE_RUN.sourceCount}
        total={dec(RECONCILE_RUN.sourceTotal)}
        colorFill="#FDE7C8"
        colorStroke="#F4C89A"
        colorText={isUnbal ? "#C82430" : "#001E2B"}
        labelFill="#944F01"
        isBreakSide={isUnbal}
      />

      {/* ── Right column: GL Summary ─────────────────────────────────────── */}
      <Column
        x={RIGHT_X}
        label="GL CONTROL ACCOUNTS"
        sublabel="glAccounts · accountCode: 2100"
        show={tgtFull}
        count={RECONCILE_RUN.targetCount}
        total={dec(RECONCILE_RUN.targetTotal)}
        colorFill="#C0FAE6"
        colorStroke="#A8DCC5"
        colorText={isResolved ? "#00684A" : "#001E2B"}
        labelFill="#00684A"
        isBreakSide={false}
      />

      {/* ── Delta box (centre) ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isChecking && (
          <motion.g
            key="delta"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ transformOrigin: `${DELTA_X + DELTA_W / 2}px ${DELTA_Y + DELTA_H / 2}px` }}
            transition={SPRING.default}
          >
            <motion.rect
              x={DELTA_X} y={DELTA_Y} width={DELTA_W} height={DELTA_H} rx={14}
              animate={{ fill: deltaFill, stroke: deltaStroke }}
              fill={deltaFill} stroke={deltaStroke} strokeWidth={1.5}
              transition={SPRING.default}
            />
            <text x={DELTA_X + DELTA_W / 2} y={DELTA_Y + 24} textAnchor="middle" className={styles.deltaEyebrow} fill="#5C6C75">
              BALANCE DELTA
            </text>
            <motion.text
              x={DELTA_X + DELTA_W / 2} y={DELTA_Y + 56} textAnchor="middle"
              className={styles.deltaAmount}
              animate={{ fill: deltaColor }}
              transition={SPRING.default}
            >
              Δ = {deltaAmt}
            </motion.text>
            <motion.text
              x={DELTA_X + DELTA_W / 2} y={DELTA_Y + 76} textAnchor="middle"
              className={styles.deltaStatus}
              animate={{ fill: deltaColor }}
              transition={SPRING.default}
            >
              {deltaLabel}
            </motion.text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* ── Balance seal (RESOLVED) ──────────────────────────────────────── */}
      <AnimatePresence>
        {isResolved && (
          <motion.g
            key="seal"
            initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
            animate={{ opacity: 0.13, scale: 1, rotate: -18 }}
            exit={{ opacity: 0 }}
            style={{ transformOrigin: `${BEAM_MID_X}px 200px` }}
            transition={{ ...SPRING.default, delay: 0.2 }}
          >
            <circle cx={BEAM_MID_X} cy={200} r={96} fill="none" stroke="#00684A" strokeWidth={5} />
            <circle cx={BEAM_MID_X} cy={200} r={86} fill="none" stroke="#00684A" strokeWidth={1} strokeDasharray="5 4" />
            <text x={BEAM_MID_X} y={194} textAnchor="middle" className={styles.sealText} fill="#00684A">BALANCED</text>
            <text x={BEAM_MID_X} y={216} textAnchor="middle" className={styles.sealSub} fill="#00684A">ZERO TOLERANCE</text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* ── Exception ticket ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showExc && (
          <motion.g
            key="ticket"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING.default}
          >
            {/* Card body */}
            <motion.rect
              x={TICKET_X} y={TICKET_Y} width={TICKET_W} height={TICKET_H} rx={10}
              animate={{ fill: excBg, stroke: excBorder }}
              fill={excBg} stroke={excBorder} strokeWidth={1.5}
              transition={SPRING.default}
            />
            {/* Left accent stripe */}
            <motion.rect
              x={TICKET_X} y={TICKET_Y} width={6} height={TICKET_H} rx={6}
              animate={{ fill: excAccent }}
              fill={excAccent}
              transition={SPRING.default}
            />

            {/* Exception ID */}
            <text x={TICKET_X + 22} y={TICKET_Y + 22} className={styles.excId}>
              {RECONCILE_EXCEPTION.exceptionId}
            </text>
            {/* Type */}
            <rect x={TICKET_X + 216} y={TICKET_Y + 9} width={152} height={18} rx={9}
              fill={excAccent} opacity={0.12} />
            <text x={TICKET_X + 292} y={TICKET_Y + 22} textAnchor="middle" className={styles.excTypePill} fill={excAccent}>
              AMOUNT_MISMATCH
            </text>
            {/* Break amount */}
            <text x={TICKET_X + 390} y={TICKET_Y + 22} className={styles.excBreak} fill={isResolved ? "#00684A" : "#C82430"}>
              Δ $1.00
            </text>
            {/* Priority + SLA */}
            <text x={TICKET_X + 470} y={TICKET_Y + 22} className={styles.excMeta}>
              HIGH · SLA 8h · controlAccount 2100
            </text>

            {/* Status badge (right) */}
            <motion.rect
              x={TICKET_X + TICKET_W - 220} y={TICKET_Y + 7} width={204} height={20} rx={10}
              animate={{ fill: excAccent }} fill={excAccent} opacity={0.12}
              transition={SPRING.default}
            />
            <motion.text
              x={TICKET_X + TICKET_W - 118} y={TICKET_Y + 21}
              textAnchor="middle"
              className={styles.excStatus}
              animate={{ fill: excAccent }}
              fill={excAccent}
              transition={SPRING.default}
            >
              {isResolved ? "✓ RESOLVED" : excStatus}
            </motion.text>

            {/* Bottom note line */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.text
                key={excStatus}
                x={TICKET_X + 22} y={TICKET_Y + 52}
                className={styles.excNote}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {isResolved
                  ? `Period 2026-04 close unblocked · correction JNL-20260506-CORR-001 · re-run BALANCED`
                  : hasCor
                  ? `${CORRECTION_JOURNAL.journalId} posted · $1.00 ADJUSTMENT · FX pence-rounding fix on SL-20260430-047823`
                  : isInv
                  ? `analyst.frida: "Investigating — checking SL-20260430-047823 for pence-rounding error in FX conversion"`
                  : `Auto-detected: Σ(subLedgerEntries.amount) − Σ(GL 2100) = $1.00 · Assigned to reconciliation team`
                }
              </motion.text>
            </AnimatePresence>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Idle state label */}
      {!isActive && (
        <text
          x={BEAM_MID_X} y={COL_Y + COL_H / 2 + 8}
          textAnchor="middle"
          className={styles.idleHint}
          opacity={0.35}
        >
          Press Simulate →
        </text>
      )}
    </svg>
  );
}
