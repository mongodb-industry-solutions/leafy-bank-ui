"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../LedgerFlow/motionConfig";
import { FANOUT_JOURNAL, CONSUMERS } from "./fanoutFixtures";
import styles from "./FanoutCanvas.module.css";

// ─── Layout ───────────────────────────────────────────────────────────────────
const W = 1600, H = 555;
const CARD_Y = 52;

// Journal card (left)
const JNL_X = 40, JNL_W = 320, JNL_H = 280;

// CDC node (circle)
const CDC_CX = 530, CDC_CY = 192, CDC_R = 62;

// Consumers — right side, three stacked rows
const CON_X = 700, CON_W = 858;
const CON_ROWS = [
  { ...CONSUMERS[0], y: CARD_Y + 8,   h: 82 },
  { ...CONSUMERS[1], y: CARD_Y + 102, h: 82 },
  { ...CONSUMERS[2], y: CARD_Y + 196, h: 82 },
];
// midpoints
CON_ROWS.forEach((r) => { r.midY = r.y + r.h / 2; });

// Event badge below CDC node
const EVT_Y = CDC_CY + CDC_R + 16;

// Resume token row y inside each consumer card
const TOK_Y_OFFSET = 52; // from card top

// ─── Fan-out line from CDC to consumer ───────────────────────────────────────
function FanLine({ row, active }) {
  // Exit point on the circle's actual circumference toward each consumer midY
  const dx = CON_X - CDC_CX;
  const dy = row.midY - CDC_CY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const x1 = CDC_CX + CDC_R * (dx / len);
  const y1 = CDC_CY + CDC_R * (dy / len);
  const x2 = CON_X;
  const y2 = row.midY;
  return (
    <motion.path
      d={`M${x1},${y1} C${x1 + 60},${y1} ${x2 - 60},${y2} ${x2},${y2}`}
      fill="none"
      stroke={row.color}
      strokeWidth={1.5}
      strokeDasharray="8 4"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: active ? 1 : 0, opacity: active ? 0.9 : 0 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    />
  );
}

// ─── Consumer card ────────────────────────────────────────────────────────────
function ConsumerCard({ row, active, showToken, failed }) {
  return (
    <motion.g>
      <motion.rect
        x={CON_X} y={row.y} width={CON_W} height={row.h} rx={10}
        fill="white"
        animate={{ stroke: active ? (failed ? "#F59B00" : row.color) : "#E8EDEB" }}
        strokeWidth={1.5}
        transition={SPRING.default}
      />
      <motion.rect
        x={CON_X} y={row.y} width={CON_W} height={4} rx={3}
        animate={{ fill: active ? (failed ? "#F59B00" : row.color) : "#E8EDEB" }}
        opacity={0.4}
        transition={SPRING.default}
      />

      {/* Consumer name + collection */}
      <text x={CON_X + 16} y={row.y + 20} className={styles.consumerLabel}
        fill={active ? (failed ? "#B45309" : row.color) : "#889397"}>
        {row.label.toUpperCase()}
      </text>
      <text x={CON_X + 16} y={row.y + 36} className={styles.consumerSub}>
        → {row.collection} · {row.description}
      </text>

      {/* Status badge */}
      <AnimatePresence>
        {active && (
          <motion.g key="status"
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 22 }}
            style={{ transformOrigin: `${CON_X + CON_W - 62}px ${row.y + 17}px` }}
          >
            <rect x={CON_X + CON_W - 108} y={row.y + 8} width={92} height={18} rx={9}
              fill={failed ? "#F59B00" : row.color} opacity={0.12} />
            <text x={CON_X + CON_W - 62} y={row.y + 21} textAnchor="middle"
              className={styles.statusPill} fill={failed ? "#B45309" : row.color}>
              {failed ? "✗ FAILED" : "✓ CONSUMED"}
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Resume token */}
      <AnimatePresence>
        {showToken && (
          <motion.g key="token"
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            transition={SPRING.default}
          >
            <rect x={CON_X + 16} y={row.y + TOK_Y_OFFSET} width={CON_W - 32} height={20} rx={4}
              fill={row.lightColor} stroke={row.color} strokeWidth={1} />
            <text x={CON_X + 28} y={row.y + TOK_Y_OFFSET + 13} className={styles.tokenLabel}
              fill={row.color}>
              resumeToken:
            </text>
            <text x={CON_X + 122} y={row.y + TOK_Y_OFFSET + 13} className={styles.tokenVal}>
              {row.resumeToken}
            </text>
          </motion.g>
        )}
      </AnimatePresence>
    </motion.g>
  );
}

// ─── Main canvas ──────────────────────────────────────────────────────────────
export default function FanoutCanvas({ state }) {
  const f = state?.fanout || {};
  const reached = (s) => !!f.reachedStages?.[s];
  const isActive = f.status !== "IDLE";

  const jnlVisible     = reached("FANOUT_JOURNAL_COMMITTED");
  const cdcVisible     = reached("FANOUT_STREAM_OPENED");
  const eventVisible   = reached("FANOUT_EVENT_RECEIVED");
  const balanceActive  = reached("FANOUT_CONSUMER_BALANCE");
  const fraudActive    = reached("FANOUT_CONSUMER_FRAUD");
  const wormActive     = reached("FANOUT_CONSUMER_WORM");
  const dlqVisible     = reached("FANOUT_DLQ");
  const showTokens     = wormActive;

  // Active map per consumer
  const consumerActive = { BALANCE: balanceActive, FRAUD: fraudActive, WORM: wormActive };

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
      <rect width={W} height={H} fill="#FAFBFA" />

      {/* Header */}
      <rect x={0} y={0} width={W} height={38} fill="#F9FBFA" />
      <line x1={0} y1={38} x2={W} y2={38} stroke="#E8EDEB" strokeWidth={1} />
      {isActive ? (
        <text x={40} y={23} className={styles.headerText}>
          CDC FAN-OUT · JNL-20260506-001 · journalEntries → 3 consumers · resume tokens
        </text>
      ) : (
        <text x={W / 2} y={23} textAnchor="middle" className={styles.headerText} opacity={0.4}>
          FAN-OUT · CDC TIER · RESUME TOKENS · Press Simulate to run
        </text>
      )}

      {/* ── Journal card ─────────────────────────────────────────────────── */}
      <motion.rect
        x={JNL_X} y={CARD_Y} width={JNL_W} height={JNL_H} rx={12}
        fill="white"
        animate={{ stroke: jnlVisible ? "#00A35C" : "#E8EDEB" }}
        strokeWidth={1.5} transition={SPRING.default}
      />
      <motion.rect x={JNL_X} y={CARD_Y} width={JNL_W} height={5} rx={4}
        animate={{ fill: jnlVisible ? "#C0FAE6" : "#E8EDEB" }} opacity={0.7}
        transition={SPRING.default} />
      <text x={JNL_X + JNL_W / 2} y={CARD_Y + 19} textAnchor="middle"
        className={styles.cardHeader} fill={jnlVisible ? "#00684A" : "#889397"}>
        JOURNAL ENTRY
      </text>
      <text x={JNL_X + JNL_W / 2} y={CARD_Y + 33} textAnchor="middle" className={styles.cardSub}>
        journalEntries · status: POSTED
      </text>

      {jnlVisible && [
        { k: "journalId",  v: FANOUT_JOURNAL.journalId },
        { k: "type",       v: FANOUT_JOURNAL.journalType },
        { k: "amount",     v: "$250.00 USD" },
        { k: "debit",      v: "ACC-FRIDA-001" },
        { k: "credit",     v: "ACC-BO-001" },
        { k: "status",     v: "POSTED ✓" },
      ].map((r, i) => (
        <g key={r.k}>
          <text x={JNL_X + 14} y={CARD_Y + 56 + i * 30} className={styles.fieldKey}>{r.k}:</text>
          <text x={JNL_X + 102} y={CARD_Y + 56 + i * 30} className={styles.fieldVal}
            fill={r.k === "status" ? "#00684A" : "#001E2B"}>
            {r.v}
          </text>
        </g>
      ))}

      {/* Line: journal → CDC */}
      <motion.line
        x1={JNL_X + JNL_W + 4} y1={CARD_Y + JNL_H / 2}
        x2={CDC_CX - CDC_R - 4} y2={CDC_CY}
        stroke="#00A35C" strokeWidth={1.5} strokeDasharray="8 4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: eventVisible ? 1 : 0, opacity: eventVisible ? 0.8 : 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* ── CDC node ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {cdcVisible && (
          <motion.g key="cdc"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ transformOrigin: `${CDC_CX}px ${CDC_CY}px` }}
            transition={SPRING.default}
          >
            <circle cx={CDC_CX} cy={CDC_CY} r={CDC_R}
              fill="#E1F7FF" stroke={eventVisible ? "#016BF8" : "#C1C7C6"} strokeWidth={1.5} />
            {/* Pulse ring on event arrival — one-shot expand + fade */}
            {eventVisible && (
              <motion.circle
                cx={CDC_CX} cy={CDC_CY} r={CDC_R}
                fill="none" stroke="#016BF8" strokeWidth={3}
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 1.65, opacity: 0 }}
                style={{ transformOrigin: `${CDC_CX}px ${CDC_CY}px` }}
                transition={{ duration: 0.65, ease: "easeOut" }}
              />
            )}
            <text x={CDC_CX} y={CDC_CY - 10} textAnchor="middle" className={styles.cdcTitle}>
              CDC TIER
            </text>
            <text x={CDC_CX} y={CDC_CY + 6} textAnchor="middle" className={styles.cdcSub}>
              journalEntries
            </text>
            <text x={CDC_CX} y={CDC_CY + 22} textAnchor="middle" className={styles.cdcSub}>
              change stream
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Change event badge below CDC node */}
      <AnimatePresence>
        {eventVisible && (
          <motion.g key="evt"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={SPRING.default}
          >
            <rect x={CDC_CX - 110} y={EVT_Y} width={220} height={28} rx={6}
              fill="#016BF8" opacity={0.1} stroke="#016BF8" strokeWidth={1} />
            <text x={CDC_CX} y={EVT_Y + 18} textAnchor="middle" className={styles.evtBadge}>
              operationType: "insert" · JNL-20260506-001
            </text>
            {/* postBatchResumeToken checkpoint label */}
            <text x={CDC_CX} y={EVT_Y + 40} textAnchor="middle" className={styles.pbrtLabel}>
              PBRT checkpointed — durable cursor position
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* ── Fan-out lines and consumer cards ─────────────────────────────── */}
      {CON_ROWS.map((row) => (
        <React.Fragment key={row.key}>
          <FanLine row={row} active={consumerActive[row.key]} />
          <ConsumerCard
            row={row}
            active={consumerActive[row.key]}
            showToken={showTokens}
            failed={row.key === "BALANCE" && dlqVisible}
          />
        </React.Fragment>
      ))}

      {/* ── WORM hash chain strip (below consumer cards) ─────────────────── */}
      <AnimatePresence>
        {wormActive && (
          <motion.g key="hashChain"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ ...SPRING.default, delay: 0.3 }}
          >
            {/* Positioned below the WORM card */}
            <rect x={CON_X} y={348} width={CON_W} height={62} rx={8}
              fill="#E3FCF7" stroke="#00A35C" strokeWidth={1} />
            <rect x={CON_X} y={348} width={4} height={62} rx={4} fill="#00684A" />
            <text x={CON_X + 18} y={363} className={styles.hashLabel}>WORM · hash chain</text>
            <text x={CON_X + 18} y={380} className={styles.hashRow}>
              <tspan className={styles.hashKey}>prevHash: </tspan>
              <tspan className={styles.hashVal}>a1b2c3d4e5f67890…</tspan>
            </text>
            <text x={CON_X + 18} y={396} className={styles.hashRow}>
              <tspan className={styles.hashKey}>hash: </tspan>
              <tspan className={styles.hashVal}>SHA-256(prevHash ‖ payload) → f7a3b9c2d1e84f…</tspan>
            </text>
            <text x={CON_X + CON_W - 14} y={380} textAnchor="end" className={styles.hashSeq}>
              seq 8821
            </text>
            <text x={CON_X + CON_W - 14} y={396} textAnchor="end" className={styles.hashRfc}>
              RFC 3161 ✓
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* ── cdcDeadLetters card (DLQ failure) ───────────────────────── */}
      <AnimatePresence>
        {dlqVisible && (
          <motion.g key="dlq"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, x: [0, 0, -5, 4, -3, 2, 0] }}
            exit={{ opacity: 0 }}
            transition={{ ...SPRING.default, delay: 0.25, x: { duration: 0.45, delay: 0.55, ease: "easeInOut" } }}
          >
            {/* Connector: BALANCE card bottom → DLQ card top */}
            <line
              x1={CON_X + 44} y1={CON_ROWS[0].y + CON_ROWS[0].h}
              x2={CON_X + 44} y2={430}
              stroke="#F59B00" strokeWidth={1} strokeDasharray="5 3" opacity={0.55}
            />

            {/* DLQ card */}
            <rect x={CON_X} y={430} width={CON_W} height={112} rx={10}
              fill="#FFFBF0" stroke="#F59B00" strokeWidth={1.5} />
            <rect x={CON_X} y={430} width={4} height={112} rx={4} fill="#F59B00" />
            <rect x={CON_X} y={430} width={CON_W} height={4} rx={3}
              fill="#F59B00" opacity={0.3} />

            {/* Header row */}
            <text x={CON_X + 16} y={449} className={styles.dlqHeader}>
              ⚠ cdcDeadLetters
            </text>
            <text x={CON_X + 16} y={464} className={styles.consumerSub}>
              → balanceProjection failure · 3 retries exhausted · re-emit to resume
            </text>

            {/* Status badge */}
            <rect x={CON_X + CON_W - 148} y={438} width={132} height={18} rx={9}
              fill="#F59B00" opacity={0.12} />
            <text x={CON_X + CON_W - 82} y={451} textAnchor="middle"
              className={styles.statusPill} fill="#B45309">
              FAILURE CAPTURED · RE-DRIVABLE
            </text>

            {/* Divider */}
            <line x1={CON_X + 12} y1={472} x2={CON_X + CON_W - 12} y2={472}
              stroke="#F59B00" strokeWidth={0.5} opacity={0.3} />

            {/* Document fields */}
            {[
              { k: "pipeline",      v: '"balanceProjection"', amber: false },
              { k: "errorClass",    v: '"projection_failure"', amber: true  },
              { k: "retryCount",    v: "3",                    amber: true  },
              { k: "dispositioned", v: "false",                amber: true  },
            ].map((r, i) => (
              <g key={r.k}>
                <text x={CON_X + 16} y={486 + i * 14} className={styles.fieldKey}>{r.k}:</text>
                <text x={CON_X + 132} y={486 + i * 14} className={styles.fieldVal}
                  fill={r.amber ? "#B45309" : "#001E2B"}>
                  {r.v}
                </text>
              </g>
            ))}
          </motion.g>
        )}
      </AnimatePresence>

      {/* Idle hint */}
      {!isActive && (
        <text x={W / 2} y={H / 2 + 8} textAnchor="middle" className={styles.idleHint} opacity={0.28}>
          Press Simulate →
        </text>
      )}
    </svg>
  );
}
