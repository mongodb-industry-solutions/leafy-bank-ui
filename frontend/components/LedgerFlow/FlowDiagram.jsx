"use client";

import React, { useMemo } from "react";
import Tooltip from "@leafygreen-ui/tooltip";
import styles from "./FlowDiagram.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Layout — single 1200×640 viewBox. Read left → right:
//   Customer → Payment → (forking conduit) → Sub-Ledger DEBIT / CREDIT
//   → Reconcile membrane (bypass) → GL Journal hex-core
//   → Change Stream wavefront → Vessel · Frida & Vessel · Bo
// All coordinates derive from a small set of anchors so labels and edges
// stay in sync if we tune positions.
// ─────────────────────────────────────────────────────────────────────────────

const VB = { w: 1200, h: 640 };

const ANCHOR = {
  customer:    { x: 90,   y: 320 },
  payment:     { x: 250,  y: 320 },
  fork:        { x: 380,  y: 320 },
  subDr:       { x: 540,  y: 230 },
  subCr:       { x: 540,  y: 410 },
  membraneX:   720,                 // vertical reconcile membrane
  journal:     { x: 880,  y: 320 }, // hex-core centre
  vesselFrom:  { x: 1050, y: 470 },
  vesselTo:    { x: 1150, y: 470 },
};

// Vessel rendering constants (used by FlowDiagram + VesselsLayer).
const VESSEL_W = 64;
const VESSEL_H = 220;
const VESSEL_TOP_Y = ANCHOR.vesselFrom.y - VESSEL_H + 30;

// ─────────────────────────────────────────────────────────────────────────────
// Edges — for non-fluid connectors (customer→payment, payment→fork,
// fork→subDr/subCr, subLeg→journal, journal→vessels). Reconcile membrane
// is rendered as a vertical line, not an edge.
// ─────────────────────────────────────────────────────────────────────────────

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
    d: `M ${ANCHOR.fork.x} ${ANCHOR.fork.y} C ${ANCHOR.fork.x + 60} ${ANCHOR.fork.y}, ${ANCHOR.subDr.x - 80} ${ANCHOR.subDr.y}, ${ANCHOR.subDr.x - 95} ${ANCHOR.subDr.y}`,
  },
  {
    id: "e_fork_subCr",
    activeOn: ["SUBLEDGER_CREDIT", "RECONCILE_SKIPPED", "JOURNAL_POSTED", "CHANGE_STREAM", "BALANCE_PROJECTED_DEBIT", "BALANCE_PROJECTED_CREDIT", "SETTLED"],
    particleOn: "SUBLEDGER_CREDIT",
    fork: true,
    d: `M ${ANCHOR.fork.x} ${ANCHOR.fork.y} C ${ANCHOR.fork.x + 60} ${ANCHOR.fork.y}, ${ANCHOR.subCr.x - 80} ${ANCHOR.subCr.y}, ${ANCHOR.subCr.x - 95} ${ANCHOR.subCr.y}`,
  },
  {
    id: "e_subDr_journal",
    activeOn: ["JOURNAL_POSTED", "CHANGE_STREAM", "BALANCE_PROJECTED_DEBIT", "BALANCE_PROJECTED_CREDIT", "SETTLED"],
    particleOn: "JOURNAL_POSTED",
    dashedThroughMembrane: true,
    d: `M ${ANCHOR.subDr.x + 95} ${ANCHOR.subDr.y} C ${ANCHOR.subDr.x + 160} ${ANCHOR.subDr.y}, ${ANCHOR.journal.x - 110} ${ANCHOR.journal.y - 28}, ${ANCHOR.journal.x - 60} ${ANCHOR.journal.y - 18}`,
  },
  {
    id: "e_subCr_journal",
    activeOn: ["JOURNAL_POSTED", "CHANGE_STREAM", "BALANCE_PROJECTED_DEBIT", "BALANCE_PROJECTED_CREDIT", "SETTLED"],
    particleOn: null,
    dashedThroughMembrane: true,
    d: `M ${ANCHOR.subCr.x + 95} ${ANCHOR.subCr.y} C ${ANCHOR.subCr.x + 160} ${ANCHOR.subCr.y}, ${ANCHOR.journal.x - 110} ${ANCHOR.journal.y + 28}, ${ANCHOR.journal.x - 60} ${ANCHOR.journal.y + 18}`,
  },
];

// Hex-core geometry — six vertices for a regular hexagon centred on the journal.
function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6; // flat-top
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function hexPath(cx, cy, r) {
  const pts = hexPoints(cx, cy, r);
  return "M " + pts.map((p) => p.join(",")).join(" L ") + " Z";
}

// Particle counts derived from amount. $250 → ~8, $5,000 → ~25, capped.
function particleCountForAmount(amount) {
  if (!amount || amount <= 0) return 6;
  const n = Math.round(6 + Math.log10(Math.max(amount, 1)) * 6);
  return Math.max(6, Math.min(28, n));
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────

function StationLabel({ x, y, title, subtitle, reached, current, accent }) {
  const cls = [
    styles.stationLabel,
    reached ? styles.stationReached : "",
    current ? styles.stationCurrent : "",
    accent ? styles[`stationAccent_${accent}`] : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <g className={cls} transform={`translate(${x},${y})`} aria-hidden="true">
      <text className={styles.stationTitle} x={0} y={0} textAnchor="middle">
        {title}
      </text>
      <text className={styles.stationSub} x={0} y={14} textAnchor="middle">
        {subtitle}
      </text>
    </g>
  );
}

function CustomerNode({ reached, current, displayName }) {
  const cls = [
    styles.customer,
    reached ? styles.customerReached : "",
    current ? styles.customerCurrent : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <g className={cls} transform={`translate(${ANCHOR.customer.x},${ANCHOR.customer.y})`}>
      <circle r={36} className={styles.customerHalo} />
      <circle r={28} className={styles.customerDisc} />
      <text textAnchor="middle" y={6} className={styles.customerInitial}>
        {displayName?.[0] || "?"}
      </text>
      <text textAnchor="middle" y={62} className={styles.customerName}>
        {displayName}
      </text>
    </g>
  );
}

function PaymentNode({ reached, current, amount, currency }) {
  const cls = [
    styles.payment,
    reached ? styles.paymentReached : "",
    current ? styles.paymentCurrent : "",
  ]
    .filter(Boolean)
    .join(" ");
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(amount || 0);
  return (
    <g className={cls} transform={`translate(${ANCHOR.payment.x},${ANCHOR.payment.y})`}>
      <rect x={-50} y={-26} width={100} height={52} rx={26} ry={26} className={styles.paymentBody} />
      <text textAnchor="middle" y={-3} className={styles.paymentAmount}>
        {formatted}
      </text>
      <text textAnchor="middle" y={13} className={styles.paymentMicro}>
        PAYMENT
      </text>
    </g>
  );
}

function ForkPoint({ reached, current, debitTotal, creditTotal, amount }) {
  const balanced =
    reached && debitTotal > 0 && Math.abs(debitTotal - creditTotal) < 0.005;
  const cls = [
    styles.fork,
    reached ? styles.forkReached : "",
    current ? styles.forkCurrent : "",
    balanced ? styles.forkBalanced : "",
  ]
    .filter(Boolean)
    .join(" ");
  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n || 0);
  const op = balanced ? "=" : "≠";
  return (
    <g className={cls} transform={`translate(${ANCHOR.fork.x},${ANCHOR.fork.y})`}>
      <circle r={9} className={styles.forkDot} />
      <g transform="translate(0,-58)">
        <rect x={-78} y={-16} width={156} height={28} rx={6} ry={6} className={styles.forkPlate} />
        <text textAnchor="middle" y={2} className={styles.forkEqn}>
          <tspan className={styles.forkLabel}>Σ Dr</tspan>
          <tspan dx={6} className={styles.forkValDr}>{fmt(debitTotal)}</tspan>
          <tspan dx={6} className={styles.forkEq}>{op}</tspan>
          <tspan dx={6} className={styles.forkLabel}>Σ Cr</tspan>
          <tspan dx={6} className={styles.forkValCr}>{fmt(creditTotal)}</tspan>
        </text>
      </g>
    </g>
  );
}

function SubLedgerLeg({ side, x, y, reached, current, amount, currency, accountId }) {
  const cls = [
    styles.subleg,
    side === "DEBIT" ? styles.subLegDr : styles.subLegCr,
    reached ? styles.sublegReached : "",
    current ? styles.sublegCurrent : "",
  ]
    .filter(Boolean)
    .join(" ");
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(amount || 0);
  return (
    <g className={cls} transform={`translate(${x},${y})`}>
      <rect x={-95} y={-30} width={190} height={60} rx={10} ry={10} className={styles.sublegBody} />
      <text x={-80} y={-10} className={styles.sublegSide}>
        {side === "DEBIT" ? "Dr" : "Cr"}
      </text>
      <text x={-58} y={-10} className={styles.sublegLabel}>
        Sub-Ledger · {side}
      </text>
      <text x={-58} y={9} className={styles.sublegMeta}>
        Acct 2100 · {accountId}
      </text>
      <text x={82} y={6} textAnchor="end" className={styles.sublegAmount}>
        {formatted}
      </text>
    </g>
  );
}

function ReconcileMembrane({ reached, current, x, h }) {
  const cls = [
    styles.membrane,
    reached ? styles.membraneReached : "",
    current ? styles.membraneCurrent : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <g className={cls}>
      <line x1={x} y1={80} x2={x} y2={h - 200} className={styles.membraneLine} />
      <rect
        x={x - 18}
        y={80}
        width={36}
        height={h - 280}
        rx={4}
        ry={4}
        className={styles.membraneField}
      />
      <g transform={`translate(${x},${72})`} aria-hidden="true">
        <text textAnchor="middle" y={-6} className={styles.membraneTitle}>
          RECONCILE
        </text>
        <text textAnchor="middle" y={6} className={styles.membraneSub}>
          BYPASSED · MVP
        </text>
      </g>
    </g>
  );
}

function JournalCore({ reached, current, journalId }) {
  const { x, y } = ANCHOR.journal;
  const cls = [
    styles.journal,
    reached ? styles.journalReached : "",
    current ? styles.journalPulse : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <g className={cls} transform={`translate(${x},${y})`}>
      {/* Equilibrium pulse rings — emitted on JOURNAL_POSTED via journalPulse */}
      <g className={styles.journalRings}>
        <path d={hexPath(0, 0, 64)} className={styles.journalRingA} />
        <path d={hexPath(0, 0, 84)} className={styles.journalRingB} />
        <path d={hexPath(0, 0, 104)} className={styles.journalRingC} />
      </g>
      <path d={hexPath(0, 0, 56)} className={styles.journalHexOuter} />
      <path d={hexPath(0, 0, 44)} className={styles.journalHexInner} />
      <text textAnchor="middle" y={-3} className={styles.journalLabel}>
        GL JOURNAL
      </text>
      <text textAnchor="middle" y={14} className={styles.journalSub}>
        FinancialBookingLog
      </text>
      {journalId && (
        <text textAnchor="middle" y={78} className={styles.journalId}>
          {journalId}
        </text>
      )}
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

function Vessel({ x, y, width, height, balance, before, ceiling, label, accountId, reached, isCredit }) {
  const ratio = ceiling > 0 ? Math.max(0, Math.min(1, balance / ceiling)) : 0;
  const fillH = height * ratio;
  const fillY = y + (height - fillH);

  const beforeRatio = ceiling > 0 ? Math.max(0, Math.min(1, before / ceiling)) : 0;
  const beforeY = y + height * (1 - beforeRatio);

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n || 0);

  const cls = [
    styles.vessel,
    reached ? styles.vesselReached : "",
    isCredit ? styles.vesselCredit : styles.vesselDebit,
  ]
    .filter(Boolean)
    .join(" ");

  // Meniscus path — gentle sine-wave top.
  const cx = x + width / 2;
  const meniscus = `M ${x} ${fillY}
    C ${x + width * 0.25} ${fillY - 4}, ${x + width * 0.55} ${fillY + 4}, ${x + width} ${fillY}
    L ${x + width} ${y + height} L ${x} ${y + height} Z`;

  return (
    <g className={cls}>
      <defs>
        <clipPath id={`clip-${accountId}`}>
          <rect x={x} y={y} width={width} height={height} rx={10} ry={10} />
        </clipPath>
      </defs>
      {/* Glass */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={10}
        ry={10}
        className={styles.vesselGlass}
      />
      {/* "Before" reference line */}
      <line
        x1={x - 4}
        y1={beforeY}
        x2={x + width + 4}
        y2={beforeY}
        className={styles.vesselBeforeLine}
      />
      {/* Liquid (clipped to glass) */}
      <g clipPath={`url(#clip-${accountId})`}>
        <path d={meniscus} className={styles.vesselLiquid} />
        <path d={meniscus} className={styles.vesselLiquidGloss} />
      </g>
      {/* Tick marks */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={x + width - 8}
          y1={y + height * (1 - t)}
          x2={x + width}
          y2={y + height * (1 - t)}
          className={styles.vesselTick}
        />
      ))}
      {/* Labels */}
      <text x={cx} y={y - 14} textAnchor="middle" className={styles.vesselTitle}>
        {label}
      </text>
      <text x={cx} y={y + height + 16} textAnchor="middle" className={styles.vesselAcct}>
        {accountId}
      </text>
      <text x={cx} y={y + height + 32} textAnchor="middle" className={styles.vesselBalance}>
        {fmt(balance)}
      </text>
    </g>
  );
}

function EquilibriumBadge({ debit, credit, active }) {
  const balanced = active && debit > 0 && Math.abs(debit - credit) < 0.005;
  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n || 0);
  const cls = [
    styles.equilibrium,
    active ? styles.equilibriumActive : "",
    balanced ? styles.equilibriumBalanced : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} aria-live="polite">
      <span className={styles.equilibriumDot} aria-hidden="true" />
      <span className={styles.equilibriumLabel}>Equilibrium</span>
      <span className={styles.equilibriumValDr}>{fmt(debit)}</span>
      <span className={styles.equilibriumOp}>=</span>
      <span className={styles.equilibriumValCr}>{fmt(credit)}</span>
      <span className={styles.equilibriumCheck} aria-hidden="true">
        {balanced ? "✓" : "·"}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

const FlowDiagram = ({ state }) => {
  const reachedStages = state.reachedStages || {};
  const currentStage = state.currentStage;
  const balances = state.balances || {};
  const totals = state.totals || { debit: 0, credit: 0 };
  const amount = state.payment?.amount || 0;
  const currency = state.payment?.currency || "USD";

  const reached = (s) => reachedStages[s] != null;
  const has = (s) => reached(s);

  // Particle bursts. Each emit creates N particles for that edge with
  // staggered phase offsets so they read as a stream.
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
          delay: i * 70 + Math.random() * 60,
          duration: 1100 + Math.random() * 350,
          jitter: (Math.random() - 0.5) * 1.4,
          warm: e.warm || false,
          fork: e.fork || false,
        });
      }
    });
    return list;
  }, [reachedStages, amount]);

  // Vessel data — scaled to a shared ceiling so both vessels read on the same
  // visual scale; legible even when balances differ.
  const vessels = useMemo(() => {
    const ids = Object.keys(balances);
    if (ids.length === 0) return [];
    const ceiling = balances[ids[0]]?.ceiling || 1;
    return [
      ids[0]
        ? {
            x: ANCHOR.vesselFrom.x - VESSEL_W / 2,
            y: VESSEL_TOP_Y,
            width: VESSEL_W,
            height: VESSEL_H,
            accountId: ids[0],
            label: balances[ids[0]].displayName,
            balance: balances[ids[0]].current,
            before: balances[ids[0]].before,
            ceiling,
            reached: has("BALANCE_PROJECTED_DEBIT"),
            isCredit: false,
          }
        : null,
      ids[1]
        ? {
            x: ANCHOR.vesselTo.x - VESSEL_W / 2,
            y: VESSEL_TOP_Y,
            width: VESSEL_W,
            height: VESSEL_H,
            accountId: ids[1],
            label: balances[ids[1]].displayName,
            balance: balances[ids[1]].current,
            before: balances[ids[1]].before,
            ceiling,
            reached: has("BALANCE_PROJECTED_CREDIT"),
            isCredit: true,
          }
        : null,
    ].filter(Boolean);
  }, [balances, reachedStages]);

  return (
    <div className={styles.frame}>
      {/* Atmospheric current — slow gradient drift behind everything */}
      <div className={styles.atmosphere} aria-hidden="true" />

      {/* Equilibrium badge — top-right */}
      <EquilibriumBadge
        debit={totals.debit}
        credit={totals.credit}
        active={state.status !== "IDLE"}
      />

      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svg}
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Ledger flow — payment to balance"
      >
        <defs>
          <pattern
            id="hexlattice"
            x="0"
            y="0"
            width="40"
            height="34.64"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 40 11.55 L 40 23.09 L 20 34.64 L 0 23.09 L 0 11.55 Z"
              className={styles.hexLatticeStroke}
            />
          </pattern>
          <radialGradient id="journalGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" className={styles.journalGradStopA} />
            <stop offset="60%" className={styles.journalGradStopB} />
            <stop offset="100%" className={styles.journalGradStopC} />
          </radialGradient>
          <linearGradient id="liquidGradFrom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className={styles.liquidStopFromA} />
            <stop offset="100%" className={styles.liquidStopFromB} />
          </linearGradient>
          <linearGradient id="liquidGradTo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className={styles.liquidStopToA} />
            <stop offset="100%" className={styles.liquidStopToB} />
          </linearGradient>
          <marker
            id="arrowGreen"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className={styles.arrowGreenFill} />
          </marker>
          <marker
            id="arrowMuted"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className={styles.arrowMutedFill} />
          </marker>
        </defs>

        {/* Hex lattice — faint structural ground */}
        <rect width={VB.w} height={VB.h} fill="url(#hexlattice)" className={styles.hexLatticeRect} />

        {/* Edges */}
        <g className={styles.edges}>
          {EDGES.map((e) => {
            const active = e.activeOn.some((s) => reached(s));
            const cls = [
              styles.edge,
              active ? styles.edgeActive : "",
              e.thick ? styles.edgeThick : "",
              e.fork ? styles.edgeFork : "",
              e.dashedThroughMembrane ? styles.edgeMembrane : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <path
                key={e.id}
                d={e.d}
                className={cls}
                markerEnd={active ? "url(#arrowGreen)" : "url(#arrowMuted)"}
              />
            );
          })}
        </g>

        {/* Reconcile membrane — sits behind the journal core */}
        <Tooltip
          align="top"
          justify="middle"
          trigger={
            <g style={{ cursor: "help" }}>
              <ReconcileMembrane
                x={ANCHOR.membraneX}
                h={VB.h}
                reached={has("RECONCILE_SKIPPED")}
                current={currentStage === "RECONCILE_SKIPPED"}
              />
            </g>
          }
        >
          MVP: double-entry balance is enforced by application code (sum of debits = sum of credits before status=POSTED). Period-close gating, sub-ledger ↔ GL reconciliation jobs, and the accountingPeriods lifecycle are deferred to Phase 2.
        </Tooltip>

        {/* Change-stream wavefront — emits from journal toward vessels */}
        <ChangeStreamWavefront
          visible={has("CHANGE_STREAM")}
          originX={ANCHOR.journal.x}
          originY={ANCHOR.journal.y}
        />

        {/* Customer · Payment · Fork */}
        <CustomerNode
          reached={has("PAYMENT_INITIATED")}
          current={currentStage === "PAYMENT_INITIATED"}
          displayName={balances[Object.keys(balances)[0]]?.displayName || "Frida"}
        />
        <PaymentNode
          reached={has("PAYMENT_INITIATED")}
          current={currentStage === "PAYMENT_INITIATED"}
          amount={amount}
          currency={currency}
        />
        <ForkPoint
          reached={has("SUBLEDGER_DEBIT")}
          current={currentStage === "SUBLEDGER_DEBIT" || currentStage === "SUBLEDGER_CREDIT"}
          debitTotal={totals.debit}
          creditTotal={totals.credit}
          amount={amount}
        />

        {/* Sub-ledger legs */}
        <SubLedgerLeg
          side="DEBIT"
          x={ANCHOR.subDr.x}
          y={ANCHOR.subDr.y}
          reached={has("SUBLEDGER_DEBIT")}
          current={currentStage === "SUBLEDGER_DEBIT"}
          amount={amount}
          currency={currency}
          accountId={Object.keys(balances)[0] || "ACC-FRIDA-001"}
        />
        <SubLedgerLeg
          side="CREDIT"
          x={ANCHOR.subCr.x}
          y={ANCHOR.subCr.y}
          reached={has("SUBLEDGER_CREDIT")}
          current={currentStage === "SUBLEDGER_CREDIT"}
          amount={amount}
          currency={currency}
          accountId={Object.keys(balances)[1] || "ACC-BO-001"}
        />

        {/* Journal hex-core — the climax */}
        <JournalCore
          reached={has("JOURNAL_POSTED")}
          current={currentStage === "JOURNAL_POSTED"}
          journalId={state.identifiers?.journalId}
        />

        {/* Vessels — Frida & Bo as liquid columns */}
        {vessels.map((v) => (
          <Vessel key={v.accountId} {...v} />
        ))}

        {/* Particle swarm — emitted along edges, each particle uses
            the edge's path as offset-path */}
        <g className={styles.particles} aria-hidden="true">
          {bursts.map((p) => (
            <circle
              key={p.id}
              r={3.2}
              className={`${styles.particle} ${p.fork ? styles.particleFork : ""}`}
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

      {/* Station labels — overlay on top of SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svgOverlay}
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <StationLabel
          x={ANCHOR.payment.x}
          y={ANCHOR.payment.y + 56}
          title=""
          subtitle="payment intent"
          reached={has("PAYMENT_INITIATED")}
          current={currentStage === "PAYMENT_INITIATED"}
        />
        <StationLabel
          x={ANCHOR.fork.x}
          y={ANCHOR.fork.y + 36}
          title=""
          subtitle="double-entry"
          reached={has("SUBLEDGER_DEBIT")}
        />
      </svg>
    </div>
  );
};

export default FlowDiagram;
