"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../LedgerFlow/motionConfig";
import styles from "./ReconcileCanvas.module.css";

const W = 1600, H = 440;

// 3 panels: TGB | SGL | TRIAL+GATES
const PANEL = {
  tgb:  { x: 30,   w: 450 },
  sgl:  { x: 540,  w: 450 },
  gate: { x: 1050, w: 510 },
};

function panelCx(p) { return p.x + p.w / 2; }

const GATES = [
  { key: "runBalanced", label: "All runs BALANCED",    stage: "GATE_RUN_BALANCED"  },
  { key: "sod",         label: "SoD verified",          stage: "GATE_SOD"           },
  { key: "trial",       label: "Trial balance Σ = 0",   stage: "GATE_TRIAL"         },
  { key: "noExceptions",label: "No open exceptions",    stage: "GATE_NO_EXCEPTIONS" },
];

function RunPanel({ x, w, label, subLabel, status, delta, count, loading, reached }) {
  const fill = status === "BALANCED" ? "#E3FCF7" : status === "UNBALANCED" ? "#FEF3CD" : status === "PIPELINE_LAG" ? "#FFF3E0" : "#F2F3F4";
  const stroke = status === "BALANCED" ? "#00A35C" : status === "UNBALANCED" ? "#916A00" : status === "PIPELINE_LAG" ? "#BF5700" : "#C1C7C6";
  const statusText = status === "BALANCED" ? "BALANCED" : status === "UNBALANCED" ? "UNBALANCED" : status === "PIPELINE_LAG" ? "PIPELINE LAG" : loading ? "SCANNING…" : "PENDING";
  const statusColor = status === "BALANCED" ? "#00684A" : status === "UNBALANCED" ? "#916A00" : status === "PIPELINE_LAG" ? "#BF5700" : "#889397";

  return (
    <g transform={`translate(${x},0)`}>
      <motion.g
        initial={false}
        animate={{ opacity: reached ? 1 : 0.38, y: reached ? 0 : 8 }}
        transition={SPRING.default}
      >
        {/* Panel card */}
        <rect y={40} width={w} height={320} rx={14} fill={fill} stroke={stroke} strokeWidth={reached ? 1.8 : 1} />

        {/* Header */}
        <rect y={40} width={w} height={46} rx={14} fill={stroke} opacity={reached ? 0.12 : 0.06} />
        <rect y={68} width={w} height={18} rx={0} fill={stroke} opacity={reached ? 0.12 : 0.06} />
        <text x={w / 2} y={58} textAnchor="middle" className={styles.panelTitle} fill={statusColor}>{label}</text>
        <text x={w / 2} y={74} textAnchor="middle" className={styles.panelSub} fill="#889397">{subLabel}</text>

        {/* Count / metric */}
        {count && (
          <text x={w / 2} y={130} textAnchor="middle" className={styles.panelCount} fill={statusColor}>{count}</text>
        )}

        {/* Status badge */}
        <rect x={w / 2 - 80} y={loading ? 155 : (count ? 148 : 130)} width={160} height={28} rx={8}
          fill={reached ? fill : "#F2F3F4"} stroke={stroke} strokeWidth={1.2} />
        <text x={w / 2} y={loading ? 170 : (count ? 167 : 149)} textAnchor="middle" className={styles.panelStatus} fill={statusColor}>
          {statusText}
        </text>

        {/* Delta */}
        {delta && (
          <text x={w / 2} y={220} textAnchor="middle" className={styles.panelDelta} fill={statusColor}>
            {`Δ ${delta}`}
          </text>
        )}
      </motion.g>
    </g>
  );
}

function GateRow({ x, y, w, gateKey, label, lit, current }) {
  const fill = lit ? "#E3FCF7" : "#F2F3F4";
  const stroke = lit ? "#00A35C" : "#C1C7C6";
  const checkColor = lit ? "#00684A" : "#C1C7C6";
  return (
    <motion.g
      initial={false}
      animate={{ opacity: lit || current ? 1 : 0.45 }}
      transition={SPRING.default}
    >
      <rect x={x} y={y} width={w} height={36} rx={8} fill={fill} stroke={stroke} strokeWidth={lit ? 1.5 : 1} />
      <text x={x + 14} y={y + 23} className={styles.gateCheck} fill={checkColor}>{lit ? "✓" : "○"}</text>
      <text x={x + 36} y={y + 23} className={styles.gateLabel} fill={lit ? "#001E2B" : "#889397"}>{label}</text>
    </motion.g>
  );
}

const ReconcileCanvas = ({ state }) => {
  const reconcile = state?.reconcile || {};
  const scenario = reconcile.scenario || "BALANCED";
  const currentStage = reconcile.currentStage;
  const reachedStages = reconcile.reachedStages || {};
  const gates = reconcile.gates || {};
  const tgbResult = reconcile.tgbResult;
  const sglResult = reconcile.sglResult;

  const reached = (s) => !!reachedStages[s];

  const tgbLoading = reached("RUN_TGB_START") && !reached("RUN_TGB_RESULT");
  const tgbStatus = tgbResult?.status || (tgbLoading ? null : null);
  const tgbDelta = tgbResult?.delta ? `$${parseFloat(tgbResult.delta.$numberDecimal).toFixed(2)}` : null;
  const tgbCount = tgbResult ? `${tgbResult.strandCount || 142} strands` : null;

  const sglLoading = reached("RUN_SGL_START") && !reached("RUN_SGL_RESULT");
  const sglStatus = sglResult?.status || (sglLoading ? null : null);
  const sglDelta = sglResult?.delta ? `$${parseFloat(sglResult.delta.$numberDecimal).toFixed(2)}` : null;
  const sglCount = sglResult ? `${sglResult.subLedgerCount || 58947} entries` : null;

  const isClosed = reached("PERIOD_CLOSED");

  const scenarioMap = {
    BALANCED: "Perfect Balance",
    STRAND_DRIFT: "Strand Drift Δ$0.10",
    SUB_GL_LAG: "Pipeline Lag",
  };

  return (
    <div className={styles.frame}>
      <div className={styles.atmosphere} aria-hidden="true" />
      <div className={styles.svgWrap}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={styles.svg}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Reconciliation canvas"
        >
          <rect width={W} height={H} fill="#FAFAF9" />

          {/* Scenario badge */}
          {currentStage && (
            <g>
              <rect x={W - 260} y={8} width={250} height={26} rx={6} fill="#E1F7FF" stroke="#016BF8" strokeWidth={1} />
              <text x={W - 135} y={25} textAnchor="middle" className={styles.scenarioBadge}>
                {`Scenario: ${scenarioMap[scenario] || scenario}`}
              </text>
            </g>
          )}

          {/* Panel column headers */}
          <text x={panelCx(PANEL.tgb)} y={28} textAnchor="middle" className={styles.columnHeader}>
            transferGroupBalance
          </text>
          <text x={panelCx(PANEL.sgl)} y={28} textAnchor="middle" className={styles.columnHeader}>
            subledgerToGL
          </text>
          <text x={panelCx(PANEL.gate)} y={28} textAnchor="middle" className={styles.columnHeader}>
            trialBalance · Period Close
          </text>

          {/* Dividers */}
          <line x1={510} y1={36} x2={510} y2={H - 10} stroke="#E8EDEB" strokeWidth={1} />
          <line x1={1020} y1={36} x2={1020} y2={H - 10} stroke="#E8EDEB" strokeWidth={1} />

          {/* TGB Panel */}
          <RunPanel
            x={PANEL.tgb.x} w={PANEL.tgb.w}
            label="Run 1" subLabel="per-strand continuous"
            status={tgbStatus}
            delta={tgbDelta && tgbStatus === "UNBALANCED" ? tgbDelta : null}
            count={tgbCount}
            loading={tgbLoading}
            reached={reached("RUN_TGB_START")}
          />

          {/* SGL Panel */}
          <RunPanel
            x={PANEL.sgl.x} w={PANEL.sgl.w}
            label="Run 2" subLabel="ASP glSummaryPipeline"
            status={sglStatus}
            delta={sglDelta && sglStatus !== "BALANCED" ? sglDelta : null}
            count={sglCount}
            loading={sglLoading}
            reached={reached("RUN_SGL_START")}
          />

          {/* Gate Panel */}
          <g transform={`translate(${PANEL.gate.x},0)`}>
            <motion.g
              initial={false}
              animate={{ opacity: reached("GATE_RUN_BALANCED") ? 1 : 0.38 }}
              transition={SPRING.default}
            >
              <rect y={40} width={PANEL.gate.w} height={320} rx={14}
                fill={isClosed ? "#E3FCF7" : "#F2F3F4"}
                stroke={isClosed ? "#00A35C" : "#C1C7C6"}
                strokeWidth={isClosed ? 2 : 1}
              />
              <rect y={40} width={PANEL.gate.w} height={46} rx={14}
                fill={isClosed ? "#00A35C" : "#C1C7C6"} opacity={0.12} />
              <rect y={68} width={PANEL.gate.w} height={18}
                fill={isClosed ? "#00A35C" : "#C1C7C6"} opacity={0.12} />
              <text x={PANEL.gate.w / 2} y={58} textAnchor="middle" className={styles.panelTitle}
                fill={isClosed ? "#00684A" : "#889397"}>4-Gate Period Close</text>
              <text x={PANEL.gate.w / 2} y={74} textAnchor="middle" className={styles.panelSub}
                fill="#889397">all must pass before close</text>

              {GATES.map((g, i) => (
                <GateRow
                  key={g.key}
                  x={16} y={96 + i * 46} w={PANEL.gate.w - 32}
                  gateKey={g.key}
                  label={g.label}
                  lit={!!gates[g.key]}
                  current={currentStage === g.stage}
                />
              ))}

              {/* PERIOD CLOSED banner */}
              <AnimatePresence>
                {isClosed && (
                  <motion.g
                    key="closed"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={SPRING.default}
                    style={{ transformOrigin: `${PANEL.gate.w / 2}px 310px` }}
                  >
                    <rect x={16} y={284} width={PANEL.gate.w - 32} height={58} rx={10}
                      fill="#00684A" stroke="#00684A" strokeWidth={1} />
                    <text x={PANEL.gate.w / 2} y={310} textAnchor="middle" className={styles.closedTitle}>
                      PERIOD CLOSED
                    </text>
                    <text x={PANEL.gate.w / 2} y={330} textAnchor="middle" className={styles.closedSub}>
                      LOCKED · GL entries immutable
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </motion.g>
          </g>

          {/* Exception indicator */}
          {(reached("TGB_EXCEPTION") && !reached("TGB_RESOLVED")) && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <rect x={PANEL.tgb.x + 16} y={280} width={PANEL.tgb.w - 32} height={56} rx={8}
                fill="#FDE7C8" stroke="#944F01" strokeWidth={1.5} />
              <text x={PANEL.tgb.x + PANEL.tgb.w / 2} y={304} textAnchor="middle" className={styles.excTitle}>
                ⚠ EXCEPTION OPEN
              </text>
              <text x={PANEL.tgb.x + PANEL.tgb.w / 2} y={322} textAnchor="middle" className={styles.excSub}>
                {scenario === "SUB_GL_LAG" ? "PIPELINE_LAG · paging operator" : "STRAND_DRIFT · investigating"}
              </text>
            </motion.g>
          )}
          {reached("TGB_RESOLVED") && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <rect x={PANEL.tgb.x + 16} y={280} width={PANEL.tgb.w - 32} height={56} rx={8}
                fill="#E3FCF7" stroke="#00A35C" strokeWidth={1.5} />
              <text x={PANEL.tgb.x + PANEL.tgb.w / 2} y={304} textAnchor="middle" className={styles.excTitle} style={{ fill: "#00684A" }}>
                ✓ EXCEPTION RESOLVED
              </text>
              <text x={PANEL.tgb.x + PANEL.tgb.w / 2} y={322} textAnchor="middle" className={styles.excSub} style={{ fill: "#00684A" }}>
                {scenario === "SUB_GL_LAG" ? "pipeline restarted · caught up" : "correction journal posted · re-run BALANCED"}
              </text>
            </motion.g>
          )}

          {/* Idle placeholder */}
          {!currentStage && (
            <g>
              <text x={W / 2} y={H / 2 - 12} textAnchor="middle" className={styles.idleTitle}>
                Reconciliation Engine
              </text>
              <text x={W / 2} y={H / 2 + 12} textAnchor="middle" className={styles.idleSub}>
                3 runs · 4-gate period close · zero tolerance
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default ReconcileCanvas;
