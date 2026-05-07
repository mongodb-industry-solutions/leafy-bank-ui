"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../LedgerFlow/motionConfig";
import styles from "./EngineCanvas.module.css";

// 1600×420 viewBox — left: document, center: 3 gate nodes, right: result
const VB = { w: 1600, h: 420 };

const GATE_X = 800;
const GATE_Y = [110, 210, 310];
const RESULT_X = 1300;
const DOC_X = 260;
const DOC_Y = 210;

const CHECKS = [
  { key: "PACIOLI", label: "Σ amountBaseMinor = 0", sub: "Pacioli · $expr" },
  { key: "SOD",     label: "createdBy ≠ approvedBy", sub: "SoD · $expr" },
  { key: "IDEMPOTENCY", label: "externalRef unique",  sub: "partial unique index" },
];

function stateForStage(stage) {
  if (!stage) return { failCheck: null, allPass: false };
  if (stage === "ENGINE_BALANCE_FAIL")    return { failCheck: "PACIOLI",     allPass: false };
  if (stage === "ENGINE_SOD_FAIL")        return { failCheck: "SOD",         allPass: false };
  if (stage === "ENGINE_IDEMPOTENCY_FAIL") return { failCheck: "IDEMPOTENCY", allPass: false };
  if (stage === "ENGINE_COMMIT")          return { failCheck: null,           allPass: true };
  return { failCheck: null, allPass: false };
}

function DocField({ y, label, value, highlight }) {
  return (
    <g>
      <text x={DOC_X - 110} y={DOC_Y - 90 + y} className={styles.docFieldLabel}>{label}:</text>
      <text
        x={DOC_X - 10} y={DOC_Y - 90 + y}
        className={highlight ? styles.docFieldValueHighlight : styles.docFieldValue}
      >{value}</text>
    </g>
  );
}

function GateNode({ x, y, check, stage, reached }) {
  const { failCheck, allPass } = stateForStage(stage);
  const isFailing = failCheck === check.key;
  const isPassing = allPass || (reached && !isFailing && failCheck !== null);
  const color = isFailing ? "#C03C0C" : isPassing ? "#00684A" : "#889397";
  const fill = isFailing ? "#FEF3CD" : isPassing ? "#E3FCF7" : "#F2F3F4";
  const stroke = isFailing ? "#944F01" : isPassing ? "#00A35C" : "#C1C7C6";

  return (
    <g transform={`translate(${x},${y})`}>
      <motion.g
        initial={false}
        animate={{ scale: (isFailing || isPassing) ? 1 : 0.92, opacity: reached || isFailing || isPassing ? 1 : 0.45 }}
        transition={SPRING.default}
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
      >
        <rect x={-140} y={-32} width={280} height={64} rx={14} ry={14}
          fill={fill} stroke={stroke} strokeWidth={1.5} />
        {isFailing && (
          <motion.rect
            x={-144} y={-36} width={288} height={72} rx={16} ry={16}
            fill="none" stroke="#C03C0C" strokeWidth={2.5} opacity={0.5}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0.3, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {isPassing && (
          <motion.rect
            x={-144} y={-36} width={288} height={72} rx={16} ry={16}
            fill="none" stroke="#00A35C" strokeWidth={2.5}
            initial={{ scale: 1, opacity: 0.75 }}
            animate={{ scale: 1.18, opacity: 0 }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
        <text x={0} y={-8} textAnchor="middle" className={styles.gateLabel} fill={color}>{check.label}</text>
        <text x={0} y={12} textAnchor="middle" className={styles.gateSub} fill={color}>{check.sub}</text>
        {isFailing && (
          <text x={118} y={-8} textAnchor="end" className={styles.gateResult} fill="#C03C0C">✗ FAIL</text>
        )}
        {isPassing && (
          <text x={118} y={-8} textAnchor="end" className={styles.gateResult} fill="#00684A">✓ PASS</text>
        )}
      </motion.g>
    </g>
  );
}

function ConnectorLine({ x1, y1, x2, y2, active, fail }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={fail ? "#C03C0C" : active ? "#00A35C" : "#C1C7C6"}
      strokeWidth={active || fail ? 2 : 1}
      strokeDasharray={fail ? "6 4" : "none"}
      opacity={active || fail ? 0.85 : 0.35}
    />
  );
}

const EngineCanvas = ({ state }) => {
  const engine = state?.engine || {};
  const currentStage = engine.currentStage;
  const reached = (s) => !!(engine.reachedStages || {})[s];
  const { failCheck, allPass } = stateForStage(currentStage);

  const anyReached = !!currentStage;
  const isFail = !!failCheck;
  const isCommit = currentStage === "ENGINE_COMMIT";

  const docFields = (() => {
    const evt = engine.events?.[engine.events.length - 1]?.payload;
    const doc = evt?.document;
    if (!doc) return [];
    if (currentStage === "ENGINE_BALANCE_FAIL") {
      return [
        { label: "lines[0].amountBaseMinor", value: doc.lines?.[0]?.amountBaseMinor ?? "-24990", highlight: true },
        { label: "lines[1].amountBaseMinor", value: doc.lines?.[1]?.amountBaseMinor ?? "+25000", highlight: false },
        { label: "Σ amountBaseMinor", value: "+10 (≠ 0)", highlight: true },
        { label: "createdBy", value: doc.createdBy || "payment-svc", highlight: false },
        { label: "approvedBy", value: doc.approvedBy || "risk-engine", highlight: false },
        { label: "externalRef", value: doc.externalRef || "FEDNOW-uetr-0f3a-4b11", highlight: false },
      ];
    }
    if (currentStage === "ENGINE_SOD_FAIL") {
      return [
        { label: "lines[0].amountBaseMinor", value: "-25000", highlight: false },
        { label: "lines[1].amountBaseMinor", value: "+25000", highlight: false },
        { label: "Σ amountBaseMinor", value: "0 ✓", highlight: false },
        { label: "createdBy", value: doc.createdBy || "alice", highlight: true },
        { label: "approvedBy", value: doc.approvedBy || "alice", highlight: true },
        { label: "externalRef", value: doc.externalRef || "FEDNOW-uetr-0f3a-4b11", highlight: false },
      ];
    }
    if (currentStage === "ENGINE_IDEMPOTENCY_FAIL") {
      return [
        { label: "lines[0].amountBaseMinor", value: "-25000", highlight: false },
        { label: "lines[1].amountBaseMinor", value: "+25000", highlight: false },
        { label: "Σ amountBaseMinor", value: "0 ✓", highlight: false },
        { label: "createdBy", value: doc.createdBy || "payment-svc", highlight: false },
        { label: "approvedBy", value: doc.approvedBy || "risk-engine", highlight: false },
        { label: "externalRef", value: doc.externalRef || "FEDNOW-uetr-0f3a-4b11 ← DUPE", highlight: true },
      ];
    }
    return [
      { label: "lines[0].amountBaseMinor", value: "-25000", highlight: false },
      { label: "lines[1].amountBaseMinor", value: "+25000", highlight: false },
      { label: "Σ amountBaseMinor", value: "0 ✓", highlight: false },
      { label: "createdBy", value: "payment-svc", highlight: false },
      { label: "approvedBy", value: "risk-engine", highlight: false },
      { label: "externalRef", value: "FEDNOW-uetr-9a7c-2e88 ✓ new", highlight: false },
    ];
  })();

  return (
    <div className={styles.frame}>
      <div className={styles.atmosphere} aria-hidden="true" />
      <div className={styles.svgWrap}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={styles.svg}
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="MongoDB engine validation gate"
        >
          {/* Background */}
          <rect width={VB.w} height={VB.h} fill="#FAFAF9" />

          {/* Section labels */}
          <text x={DOC_X} y={32} textAnchor="middle" className={styles.sectionLabel}>WRITE ATTEMPT</text>
          <text x={GATE_X} y={32} textAnchor="middle" className={styles.sectionLabel}>VALIDATION GATE</text>
          <text x={RESULT_X} y={32} textAnchor="middle" className={styles.sectionLabel}>RESULT</text>

          {/* Divider lines */}
          <line x1={530} y1={50} x2={530} y2={VB.h - 20} stroke="#E8EDEB" strokeWidth={1} />
          <line x1={1060} y1={50} x2={1060} y2={VB.h - 20} stroke="#E8EDEB" strokeWidth={1} />

          {/* Document box */}
          {anyReached && (
            <motion.g initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
              <rect x={DOC_X - 190} y={DOC_Y - 120} width={380} height={240} rx={14}
                fill="white" stroke={isFail ? "#944F01" : "#C1C7C6"} strokeWidth={1.5} />
              <rect x={DOC_X - 190} y={DOC_Y - 120} width={380} height={32} rx={14}
                fill={isFail ? "#FDE7C8" : isCommit ? "#E3FCF7" : "#F2F3F4"} />
              <rect x={DOC_X - 190} y={DOC_Y - 104} width={380} height={16} rx={0}
                fill={isFail ? "#FDE7C8" : isCommit ? "#E3FCF7" : "#F2F3F4"} />
              <text x={DOC_X} y={DOC_Y - 98} textAnchor="middle" className={styles.docTitle}>
                glJournalEntries (candidate)
              </text>
              {docFields.map((f, i) => (
                <DocField key={f.label} y={i * 26} label={f.label} value={String(f.value)} highlight={f.highlight} />
              ))}
            </motion.g>
          )}

          {/* Arrow from doc to gates */}
          {anyReached && (
            <g>
              <ConnectorLine x1={DOC_X + 190} y1={GATE_Y[0]} x2={GATE_X - 145} y2={GATE_Y[0]}
                active={allPass} fail={failCheck === "PACIOLI"} />
              <ConnectorLine x1={DOC_X + 190} y1={DOC_Y} x2={GATE_X - 145} y2={GATE_Y[1]}
                active={allPass} fail={failCheck === "SOD"} />
              <ConnectorLine x1={DOC_X + 190} y1={GATE_Y[2]} x2={GATE_X - 145} y2={GATE_Y[2]}
                active={allPass} fail={failCheck === "IDEMPOTENCY"} />
            </g>
          )}

          {/* Gate nodes */}
          {CHECKS.map((check, i) => (
            <GateNode
              key={check.key}
              x={GATE_X} y={GATE_Y[i]}
              check={check}
              stage={currentStage}
              reached={anyReached}
            />
          ))}

          {/* Arrow from gates to result */}
          {anyReached && (
            <g>
              {isFail && (
                <ConnectorLine
                  x1={GATE_X + 142} y1={failCheck === "PACIOLI" ? GATE_Y[0] : failCheck === "SOD" ? GATE_Y[1] : GATE_Y[2]}
                  x2={RESULT_X - 130} y2={DOC_Y}
                  active={false} fail={true}
                />
              )}
              {allPass && (
                <ConnectorLine x1={GATE_X + 142} y1={GATE_Y[1]} x2={RESULT_X - 130} y2={DOC_Y} active={true} fail={false} />
              )}
            </g>
          )}

          {/* Result panel */}
          {anyReached && (
            <AnimatePresence mode="wait">
              {isFail && (
                <motion.g key="fail" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={SPRING.default} style={{ transformOrigin: `${RESULT_X}px ${DOC_Y}px` }}>
                  <rect x={RESULT_X - 128} y={DOC_Y - 80} width={256} height={160} rx={14}
                    fill="#FEF3CD" stroke="#916A00" strokeWidth={2} />
                  <text x={RESULT_X} y={DOC_Y - 44} textAnchor="middle" className={styles.resultIcon}>✗</text>
                  <text x={RESULT_X} y={DOC_Y - 14} textAnchor="middle" className={styles.resultTitle} fill="#C03C0C">WriteError</text>
                  <text x={RESULT_X} y={DOC_Y + 10} textAnchor="middle" className={styles.resultSub} fill="#944F01">Document failed</text>
                  <text x={RESULT_X} y={DOC_Y + 28} textAnchor="middle" className={styles.resultSub} fill="#944F01">validation</text>
                  <text x={RESULT_X} y={DOC_Y + 58} textAnchor="middle" className={styles.resultNote} fill="#5C6C75">
                    {failCheck === "IDEMPOTENCY" ? "E11000 duplicate key" : "$expr validator"}
                  </text>
                </motion.g>
              )}
              {allPass && (
                <motion.g key="pass" initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: [0.82, 1.1, 0.95, 1] }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }} style={{ transformOrigin: `${RESULT_X}px ${DOC_Y}px` }}>
                  <rect x={RESULT_X - 128} y={DOC_Y - 80} width={256} height={160} rx={14}
                    fill="#E3FCF7" stroke="#00A35C" strokeWidth={2} />
                  <text x={RESULT_X} y={DOC_Y - 44} textAnchor="middle" className={styles.resultIcon}>✓</text>
                  <text x={RESULT_X} y={DOC_Y - 14} textAnchor="middle" className={styles.resultTitle} fill="#00684A">COMMITTED</text>
                  <text x={RESULT_X} y={DOC_Y + 10} textAnchor="middle" className={styles.resultSub} fill="#00684A">IMMUTABLE</text>
                  <text x={RESULT_X} y={DOC_Y + 34} textAnchor="middle" className={styles.resultNote} fill="#5C6C75">w:majority · j:true</text>
                  <text x={RESULT_X} y={DOC_Y + 52} textAnchor="middle" className={styles.resultNote} fill="#5C6C75">snapshot isolation</text>
                </motion.g>
              )}
              {!isFail && !allPass && (
                <motion.g key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <rect x={RESULT_X - 128} y={DOC_Y - 80} width={256} height={160} rx={14}
                    fill="#F2F3F4" stroke="#C1C7C6" strokeWidth={1.5} />
                  <text x={RESULT_X} y={DOC_Y - 10} textAnchor="middle" className={styles.resultSub} fill="#889397">awaiting</text>
                  <text x={RESULT_X} y={DOC_Y + 10} textAnchor="middle" className={styles.resultSub} fill="#889397">validation</text>
                </motion.g>
              )}
            </AnimatePresence>
          )}

          {/* Idle state placeholder */}
          {!anyReached && (
            <g>
              <text x={VB.w / 2} y={VB.h / 2 - 12} textAnchor="middle" className={styles.idleTitle}>
                MongoDB Engine Validation Gate
              </text>
              <text x={VB.w / 2} y={VB.h / 2 + 12} textAnchor="middle" className={styles.idleSub}>
                3 checks · $expr + partial unique index · enforced at write time
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default EngineCanvas;
