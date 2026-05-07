"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../LedgerFlow/motionConfig";
import { CONSUMER, STREAM_ERROR, WORM_ENTRIES, STALE_RESUME_TOKEN, NEW_RESUME_TOKEN } from "./hardEdgeFixtures";
import styles from "./HardEdgeCanvas.module.css";

// ─── Layout ───────────────────────────────────────────────────────────────────
const W = 1600, H = 440;
const CARD_Y = 52;

// Consumer card (left)
const CON_X = 40, CON_W = 380, CON_H = 280;

// Oplog zone (centre)
const OPL_X = 490, OPL_W = 460, OPL_H = 280;
const OPL_CX = OPL_X + OPL_W / 2;

// Oplog bar geometry
const BAR_Y = CARD_Y + 100, BAR_H = 24, BAR_X = OPL_X + 30, BAR_W = OPL_W - 60;
// Window: right 55% of bar = current events; left 45% = rolled out
const WIN_X  = BAR_X + BAR_W * 0.45;
const WIN_W  = BAR_W * 0.55;
// Token marker sits in the left 30% (rolled-out zone)
const TOK_MX = BAR_X + BAR_W * 0.28;

// Error box
const ERR_X = OPL_X + 20, ERR_Y = CARD_Y + 145, ERR_W = OPL_W - 40, ERR_H = 96;

// WORM panel (right)
const WORM_X = 1020, WORM_W = 540, WORM_H = 280;

// Recovery arrow: WORM left-edge → consumer right-edge (bottom strip)
const REC_Y = CARD_Y + CON_H - 36;

// ─── Main canvas ──────────────────────────────────────────────────────────────
export default function HardEdgeCanvas({ state }) {
  const h = state?.hardEdge || {};
  const reached = (s) => !!h.reachedStages?.[s];
  const isActive = h.status !== "IDLE";

  const isOffline   = reached("HARD_EDGE_CONSUMER_OFFLINE");
  const oplogRolled = reached("HARD_EDGE_OPLOG_ROLLS");
  const attempted   = reached("HARD_EDGE_RESUME_ATTEMPT");
  const hasError    = reached("HARD_EDGE_ERROR_286");
  const isRecovery  = reached("HARD_EDGE_WORM_RECOVERY");
  const caughtUp    = reached("HARD_EDGE_CAUGHT_UP");

  // Consumer status
  const conStatus = caughtUp ? "CAUGHT UP ✓" : isRecovery ? "RECOVERING" : hasError ? "ERROR 286" : attempted ? "RECONNECTING" : isOffline ? "OFFLINE" : "ONLINE";
  const conColor  = caughtUp ? "#00684A" : hasError ? "#C82430" : isOffline ? "#944F01" : "#00684A";
  const conFill   = caughtUp ? "#E3FCF7" : hasError ? "#FFEAE5" : isOffline ? "#FDE7C8" : "#F9FBFA";
  const conStroke = caughtUp ? "#00A35C" : hasError ? "#C82430" : isOffline ? "#944F01" : "#C1C7C6";

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
      <defs>
        <marker id="heArrowGreen" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#00A35C" />
        </marker>
        <marker id="heArrowRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#C82430" />
        </marker>
      </defs>

      <rect width={W} height={H} fill="#FAFBFA" />

      {/* Header */}
      <rect x={0} y={0} width={W} height={38} fill="#F9FBFA" />
      <line x1={0} y1={38} x2={W} y2={38} stroke="#E8EDEB" strokeWidth={1} />
      {isActive ? (
        <text x={40} y={23} className={styles.headerText}>
          HARD EDGE · fraud-pipeline-001 · ChangeStreamHistoryLost · code 286 · WORM recovery
        </text>
      ) : (
        <text x={W / 2} y={23} textAnchor="middle" className={styles.headerText} opacity={0.4}>
          HARD EDGE · ChangeStreamHistoryLost · Press Simulate to run
        </text>
      )}

      {/* ── Consumer card ─────────────────────────────────────────────── */}
      <motion.rect x={CON_X} y={CARD_Y} width={CON_W} height={CON_H} rx={12}
        fill={isActive ? conFill : "white"}
        animate={{ stroke: isActive ? conStroke : "#E8EDEB" }}
        strokeWidth={1.5} transition={SPRING.default}
      />
      <motion.rect x={CON_X} y={CARD_Y} width={CON_W} height={5} rx={4}
        animate={{ fill: isActive ? conColor : "#E8EDEB" }} opacity={0.5}
        transition={SPRING.default}
      />
      <text x={CON_X + CON_W / 2} y={CARD_Y + 19} textAnchor="middle"
        className={styles.cardHeader} fill={isActive ? conColor : "#889397"}>
        CONSUMER
      </text>
      <text x={CON_X + CON_W / 2} y={CARD_Y + 33} textAnchor="middle" className={styles.cardSub}>
        fraud-pipeline-001 · journalEntries
      </text>

      {/* Status badge */}
      <AnimatePresence mode="wait">
        <motion.g key={conStatus}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <rect x={CON_X + 20} y={CARD_Y + 50} width={CON_W - 40} height={28} rx={6}
            fill={isActive ? conColor : "#C1C7C6"} opacity={0.12} />
          <text x={CON_X + CON_W / 2} y={CARD_Y + 69} textAnchor="middle"
            className={styles.statusBig} fill={isActive ? conColor : "#C1C7C6"}>
            {isActive ? conStatus : "ONLINE"}
          </text>
        </motion.g>
      </AnimatePresence>

      {/* Resume token label */}
      {isActive && (
        <g>
          <text x={CON_X + 16} y={CARD_Y + 108} className={styles.fieldKey}>resumeToken (stored):</text>
          <rect x={CON_X + 16} y={CARD_Y + 116} width={CON_W - 32} height={22} rx={4}
            fill={hasError && !caughtUp ? "#FFEAE5" : "#F9FBFA"}
            stroke={hasError && !caughtUp ? "#C82430" : "#E8EDEB"} strokeWidth={1} />
          <text x={CON_X + 24} y={CARD_Y + 131} className={styles.tokenStale}
            fill={hasError && !caughtUp ? "#C82430" : "#5C6C75"}>
            {STALE_RESUME_TOKEN}
          </text>
          {hasError && !caughtUp && (
            <text x={CON_X + CON_W - 18} y={CARD_Y + 131} textAnchor="end"
              className={styles.tokenInvalid}>
              INVALID
            </text>
          )}
        </g>
      )}

      {/* New token after recovery */}
      <AnimatePresence>
        {caughtUp && (
          <motion.g key="newToken"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <text x={CON_X + 16} y={CARD_Y + 166} className={styles.fieldKey}>new resumeToken:</text>
            <rect x={CON_X + 16} y={CARD_Y + 174} width={CON_W - 32} height={22} rx={4}
              fill="#E3FCF7" stroke="#00A35C" strokeWidth={1} />
            <text x={CON_X + 24} y={CARD_Y + 189} className={styles.tokenNew}>
              {NEW_RESUME_TOKEN}
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Offline timestamp */}
      {isOffline && !caughtUp && (
        <g>
          <text x={CON_X + 16} y={CARD_Y + 220} className={styles.fieldKey}>offline since:</text>
          <text x={CON_X + 110} y={CARD_Y + 220} className={styles.fieldVal}>2026-05-04T22:00:00Z</text>
          <text x={CON_X + 16} y={CARD_Y + 246} className={styles.fieldKey}>last event:</text>
          <text x={CON_X + 110} y={CARD_Y + 246} className={styles.fieldVal}>2 days ago</text>
        </g>
      )}

      {/* ── Oplog zone ───────────────────────────────────────────────────── */}
      <motion.rect x={OPL_X} y={CARD_Y} width={OPL_W} height={OPL_H} rx={12}
        fill="#F5F7FA"
        animate={{ stroke: hasError ? "#C82430" : (isActive ? "#C1C7C6" : "#E8EDEB") }}
        strokeWidth={1} transition={SPRING.default}
      />
      <text x={OPL_CX} y={CARD_Y + 20} textAnchor="middle" className={styles.oplTitle}>
        OPLOG
      </text>
      <text x={OPL_CX} y={CARD_Y + 34} textAnchor="middle" className={styles.oplSub}>
        capped collection · finite retention window
      </text>

      {/* Oplog bar — always shown when active */}
      {isActive && (
        <g>
          {/* Full bar background */}
          <rect x={BAR_X} y={BAR_Y} width={BAR_W} height={BAR_H} rx={4} fill="#E8EDEB" />

          {/* Rolled-out zone (left, greyed) */}
          <AnimatePresence>
            {oplogRolled && (
              <motion.g key="rolledZone"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <rect x={BAR_X} y={BAR_Y} width={BAR_W * 0.45} height={BAR_H} rx={4}
                  fill="#C82430" opacity={0.15} />
                <text x={BAR_X + BAR_W * 0.22} y={BAR_Y + 36} textAnchor="middle"
                  className={styles.oplZoneLabel} fill="#C82430">
                  ROLLED OUT
                </text>
              </motion.g>
            )}
          </AnimatePresence>

          {/* Active window (right) */}
          <rect x={WIN_X} y={BAR_Y} width={WIN_W} height={BAR_H} rx={0}
            fill={oplogRolled ? "#00A35C" : "#016BF8"} opacity={0.2} />
          <text x={WIN_X + WIN_W / 2} y={BAR_Y + 36} textAnchor="middle"
            className={styles.oplZoneLabel} fill={oplogRolled ? "#00684A" : "#016BF8"}>
            ACTIVE WINDOW
          </text>

          {/* Event dots */}
          {[0.1, 0.2, 0.32, 0.42, 0.55, 0.65, 0.75, 0.85, 0.93].map((pct, i) => (
            <circle key={i}
              cx={BAR_X + BAR_W * pct} cy={BAR_Y + BAR_H / 2} r={4}
              fill={oplogRolled && pct < 0.45 ? "#C82430" : (oplogRolled ? "#00A35C" : "#016BF8")}
              opacity={oplogRolled && pct < 0.45 ? 0.4 : 0.7}
            />
          ))}

          {/* Resume token marker — pulses when rolled into danger zone */}
          <motion.g
            animate={oplogRolled ? { opacity: [1, 0.3, 1, 0.3, 1] } : { opacity: 1 }}
            transition={oplogRolled ? { duration: 1.0, repeat: 1, ease: "easeInOut" } : SPRING.default}
          >
            <line x1={TOK_MX} y1={BAR_Y - 8} x2={TOK_MX} y2={BAR_Y + BAR_H + 8}
              stroke={oplogRolled ? "#C82430" : "#944F01"} strokeWidth={2} />
            <text x={TOK_MX} y={BAR_Y - 14} textAnchor="middle"
              className={styles.tokenMarkerLabel}
              fill={oplogRolled ? "#C82430" : "#944F01"}>
              {oplogRolled ? "⚠ token here" : "token"}
            </text>
          </motion.g>

          {/* Window boundary arrow when rolled */}
          {oplogRolled && (
            <g>
              <line x1={WIN_X} y1={BAR_Y - 12} x2={WIN_X} y2={BAR_Y + BAR_H + 12}
                stroke="#5C6C75" strokeWidth={1.5} strokeDasharray="4 3" />
              <text x={WIN_X + 6} y={BAR_Y - 14} className={styles.tokenMarkerLabel} fill="#5C6C75">
                window boundary
              </text>
            </g>
          )}
        </g>
      )}

      {/* ── Error 286 overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {hasError && !isRecovery && (
          <motion.g key="err286"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ transformOrigin: `${ERR_X + ERR_W / 2}px ${ERR_Y + ERR_H / 2}px` }}
            transition={SPRING.default}
          >
            <rect x={ERR_X} y={ERR_Y} width={ERR_W} height={ERR_H} rx={10}
              fill="#FFEAE5" stroke="#C82430" strokeWidth={2} />
            <rect x={ERR_X} y={ERR_Y} width={6} height={ERR_H} rx={6} fill="#C82430" />
            <text x={ERR_X + ERR_W / 2} y={ERR_Y + 28} textAnchor="middle"
              className={styles.errCode}>
              ERROR 286
            </text>
            <text x={ERR_X + ERR_W / 2} y={ERR_Y + 52} textAnchor="middle"
              className={styles.errName}>
              ChangeStreamHistoryLost
            </text>
            <text x={ERR_X + ERR_W / 2} y={ERR_Y + 70} textAnchor="middle"
              className={styles.errSub}>
              cursor invalidated · oplog window exceeded
            </text>
            <text x={ERR_X + ERR_W / 2} y={ERR_Y + 84} textAnchor="middle"
              className={styles.errSub}>
              resume point no longer in oplog
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Recovery line indicator in oplog zone */}
      <AnimatePresence>
        {isRecovery && (
          <motion.g key="recovery"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <rect x={ERR_X} y={ERR_Y} width={ERR_W} height={ERR_H} rx={10}
              fill="#E3FCF7" stroke="#00A35C" strokeWidth={1.5} />
            <text x={ERR_X + ERR_W / 2} y={ERR_Y + 30} textAnchor="middle"
              className={styles.recoveryTitle}>
              WORM RECOVERY
            </text>
            <text x={ERR_X + ERR_W / 2} y={ERR_Y + 50} textAnchor="middle"
              className={styles.recoverySub}>
              oplog: unavailable
            </text>
            <text x={ERR_X + ERR_W / 2} y={ERR_Y + 68} textAnchor="middle"
              className={styles.recoverySub}>
              reading from wormLedger · seq {">"}= 8821
            </text>
            <text x={ERR_X + ERR_W / 2} y={ERR_Y + 84} textAnchor="middle"
              className={styles.recoverySub}>
              replaying {WORM_ENTRIES.length} missed events
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* ── WORM panel ───────────────────────────────────────────────────── */}
      <motion.rect x={WORM_X} y={CARD_Y} width={WORM_W} height={WORM_H} rx={12}
        fill="white"
        animate={{ stroke: isRecovery || caughtUp ? "#00A35C" : (isActive ? "#C1C7C6" : "#E8EDEB") }}
        strokeWidth={1.5} transition={SPRING.default}
      />
      <motion.rect x={WORM_X} y={CARD_Y} width={WORM_W} height={5} rx={4}
        animate={{ fill: isRecovery || caughtUp ? "#C0FAE6" : "#E8EDEB" }} opacity={0.6}
        transition={SPRING.default}
      />
      <text x={WORM_X + WORM_W / 2} y={CARD_Y + 19} textAnchor="middle"
        className={styles.cardHeader}
        fill={isRecovery || caughtUp ? "#00684A" : "#889397"}>
        WORM SINK
      </text>
      <text x={WORM_X + WORM_W / 2} y={CARD_Y + 33} textAnchor="middle" className={styles.cardSub}>
        wormLedger · append-only · immutable
      </text>

      {/* WORM entries */}
      {isActive && WORM_ENTRIES.map((entry, i) => {
        const active = isRecovery || caughtUp;
        return (
          <motion.g key={entry.wormId}
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: isActive ? 1 : 0, scale: active ? [0.93, 1.04, 1] : 1 }}
            transition={{ duration: 0.3, delay: i * 0.06, scale: active ? { duration: 0.35, delay: i * 0.08, ease: [0.34, 1.56, 0.64, 1] } : undefined }}
            style={{ transformOrigin: `${WORM_X + WORM_W / 2}px ${CARD_Y + 69 + i * 50}px` }}
          >
            <rect x={WORM_X + 16} y={CARD_Y + 50 + i * 50} width={WORM_W - 32} height={38} rx={6}
              fill={active ? "#E3FCF7" : "#F9FBFA"}
              stroke={active ? "#00A35C" : "#E8EDEB"} strokeWidth={1} />
            <text x={WORM_X + 28} y={CARD_Y + 65 + i * 50} className={styles.wormId}
              fill={active ? "#00684A" : "#5C6C75"}>
              {entry.wormId}
            </text>
            <text x={WORM_X + 28} y={CARD_Y + 80 + i * 50} className={styles.wormMeta}>
              {entry.journalId} · {entry.event} · seq {entry.seq}
            </text>
            {active && (
              <text x={WORM_X + WORM_W - 28} y={CARD_Y + 74 + i * 50}
                textAnchor="end" className={styles.wormReplayed}>
                {caughtUp ? "replayed ✓" : "reading…"}
              </text>
            )}
          </motion.g>
        );
      })}

      {/* Recovery arrow: WORM → consumer (arcs below card zone) */}
      <AnimatePresence>
        {isRecovery && (
          <motion.path
            key="recArrow"
            d={`M${WORM_X},${REC_Y} C${WORM_X - 40},${REC_Y + 84} ${CON_X + CON_W + 40},${REC_Y + 84} ${CON_X + CON_W},${REC_Y}`}
            fill="none" stroke="#00A35C" strokeWidth={2}
            strokeDasharray="10 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            markerEnd="url(#heArrowGreen)"
          />
        )}
      </AnimatePresence>
      {isRecovery && (
        <text x={(WORM_X + CON_X + CON_W) / 2} y={REC_Y + 96}
          textAnchor="middle" className={styles.recoveryArrowLabel}>
          replaying from WORM sink
        </text>
      )}

      {/* Idle hint */}
      {!isActive && (
        <text x={W / 2} y={H / 2 + 8} textAnchor="middle" className={styles.idleHint} opacity={0.28}>
          Press Simulate →
        </text>
      )}
    </svg>
  );
}
