"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../LedgerFlow/motionConfig";
import styles from "./ArchCanvas.module.css";

const W = 1600, H = 440;
const BAND_X = 30, BAND_W = 1540, BAND_H = 68, BAND_GAP = 8;

const LAYERS = [
  {
    key: "journal", label: "JOURNAL", sub: "append-only source of truth",
    y: 40,
    fill: "#E3FCF7", stroke: "#00A35C", accent: "#00684A", textColor: "#00684A",
    pills: [
      { name: "journalEntries",     w: 154, fill: "#C0FAE6", stroke: "#00A35C", text: "#00684A" },
      { name: "paymentInstructions",w: 192, fill: "#C0FAE6", stroke: "#00A35C", text: "#00684A" },
    ],
  },
  {
    key: "cdc", label: "CDC TIER", sub: "one change stream per collection",
    y: 40 + BAND_H + BAND_GAP,
    fill: "#EBF4FF", stroke: "#A5C7FF", accent: "#016BF8", textColor: "#016BF8",
    pills: [
      { name: "cdcResumeTokens", w: 164, fill: "#C4DEFF", stroke: "#6AA0F7", text: "#0B6CE9" },
    ],
  },
  {
    key: "asp", label: "ASP PROJECTION", sub: "read-optimized projections",
    y: 40 + 2 * (BAND_H + BAND_GAP),
    fill: "#F0EDFF", stroke: "#B8A9FF", accent: "#5C3DA4", textColor: "#5C3DA4",
    pills: [
      { name: "accountBalances",        w: 158, fill: "#E5DCFF", stroke: "#9F8EE8", text: "#5C3DA4" },
      { name: "customers",              w: 108, fill: "#E5DCFF", stroke: "#9F8EE8", text: "#5C3DA4" },
      { name: "reconciliationRuns",     w: 186, fill: "#E5DCFF", stroke: "#9F8EE8", text: "#5C3DA4" },
      { name: "reconciliationExceptions", w: 230, fill: "#E5DCFF", stroke: "#9F8EE8", text: "#5C3DA4" },
    ],
  },
  {
    key: "worm", label: "WORM SINK", sub: "SHA-256 hash chain · RFC 3161 timestamp",
    y: 40 + 3 * (BAND_H + BAND_GAP),
    fill: "#FDE7C8", stroke: "#F5C16C", accent: "#944F01", textColor: "#944F01",
    pills: [
      { name: "auditLog", w: 98, fill: "#FDDCB5", stroke: "#D97706", text: "#944F01" },
    ],
  },
];

const LAST_BAND_BOTTOM = 40 + 4 * BAND_H + 3 * BAND_GAP; // =344
const PRINCIPLES_Y = LAST_BAND_BOTTOM + 8;

const ENGINE_ROWS = [
  { label: "$expr Pacioli", sub: "∑ amountBaseMinor = 0" },
  { label: "$expr SoD",     sub: "createdBy ≠ approvedBy" },
  { label: "partial unique index", sub: "externalRef idempotency" },
  { label: "write-time enforcement", sub: "error on first bad write" },
];

const DETECTIVE_ROWS = [
  { label: "reconciliationRuns",  sub: "nightly aggregation" },
  { label: "reconciliationExceptions", sub: "drift detection" },
  { label: "cross-shard balance checks", sub: "consistency scan" },
  { label: "post-write analysis", sub: "second line of defense" },
];

const PRINCIPLES = [
  {
    x: 30, w: 490, color: "#00684A", fill: "#E3FCF7", stroke: "#00A35C",
    title: "IMMUTABLE JOURNAL",
    lines: ["glJournalEntries: append-only", "no UPDATE · no DELETE · ever", "audit trail always reconstructable"],
  },
  {
    x: 540, w: 490, color: "#016BF8", fill: "#EBF4FF", stroke: "#A5C7FF",
    title: "SINGLE CDC CURSOR",
    lines: ["one cursor per collection", "consumers subscribe to CDC tier", "never hold DB cursors directly"],
  },
  {
    x: 1050, w: 520, color: "#944F01", fill: "#FDE7C8", stroke: "#F5C16C",
    title: "WORM TAMPER EVIDENCE",
    lines: ["SHA-256(prevHash ‖ payload)", "RFC 3161 trusted timestamp", "gap in sequence = detected tamper"],
  },
];

function LayerBand({ layer, visible, collectionsVisible, delay }) {
  const pillBaseX = 290;
  let pillCursor = pillBaseX;

  return (
    <AnimatePresence>
      {visible && (
        <motion.g
          key={layer.key}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ ...SPRING.default, delay }}
        >
          {/* Band background */}
          <rect x={BAND_X} y={layer.y} width={BAND_W} height={BAND_H} rx={8}
            fill={layer.fill} stroke={layer.stroke} strokeWidth={1.2} />
          {/* Left accent */}
          <rect x={BAND_X} y={layer.y} width={6} height={BAND_H} rx={3}
            fill={layer.accent} />
          {/* Label */}
          <text x={BAND_X + 18} y={layer.y + BAND_H / 2 - 7}
            className={styles.bandLabel} fill={layer.textColor}>
            {layer.label}
          </text>
          <text x={BAND_X + 18} y={layer.y + BAND_H / 2 + 10}
            className={styles.bandSub}>
            {layer.sub}
          </text>

          {/* Collection pills */}
          <AnimatePresence>
            {collectionsVisible && layer.pills.map((pill, i) => {
              const px = pillCursor;
              pillCursor += pill.w + 10;
              const py = layer.y + BAND_H / 2 - 13;
              return (
                <motion.g
                  key={pill.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ...SPRING.default, delay: i * 0.08 }}
                  style={{ transformOrigin: `${px + pill.w / 2}px ${py + 13}px` }}
                >
                  <rect x={px} y={py} width={pill.w} height={26} rx={13}
                    fill={pill.fill} stroke={pill.stroke} strokeWidth={1} />
                  <text x={px + pill.w / 2} y={py + 14} textAnchor="middle"
                    className={styles.pillLabel} fill={pill.text}>
                    {pill.name}
                  </text>
                </motion.g>
              );
            })}
          </AnimatePresence>
        </motion.g>
      )}
    </AnimatePresence>
  );
}

export default function ArchCanvas({ state }) {
  const arch = state?.arch || {};
  const reached = (s) => !!arch.reachedStages?.[s];
  const isActive = arch.status !== "IDLE";

  const layersVisible     = reached("ARCH_LAYERS");
  const collectionsVisible = reached("ARCH_COLLECTIONS");
  const enforcedVisible   = reached("ARCH_ENFORCED");
  const principlesVisible  = reached("ARCH_PRINCIPLES");

  const OVL_X = 820, OVL_Y = 36, OVL_W = 750, OVL_H = LAST_BAND_BOTTOM - 36;
  const COL1_X = OVL_X + 14, COL2_X = OVL_X + OVL_W / 2 + 10;
  const TABLE_ROW_H = 50;
  const TABLE_START_Y = OVL_Y + 54;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>

      <rect width={W} height={H} fill="#FAFBFA" />

      {/* Header bar */}
      <rect x={0} y={0} width={W} height={32} fill="#F9FBFA" />
      <line x1={0} y1={32} x2={W} y2={32} stroke="#E8EDEB" strokeWidth={1} />
      {isActive ? (
        <text x={40} y={20} className={styles.headerText}>
          ARCHITECTURE · Four Layers · Eight Collections · Engine + Detective Controls
        </text>
      ) : (
        <text x={W / 2} y={20} textAnchor="middle" className={styles.headerText} opacity={0.4}>
          ARCHITECTURE · Press Simulate to explore
        </text>
      )}

      {/* Layer bands */}
      {LAYERS.map((layer, i) => (
        <LayerBand
          key={layer.key}
          layer={layer}
          visible={layersVisible}
          collectionsVisible={collectionsVisible}
          delay={i * 0.08}
        />
      ))}

      {/* Engine vs Detective overlay */}
      <AnimatePresence>
        {enforcedVisible && !principlesVisible && (
          <motion.g
            key="enforced"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ ...SPRING.default, delay: 0.1 }}
          >
            <rect x={OVL_X} y={OVL_Y} width={OVL_W} height={OVL_H} rx={10}
              fill="rgba(255,255,255,0.94)" stroke="#E8EDEB" strokeWidth={1.5} />

            {/* Header row */}
            <rect x={OVL_X} y={OVL_Y} width={OVL_W / 2} height={44} rx={0}
              fill="#E3FCF7" />
            <rect x={OVL_X + OVL_W / 2} y={OVL_Y} width={OVL_W / 2} height={44} rx={0}
              fill="#EBF4FF" />
            <rect x={OVL_X} y={OVL_Y} width={OVL_W} height={10} rx={10}
              fill="transparent" />

            <text x={COL1_X} y={OVL_Y + 18} className={styles.overlayTitle} fill="#00684A">
              ENGINE CONTROLS
            </text>
            <text x={COL1_X} y={OVL_Y + 34} className={styles.tableCell} style={{ fill: "#5C6C75", fontSize: "9px" }}>
              enforced at write time · collections: journalEntries
            </text>
            <text x={COL2_X} y={OVL_Y + 18} className={styles.overlayTitle} fill="#016BF8">
              DETECTIVE CONTROLS
            </text>
            <text x={COL2_X} y={OVL_Y + 34} className={styles.tableCell} style={{ fill: "#5C6C75", fontSize: "9px" }}>
              analysed post-write · collections: reconciliation*
            </text>

            {/* Vertical divider */}
            <line x1={OVL_X + OVL_W / 2} y1={OVL_Y + 44} x2={OVL_X + OVL_W / 2} y2={OVL_Y + OVL_H - 8}
              stroke="#E8EDEB" strokeWidth={1} />

            {/* Data rows */}
            {ENGINE_ROWS.map((row, i) => (
              <motion.g key={row.label}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.06 }}>
                <text x={COL1_X} y={TABLE_START_Y + i * TABLE_ROW_H}
                  className={styles.tableCellKey} fill="#001E2B">
                  {row.label}
                </text>
                <text x={COL1_X} y={TABLE_START_Y + i * TABLE_ROW_H + 16}
                  className={styles.tableCell} style={{ fill: "#889397" }}>
                  {row.sub}
                </text>
              </motion.g>
            ))}
            {DETECTIVE_ROWS.map((row, i) => (
              <motion.g key={row.label}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.06 }}>
                <text x={COL2_X} y={TABLE_START_Y + i * TABLE_ROW_H}
                  className={styles.tableCellKey} fill="#001E2B">
                  {row.label}
                </text>
                <text x={COL2_X} y={TABLE_START_Y + i * TABLE_ROW_H + 16}
                  className={styles.tableCell} style={{ fill: "#889397" }}>
                  {row.sub}
                </text>
              </motion.g>
            ))}
          </motion.g>
        )}
      </AnimatePresence>

      {/* Principles — bottom strip */}
      <AnimatePresence>
        {principlesVisible && (
          <motion.g
            key="principles"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ ...SPRING.default, delay: 0.1 }}
          >
            {PRINCIPLES.map((p, i) => (
              <motion.g key={p.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING.default, delay: 0.1 + i * 0.1 }}>
                <rect x={p.x} y={PRINCIPLES_Y} width={p.w} height={86} rx={8}
                  fill={p.fill} stroke={p.stroke} strokeWidth={1.5} />
                <rect x={p.x} y={PRINCIPLES_Y} width={p.w} height={6} rx={3}
                  fill={p.color} />
                <text x={p.x + 14} y={PRINCIPLES_Y + 24}
                  className={styles.principleTitle} fill={p.color}>
                  {p.title}
                </text>
                {p.lines.map((line, j) => (
                  <text key={j} x={p.x + 14} y={PRINCIPLES_Y + 44 + j * 16}
                    className={styles.principleBody}>
                    {line}
                  </text>
                ))}
              </motion.g>
            ))}
          </motion.g>
        )}
      </AnimatePresence>

      {/* Idle hint */}
      {!isActive && (
        <text x={W / 2} y={H / 2 + 10} textAnchor="middle"
          className={styles.idleHint} opacity={0.28}>
          Press Simulate →
        </text>
      )}
    </svg>
  );
}
