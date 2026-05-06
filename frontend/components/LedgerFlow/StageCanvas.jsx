"use client";

import React, { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import EquilibriumBadge from "./EquilibriumBadge";
import { SPRING } from "./motionConfig";
import styles from "./StageCanvas.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// SVG structural diagram (left ~62%)  +  R3F vessels canvas (right ~38%)
// Light theme, LG-flavoured. Single 1200×620 viewBox for the SVG.
// ─────────────────────────────────────────────────────────────────────────────

// 1600×400 ≈ 4:1. SVG uses preserveAspectRatio="xMidYMid slice" to fill
// container edge-to-edge regardless of viewport ratio. Frida (left) →
// pipeline → Bo (right) — full left-to-right narrative.
const VB = { w: 1700, h: 420, ox: -50, oy: -10 };

const ANCHOR = {
  customer:  { x: 90,   y: 200 },   // Frida
  payment:   { x: 240,  y: 200 },
  fork:      { x: 380,  y: 200 },
  subDr:     { x: 600,  y: 110 },
  subCr:     { x: 600,  y: 290 },
  membraneX: 840,
  journal:   { x: 1040, y: 200 },
  cdc:       { x: 1280, y: 200 },   // Change stream node
  recipient: { x: 1500, y: 200 },   // Bo
};

const EDGES = [
  {
    id: "e_customer_payment",
    activeOn: ["PAYMENT_INITIATED"],
    particleOn: "PAYMENT_INITIATED",
    d: `M ${ANCHOR.customer.x + 60} ${ANCHOR.customer.y} L ${ANCHOR.payment.x - 55} ${ANCHOR.payment.y}`,
  },
  {
    id: "e_payment_fork",
    activeOn: ["SUBLEDGER_DEBIT", "SUBLEDGER_CREDIT", "RECONCILE_SKIPPED", "JOURNAL_POSTED", "CHANGE_STREAM", "BALANCE_PROJECTED_DEBIT", "BALANCE_PROJECTED_CREDIT", "SETTLED"],
    particleOn: null,
    thick: true,
    d: `M ${ANCHOR.payment.x + 55} ${ANCHOR.payment.y} L ${ANCHOR.fork.x} ${ANCHOR.fork.y}`,
  },
  {
    id: "e_fork_subDr",
    activeOn: ["SUBLEDGER_DEBIT", "SUBLEDGER_CREDIT", "RECONCILE_SKIPPED", "JOURNAL_POSTED", "CHANGE_STREAM", "BALANCE_PROJECTED_DEBIT", "BALANCE_PROJECTED_CREDIT", "SETTLED"],
    particleOn: "SUBLEDGER_DEBIT",
    fork: true,
    accent: "debit",
    d: `M ${ANCHOR.fork.x} ${ANCHOR.fork.y} C ${ANCHOR.fork.x + 60} ${ANCHOR.fork.y}, ${ANCHOR.subDr.x - 100} ${ANCHOR.subDr.y}, ${ANCHOR.subDr.x - 115} ${ANCHOR.subDr.y}`,
  },
  {
    id: "e_fork_subCr",
    activeOn: ["SUBLEDGER_CREDIT", "RECONCILE_SKIPPED", "JOURNAL_POSTED", "CHANGE_STREAM", "BALANCE_PROJECTED_DEBIT", "BALANCE_PROJECTED_CREDIT", "SETTLED"],
    particleOn: "SUBLEDGER_CREDIT",
    fork: true,
    accent: "credit",
    d: `M ${ANCHOR.fork.x} ${ANCHOR.fork.y} C ${ANCHOR.fork.x + 60} ${ANCHOR.fork.y}, ${ANCHOR.subCr.x - 100} ${ANCHOR.subCr.y}, ${ANCHOR.subCr.x - 115} ${ANCHOR.subCr.y}`,
  },
  {
    id: "e_subDr_journal",
    activeOn: ["JOURNAL_POSTED", "CHANGE_STREAM", "BALANCE_PROJECTED_DEBIT", "BALANCE_PROJECTED_CREDIT", "SETTLED"],
    particleOn: "JOURNAL_POSTED",
    dashedThroughMembrane: true,
    d: `M ${ANCHOR.subDr.x + 115} ${ANCHOR.subDr.y} C ${ANCHOR.subDr.x + 160} ${ANCHOR.subDr.y}, ${ANCHOR.journal.x - 110} ${ANCHOR.journal.y - 32}, ${ANCHOR.journal.x - 60} ${ANCHOR.journal.y - 18}`,
  },
  {
    id: "e_subCr_journal",
    activeOn: ["JOURNAL_POSTED", "CHANGE_STREAM", "BALANCE_PROJECTED_DEBIT", "BALANCE_PROJECTED_CREDIT", "SETTLED"],
    particleOn: "JOURNAL_POSTED",
    accent: "credit",
    dashedThroughMembrane: true,
    d: `M ${ANCHOR.subCr.x + 115} ${ANCHOR.subCr.y} C ${ANCHOR.subCr.x + 160} ${ANCHOR.subCr.y}, ${ANCHOR.journal.x - 110} ${ANCHOR.journal.y + 32}, ${ANCHOR.journal.x - 60} ${ANCHOR.journal.y + 18}`,
  },
  {
    id: "e_journal_cdc",
    activeOn: ["CHANGE_STREAM", "BALANCE_PROJECTED_DEBIT", "BALANCE_PROJECTED_CREDIT", "SETTLED"],
    particleOn: "CHANGE_STREAM",
    d: `M ${ANCHOR.journal.x + 72} ${ANCHOR.journal.y} L ${ANCHOR.cdc.x - 64} ${ANCHOR.cdc.y}`,
  },
  {
    id: "e_cdc_recipient",
    activeOn: ["BALANCE_PROJECTED_DEBIT", "BALANCE_PROJECTED_CREDIT", "SETTLED"],
    particleOn: "BALANCE_PROJECTED_CREDIT",
    accent: "credit",
    d: `M ${ANCHOR.cdc.x + 64} ${ANCHOR.cdc.y} L ${ANCHOR.recipient.x - 60} ${ANCHOR.recipient.y}`,
  },
];

function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}
function hexPath(cx, cy, r) {
  return "M " + hexPoints(cx, cy, r).map((p) => p.join(",")).join(" L ") + " Z";
}

function particleCountForAmount(amount) {
  if (!amount || amount <= 0) return 6;
  const n = Math.round(6 + Math.log10(Math.max(amount, 1)) * 6);
  return Math.max(6, Math.min(28, n));
}

function CustomerNode({ reached, current, displayName, anchor = ANCHOR.customer, role = "Sender" }) {
  const cls = [styles.customer, reached ? styles.customerReached : "", current ? styles.customerCurrent : ""].filter(Boolean).join(" ");
  return (
    <g transform={`translate(${anchor.x},${anchor.y})`}>
      <motion.g
        className={cls}
        initial={false}
        animate={{ scale: reached ? 1 : 0.92, opacity: reached ? 1 : 0.55 }}
        transition={SPRING.default}
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
      >
        <circle r={42} className={styles.customerHalo} />
        <circle r={32} className={styles.customerDisc} />
        <text textAnchor="middle" y={7} className={styles.customerInitial}>{displayName?.[0] || "?"}</text>
        <text textAnchor="middle" y={68} className={styles.customerName}>{displayName}</text>
        <text textAnchor="middle" y={84} className={styles.customerRole}>{role}</text>
      </motion.g>
    </g>
  );
}

function PaymentNode({ reached, current, amount, currency }) {
  const cls = [styles.payment, reached ? styles.paymentReached : "", current ? styles.paymentCurrent : ""].filter(Boolean).join(" ");
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", minimumFractionDigits: 2 }).format(amount || 0);
  return (
    <g className={cls} transform={`translate(${ANCHOR.payment.x},${ANCHOR.payment.y})`}>
      <rect x={-50} y={-26} width={100} height={52} rx={26} ry={26} className={styles.paymentBody} />
      <text textAnchor="middle" y={-3} className={styles.paymentAmount}>{formatted}</text>
      <text textAnchor="middle" y={13} className={styles.paymentMicro}>PAYMENT</text>
    </g>
  );
}

function ForkPoint({ reached, debitTotal, creditTotal }) {
  const balanced = reached && debitTotal > 0 && Math.abs(debitTotal - creditTotal) < 0.005;
  const cls = [styles.fork, reached ? styles.forkReached : "", balanced ? styles.forkBalanced : ""].filter(Boolean).join(" ");
  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n || 0);
  const op = balanced ? "=" : "≠";
  return (
    <g className={cls} transform={`translate(${ANCHOR.fork.x},${ANCHOR.fork.y})`}>
      <circle r={9} className={styles.forkDot} />
      <g transform="translate(0,-62)">
        <rect x={-110} y={-18} width={220} height={32} rx={8} ry={8} className={styles.forkPlate} />
        <text textAnchor="middle" y={3} className={styles.forkEqn}>
          <tspan className={styles.forkLabel}>Σ Dr</tspan>
          <tspan dx={8} className={styles.forkValDr}>{fmt(debitTotal)}</tspan>
          <tspan dx={8} className={styles.forkEq}>{op}</tspan>
          <tspan dx={8} className={styles.forkLabel}>Σ Cr</tspan>
          <tspan dx={8} className={styles.forkValCr}>{fmt(creditTotal)}</tspan>
        </text>
      </g>
    </g>
  );
}

function SubLedgerLeg({ side, x, y, reached, current, amount, currency, accountId, displayName }) {
  const cls = [
    styles.subleg,
    side === "DEBIT" ? styles.subLegDr : styles.subLegCr,
    reached ? styles.sublegReached : "",
    current ? styles.sublegCurrent : "",
  ].filter(Boolean).join(" ");
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", minimumFractionDigits: 2 }).format(amount || 0);
  // "Settle into place" — slide in from the fork direction (+x, ±y).
  return (
    <g transform={`translate(${x},${y})`}>
      <motion.g
        className={cls}
        initial={false}
        animate={{
          opacity: reached ? 1 : 0.45,
          scale: reached ? 1 : 0.94,
        }}
        transition={SPRING.default}
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
      >
        <rect x={-115} y={-36} width={230} height={72} rx={12} ry={12} className={styles.sublegBody} />
        <text x={-98} y={-12} className={styles.sublegSide}>{side === "DEBIT" ? "Dr" : "Cr"}</text>
        <text x={-72} y={-12} className={styles.sublegLabel}>Sub-Ledger · {side}</text>
        <text x={-72} y={11} className={styles.sublegMeta}>{displayName} · 2100</text>
        <text x={100} y={8} textAnchor="end" className={styles.sublegAmount}>{formatted}</text>
      </motion.g>
    </g>
  );
}

function ReconcileMembrane({ reached, x, h, sublabel = "deferred" }) {
  const cls = [styles.membrane, reached ? styles.membraneReached : ""].filter(Boolean).join(" ");
  const top = 24;
  const bottom = h - 24;
  const span = bottom - top;
  return (
    <g className={cls}>
      <rect x={x - 22} y={top} width={44} height={span} rx={6} ry={6} className={styles.membraneField} />
      <line x1={x} y1={top} x2={x} y2={bottom} className={styles.membraneLine} />
      <g transform={`translate(${x},${top + 28})`} aria-hidden="true">
        <text textAnchor="middle" y={-4} className={styles.membraneTitle}>RECONCILE</text>
        <text textAnchor="middle" y={10} className={styles.membraneSub}>{sublabel}</text>
      </g>
    </g>
  );
}

// Deterministic sparkle positions inside hex radius — fixed seed so each run renders identical bursts.
const SPARKLES = Array.from({ length: 9 }, (_, i) => {
  const a = (i * (Math.PI * 2)) / 9 + (i % 2 ? 0.3 : -0.2);
  const r = 88 + (i % 3) * 14;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, delay: 0.04 * i };
});

function JournalCore({ reached, current, journalId }) {
  const { x, y } = ANCHOR.journal;
  const cls = [styles.journal, reached ? styles.journalReached : "", current ? styles.journalPulse : ""].filter(Boolean).join(" ");
  return (
    <g transform={`translate(${x},${y})`}>
      <motion.g
        className={cls}
        initial={false}
        animate={{ scale: current ? [1, 1.08, 1] : 1 }}
        transition={current ? { duration: 0.6, ease: [0.22, 0.7, 0.3, 1] } : SPRING.default}
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
      >
        <g className={styles.journalRings}>
          <path d={hexPath(0, 0, 84)} className={styles.journalRingA} />
          <path d={hexPath(0, 0, 110)} className={styles.journalRingB} />
          <path d={hexPath(0, 0, 138)} className={styles.journalRingC} />
        </g>
        <path d={hexPath(0, 0, 72)} className={styles.journalHexOuter} />
        <path d={hexPath(0, 0, 56)} className={styles.journalHexInner} />
        <AnimatePresence>
          {reached && (
            <motion.g key="sparkles" className={styles.sparkles}>
              {SPARKLES.map((s, i) => (
                <motion.circle
                  key={i}
                  cx={s.x}
                  cy={s.y}
                  r={2.4}
                  className={styles.sparkleDot}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.6], x: s.x * 0.18, y: s.y * 0.18 }}
                  transition={{ duration: 0.9, delay: s.delay, ease: "easeOut" }}
                />
              ))}
            </motion.g>
          )}
        </AnimatePresence>
        <text textAnchor="middle" y={5} className={styles.journalLabel}>GL JOURNAL</text>
        <text textAnchor="middle" y={84} className={styles.journalSub}>FinancialBookingLog</text>
        {journalId && <text textAnchor="middle" y={100} className={styles.journalId}>{journalId}</text>}
      </motion.g>
    </g>
  );
}

function ChangeStreamNode({ reached }) {
  const { x, y } = ANCHOR.cdc;
  return (
    <g transform={`translate(${x},${y})`}>
      <motion.g
        initial={false}
        animate={{ opacity: reached ? 1 : 0.28, scale: reached ? 1 : 0.9 }}
        transition={SPRING.default}
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
      >
        <rect x={-62} y={-14} width={124} height={28} rx={14} className={styles.cdcNode} />
        <circle cx={-42} cy={0} r={4} className={styles.cdcDot} />
        <text x={-30} y={4} className={styles.cdcLabel}>CHANGE STREAM</text>
      </motion.g>
    </g>
  );
}

function ChangeStreamWavefront({ visible, originX, originY }) {
  if (!visible) return null;
  return (
    <g className={styles.wavefrontGroup} aria-hidden="true">
      <circle cx={originX} cy={originY} r={1} className={styles.wavefrontA} />
      <circle cx={originX} cy={originY} r={1} className={styles.wavefrontB} />
      <circle cx={originX} cy={originY} r={1} className={styles.wavefrontC} />
    </g>
  );
}

const StageCanvas = ({ state, reconcileSublabel }) => {
  const reachedStages = state.reachedStages || {};
  const currentStage = state.currentStage;
  const balances = state.balances || {};
  const totals = state.totals || { debit: 0, credit: 0 };
  const amount = state.payment?.amount || 0;
  const currency = state.payment?.currency || "USD";
  const reached = (s) => reachedStages[s] != null;

  const fromName = Object.values(balances)[0]?.displayName || "Frida";
  const toName = Object.values(balances)[1]?.displayName || "Bo";
  const fromAcct = Object.keys(balances)[0] || "ACC-FRIDA-001";
  const toAcct = Object.keys(balances)[1] || "ACC-BO-001";

  // Particle bursts — count scales with payment amount.
  const bursts = useMemo(() => {
    const list = [];
    EDGES.forEach((e) => {
      if (!e.particleOn) return;
      const t = reachedStages[e.particleOn];
      if (!t) return;
      const n = particleCountForAmount(amount);
      for (let i = 0; i < n; i++) {
        list.push({
          id: `${e.id}-${t}-${i}`,
          d: e.d,
          delay: i * 110 + Math.random() * 90,
          duration: 1900 + Math.random() * 500,
          jitter: (Math.random() - 0.5) * 1.4,
          accent: e.accent,
        });
      }
    });
    return list;
  }, [reachedStages, amount]);

  return (
    <div className={styles.frame}>
      <div className={styles.atmosphere} aria-hidden="true" />

      <EquilibriumBadge debit={totals.debit} credit={totals.credit} active={state.status !== "IDLE"} />

      <div className={styles.stack}>
        {/* SVG structural diagram — fills entire canvas band */}
        <div className={styles.svgCol}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={styles.svg}
            viewBox={`${VB.ox} ${VB.oy} ${VB.w} ${VB.h}`}
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label="Ledger flow — payment to GL journal"
            style={{ minHeight: 0 }}
          >
            <defs>
              <pattern id="hexLatticeLight" x="0" y="0" width="40" height="34.64" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 40 11.55 L 40 23.09 L 20 34.64 L 0 23.09 L 0 11.55 Z" className={styles.hexLatticeStroke} />
              </pattern>
              <radialGradient id="journalGradLight" cx="50%" cy="50%" r="60%">
                <stop offset="0%" className={styles.journalGradStopA} />
                <stop offset="60%" className={styles.journalGradStopB} />
                <stop offset="100%" className={styles.journalGradStopC} />
              </radialGradient>
              <marker id="arrowGreenLight" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className={styles.arrowGreenFill} />
              </marker>
              <marker id="arrowMutedLight" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className={styles.arrowMutedFill} />
              </marker>
            </defs>

            <rect x={VB.ox} y={VB.oy} width={VB.w} height={VB.h} fill="url(#hexLatticeLight)" className={styles.hexLatticeRect} />

            <g className={styles.edges}>
              {EDGES.map((e) => {
                const active = e.activeOn.some((s) => reached(s));
                const cls = [
                  styles.edge,
                  active ? styles.edgeActive : "",
                  e.thick ? styles.edgeThick : "",
                  e.fork ? styles.edgeFork : "",
                  e.dashedThroughMembrane ? styles.edgeMembrane : "",
                  e.accent === "debit" ? styles.edgeAccentDebit : "",
                  e.accent === "credit" ? styles.edgeAccentCredit : "",
                ].filter(Boolean).join(" ");
                return (
                  <path key={e.id} d={e.d} className={cls} markerEnd={active ? "url(#arrowGreenLight)" : "url(#arrowMutedLight)"} />
                );
              })}
            </g>

            <ReconcileMembrane reached={reached("RECONCILE_SKIPPED")} x={ANCHOR.membraneX} h={VB.h} sublabel={reconcileSublabel} />
            <ChangeStreamWavefront visible={reached("CHANGE_STREAM")} originX={ANCHOR.journal.x} originY={ANCHOR.journal.y} />

            <CustomerNode
              reached={reached("PAYMENT_INITIATED")}
              current={currentStage === "PAYMENT_INITIATED"}
              displayName={fromName}
              anchor={ANCHOR.customer}
              role="Sender"
            />
            <CustomerNode
              reached={reached("BALANCE_PROJECTED_CREDIT")}
              current={currentStage === "BALANCE_PROJECTED_CREDIT" || currentStage === "SETTLED"}
              displayName={toName}
              anchor={ANCHOR.recipient}
              role="Recipient"
            />
            <PaymentNode reached={reached("PAYMENT_INITIATED")} current={currentStage === "PAYMENT_INITIATED"} amount={amount} currency={currency} />
            <ForkPoint reached={reached("SUBLEDGER_DEBIT")} debitTotal={totals.debit} creditTotal={totals.credit} />

            <SubLedgerLeg side="DEBIT" x={ANCHOR.subDr.x} y={ANCHOR.subDr.y} reached={reached("SUBLEDGER_DEBIT")} current={currentStage === "SUBLEDGER_DEBIT"} amount={amount} currency={currency} accountId={fromAcct} displayName={fromName} />
            <SubLedgerLeg side="CREDIT" x={ANCHOR.subCr.x} y={ANCHOR.subCr.y} reached={reached("SUBLEDGER_CREDIT")} current={currentStage === "SUBLEDGER_CREDIT"} amount={amount} currency={currency} accountId={toAcct} displayName={toName} />

            <JournalCore reached={reached("JOURNAL_POSTED")} current={currentStage === "JOURNAL_POSTED"} journalId={state.identifiers?.journalId} />
            <ChangeStreamNode reached={reached("CHANGE_STREAM")} />

            <g className={styles.particles} aria-hidden="true">
              {bursts.map((p) => (
                <circle
                  key={p.id}
                  r={3.2}
                  className={[styles.particle, p.accent === "debit" ? styles.particleDebit : "", p.accent === "credit" ? styles.particleCredit : ""].filter(Boolean).join(" ")}
                  style={{
                    offsetPath: `path('${p.d}')`,
                    WebkitOffsetPath: `path('${p.d}')`,
                    animationDelay: `${p.delay}ms`,
                    animationDuration: `${p.duration}ms`,
                    transform: `translateY(${p.jitter}px)`,
                  }}
                />
              ))}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StageCanvas;
