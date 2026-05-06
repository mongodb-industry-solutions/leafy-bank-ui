"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../LedgerFlow/motionConfig";
import { FRIDA_DEK, FRIDA_CUSTOMER_DOC, SAMPLE_JOURNAL_ENTRIES } from "./erasureFixtures";
import styles from "./ErasureCanvas.module.css";

// ─── Layout ───────────────────────────────────────────────────────────────────
const W = 1600, H = 440;
const CARD_Y = 52;

// Left: keyVault
const KV_X = 50, KV_W = 430, KV_H = 282;

// Centre: erasure action zone
const ACT_X = 550, ACT_W = 500, ACT_H = 282;
const ACT_CX = ACT_X + ACT_W / 2;

// Right: two stacked mini-cards
const R_X = 1120, R_W = 430;
const CUST_Y = CARD_Y, CUST_H = 132;
const JNL_Y = CARD_Y + CUST_H + 18, JNL_H = 132;

// Query bar
const Q_X = 50, Q_Y = 360, Q_W = 1500, Q_H = 54;

// Encrypted field labels shown in customers card
const ENC_FIELDS = ["nationalId", "taxId", "passportNumber"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shortId(id) { return id.length > 26 ? id.slice(0, 26) + "…" : id; }

// ─── Key icon path (centred at 0,0) ──────────────────────────────────────────
function KeyIcon({ cx, cy, size = 24, color = "#C82430", opacity = 1 }) {
  const r = size * 0.38;
  return (
    <g opacity={opacity}>
      <circle cx={cx - size * 0.15} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.1} />
      <line x1={cx - size * 0.15 + r} y1={cy} x2={cx + size * 0.55} y2={cy}
        stroke={color} strokeWidth={size * 0.1} />
      <line x1={cx + size * 0.35} y1={cy} x2={cx + size * 0.35} y2={cy + size * 0.22}
        stroke={color} strokeWidth={size * 0.09} />
      <line x1={cx + size * 0.2} y1={cy} x2={cx + size * 0.2} y2={cy + size * 0.18}
        stroke={color} strokeWidth={size * 0.09} />
    </g>
  );
}

// ─── Main canvas ──────────────────────────────────────────────────────────────
export default function ErasureCanvas({ state }) {
  const er = state?.erasure || {};
  const reached = (s) => !!er.reachedStages?.[s];
  const isActive = er.status !== "IDLE";

  const isRequested  = reached("ERASURE_REQUESTED");
  const isLocated    = reached("ERASURE_DEK_LOCATED");
  const isDeleted    = reached("ERASURE_DEK_DELETED");
  const isOrphaned   = reached("ERASURE_CIPHERTEXT_ORPHANED");
  const isQueryDone  = reached("ERASURE_QUERY_ATTEMPT");
  const isAudited    = reached("ERASURE_AUDIT_LOGGED");

  const kvAccent   = isDeleted ? "#C82430" : (isLocated ? "#944F01" : "#5C6C75");
  const kvFill     = isDeleted ? "#FFEAE5" : (isLocated ? "#FDE7C8" : "#F9FBFA");
  const kvStroke   = isDeleted ? "#C82430" : (isLocated ? "#944F01" : "#E8EDEB");

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}>
      <defs>
        <marker id="erArrowRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#C82430" />
        </marker>
      </defs>

      <rect width={W} height={H} fill="#FAFBFA" />

      {/* Header */}
      <rect x={0} y={0} width={W} height={38} fill="#F9FBFA" />
      <line x1={0} y1={38} x2={W} y2={38} stroke="#E8EDEB" strokeWidth={1} />
      {isActive ? (
        <text x={40} y={23} className={styles.headerText}>
          GDPR ERASURE · CUST-FRIDA-001 · DEK-FRIDA-001 · crypto-shredding · Art. 17
        </text>
      ) : (
        <text x={W / 2} y={23} textAnchor="middle" className={styles.headerText} opacity={0.4}>
          GDPR ERASURE · CRYPTO-SHREDDING · Press Simulate to run
        </text>
      )}

      {/* ── Left: keyVault card ──────────────────────────────────────────── */}
      <motion.rect
        x={KV_X} y={CARD_Y} width={KV_W} height={KV_H} rx={12}
        fill="white"
        animate={{ stroke: kvStroke }}
        strokeWidth={1.5}
        transition={SPRING.default}
      />
      <motion.rect
        x={KV_X} y={CARD_Y} width={KV_W} height={5} rx={4}
        animate={{ fill: kvFill }}
        transition={SPRING.default}
        opacity={0.7}
      />
      <motion.text x={KV_X + KV_W / 2} y={CARD_Y + 19} textAnchor="middle"
        className={styles.cardHeader}
        animate={{ fill: kvAccent }}
        transition={SPRING.default}
      >
        KEY VAULT
      </motion.text>
      <text x={KV_X + KV_W / 2} y={CARD_Y + 33} textAnchor="middle" className={styles.cardSub}>
        keyVault · DEK-FRIDA-001
      </text>

      {/* DEK document fields — shown when active */}
      <AnimatePresence>
        {isLocated && !isDeleted && (
          <motion.g key="dekFields"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {[
              { label: "_id",        val: "DEK-FRIDA-001" },
              { label: "customerId", val: "CUST-FRIDA-001" },
              { label: "provider",   val: "kmip · master-001" },
              { label: "createdAt",  val: "2026-05-06T09:00:01Z" },
            ].map((row, i) => (
              <g key={row.label}>
                <text x={KV_X + 18} y={CARD_Y + 58 + i * 28} className={styles.fieldKey}>{row.label}:</text>
                <text x={KV_X + 110} y={CARD_Y + 58 + i * 28} className={styles.fieldVal}>
                  {row.val.length > 22 ? row.val.slice(0, 22) + "…" : row.val}
                </text>
              </g>
            ))}
            {/* keyMaterial row */}
            <text x={KV_X + 18} y={CARD_Y + 170} className={styles.fieldKey}>keyMaterial:</text>
            <text x={KV_X + 110} y={CARD_Y + 170} className={styles.cipherVal}>{"{ $binary … }"}</text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Deleted state — strike-through and DELETED stamp */}
      <AnimatePresence>
        {isDeleted && (
          <motion.g key="deleted"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Struck-through field rows */}
            {[
              { label: "_id",        val: "DEK-FRIDA-001" },
              { label: "customerId", val: "CUST-FRIDA-001" },
              { label: "provider",   val: "kmip · master-001" },
              { label: "keyMaterial", val: "{ $binary … }" },
            ].map((row, i) => (
              <g key={row.label} opacity={0.4}>
                <text x={KV_X + 18} y={CARD_Y + 58 + i * 38} className={styles.fieldKey}>{row.label}:</text>
                <text x={KV_X + 110} y={CARD_Y + 58 + i * 38} className={styles.fieldValStruck}>{row.val}</text>
                <line
                  x1={KV_X + 108} y1={CARD_Y + 54 + i * 38}
                  x2={KV_X + KV_W - 18} y2={CARD_Y + 54 + i * 38}
                  stroke="#C82430" strokeWidth={1.2}
                />
              </g>
            ))}
          </motion.g>
        )}
      </AnimatePresence>

      {/* DELETED watermark stamp */}
      <AnimatePresence>
        {isDeleted && (
          <motion.g key="stamp"
            initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
            animate={{ opacity: 0.18, scale: 1, rotate: -22 }}
            exit={{ opacity: 0 }}
            style={{ transformOrigin: `${KV_X + KV_W / 2}px ${CARD_Y + KV_H / 2}px` }}
            transition={{ ...SPRING.default, delay: 0.15 }}
          >
            <rect
              x={KV_X + 60} y={CARD_Y + KV_H / 2 - 32}
              width={KV_W - 120} height={64} rx={8}
              fill="none" stroke="#C82430" strokeWidth={3.5}
            />
            <text x={KV_X + KV_W / 2} y={CARD_Y + KV_H / 2 + 8}
              textAnchor="middle" className={styles.stampText} fill="#C82430">
              DELETED
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* ── Centre: erasure action zone ──────────────────────────────────── */}
      <motion.rect
        x={ACT_X} y={CARD_Y} width={ACT_W} height={ACT_H} rx={12}
        fill="#F5F7FA"
        animate={{ stroke: isDeleted ? "#C82430" : (isRequested ? "#944F01" : "#E8EDEB") }}
        strokeWidth={1}
        transition={SPRING.default}
      />
      <text x={ACT_CX} y={CARD_Y + 20} textAnchor="middle" className={styles.actTitle}>
        CRYPTO-SHREDDING
      </text>
      <text x={ACT_CX} y={CARD_Y + 34} textAnchor="middle" className={styles.actSub}>
        GDPR Art. 17 · delete the key, not the record
      </text>

      {/* Command shown when located */}
      <AnimatePresence>
        {isLocated && (
          <motion.g key="cmd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <rect x={ACT_X + 30} y={CARD_Y + 50} width={ACT_W - 60} height={36} rx={6}
              fill="#FFEAE5" stroke={isDeleted ? "#C82430" : "#F3916A"} strokeWidth={1} />
            <text x={ACT_CX} y={CARD_Y + 73} textAnchor="middle" className={styles.cmdText}>
              db.keyVault.deleteOne({"{ "}_id: "DEK-FRIDA-001"{"}"})
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Key icon — breaks when deleted */}
      <AnimatePresence mode="wait">
        {isRequested && !isDeleted && (
          <motion.g key="keyIntact"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3, rotate: 45 }}
            style={{ transformOrigin: `${ACT_CX}px ${CARD_Y + 148}px` }}
            transition={SPRING.default}
          >
            <KeyIcon cx={ACT_CX} cy={CARD_Y + 148} size={48} color="#944F01" />
          </motion.g>
        )}
        {isDeleted && (
          <motion.g key="keyGone"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ transformOrigin: `${ACT_CX}px ${CARD_Y + 148}px` }}
            transition={SPRING.default}
          >
            {/* Big red ✕ */}
            <line x1={ACT_CX - 22} y1={CARD_Y + 126} x2={ACT_CX + 22} y2={CARD_Y + 170}
              stroke="#C82430" strokeWidth={5} strokeLinecap="round" />
            <line x1={ACT_CX + 22} y1={CARD_Y + 126} x2={ACT_CX - 22} y2={CARD_Y + 170}
              stroke="#C82430" strokeWidth={5} strokeLinecap="round" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Status label in action zone */}
      <AnimatePresence mode="wait">
        {!isActive && (
          <motion.text key="idle" x={ACT_CX} y={CARD_Y + 200} textAnchor="middle"
            className={styles.actStatus} fill="#C1C7C6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            awaiting request
          </motion.text>
        )}
        {isRequested && !isDeleted && (
          <motion.text key="running" x={ACT_CX} y={CARD_Y + 200} textAnchor="middle"
            className={styles.actStatus} fill="#944F01"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            DEK-FRIDA-001 targeted
          </motion.text>
        )}
        {isDeleted && !isAudited && (
          <motion.text key="done" x={ACT_CX} y={CARD_Y + 200} textAnchor="middle"
            className={styles.actStatus} fill="#C82430"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            key material destroyed · ciphertext orphaned
          </motion.text>
        )}
        {isAudited && (
          <motion.text key="complete" x={ACT_CX} y={CARD_Y + 200} textAnchor="middle"
            className={styles.actStatus} fill="#00684A"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            erasure complete · audit logged ✓
          </motion.text>
        )}
      </AnimatePresence>

      {/* Journal retention note */}
      <AnimatePresence>
        {isDeleted && (
          <motion.g key="retentionNote"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <rect x={ACT_X + 30} y={CARD_Y + 222} width={ACT_W - 60} height={36} rx={6}
              fill="#E3FCF7" stroke="#00A35C" strokeWidth={1} />
            <text x={ACT_CX} y={CARD_Y + 236} textAnchor="middle" className={styles.retentionLabel}>
              journalEntries RETAINED
            </text>
            <text x={ACT_CX} y={CARD_Y + 250} textAnchor="middle" className={styles.retentionSub}>
              PSD2 Art. 25 · 5-year regulatory hold
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* ── Right top: customers mini-card ──────────────────────────────── */}
      <motion.rect
        x={R_X} y={CUST_Y} width={R_W} height={CUST_H} rx={10}
        fill="white"
        animate={{ stroke: isOrphaned ? "#C82430" : (isActive ? "#C1C7C6" : "#E8EDEB") }}
        strokeWidth={1.5}
        transition={SPRING.default}
      />
      <motion.rect x={R_X} y={CUST_Y} width={R_W} height={4} rx={3}
        animate={{ fill: isOrphaned ? "#FFEAE5" : "#E8EDEB" }}
        transition={SPRING.default}
      />
      <text x={R_X + R_W / 2} y={CUST_Y + 16} textAnchor="middle" className={styles.miniCardHeader}
        fill={isOrphaned ? "#C82430" : "#5C6C75"}>
        CUSTOMERS
      </text>

      {/* Plain fields always visible when active */}
      {isActive && (
        <g>
          <text x={R_X + 14} y={CUST_Y + 36} className={styles.fieldKey}>customerId:</text>
          <text x={R_X + 106} y={CUST_Y + 36} className={styles.fieldVal}>CUST-FRIDA-001</text>
          <text x={R_X + 14} y={CUST_Y + 56} className={styles.fieldKey}>fullName:</text>
          <text x={R_X + 106} y={CUST_Y + 56} className={styles.fieldVal}>Frida Karlsson</text>
        </g>
      )}

      {/* Encrypted fields row — show orphaned state after deletion */}
      {isActive && ENC_FIELDS.map((f, i) => (
        <g key={f}>
          <text x={R_X + 14} y={CUST_Y + 78 + i * 16} className={styles.fieldKey}
            fill={isOrphaned ? "#C82430" : "#5C6C75"}>
            {f}:
          </text>
          {isOrphaned ? (
            <text x={R_X + 130} y={CUST_Y + 78 + i * 16} className={styles.orphanedVal}>
              ∅ unreadable · key destroyed
            </text>
          ) : (
            <text x={R_X + 130} y={CUST_Y + 78 + i * 16} className={styles.cipherVal}>
              {"{ $binary · subType: \"06\" }"}
            </text>
          )}
        </g>
      ))}

      {/* ── Right bottom: journalEntries mini-card ───────────────────────── */}
      <rect x={R_X} y={JNL_Y} width={R_W} height={JNL_H} rx={10}
        fill="white" stroke={isActive ? "#00A35C" : "#E8EDEB"} strokeWidth={1.5} />
      <rect x={R_X} y={JNL_Y} width={R_W} height={4} rx={3}
        fill={isActive ? "#C0FAE6" : "#E8EDEB"} />
      <text x={R_X + R_W / 2} y={JNL_Y + 16} textAnchor="middle" className={styles.miniCardHeader}
        fill={isActive ? "#00684A" : "#889397"}>
        JOURNAL ENTRIES
      </text>
      {isActive && (
        <g>
          {SAMPLE_JOURNAL_ENTRIES.map((entry, i) => (
            <g key={entry.journalId}>
              <text x={R_X + 14} y={JNL_Y + 36 + i * 26} className={styles.jnlId}>
                {entry.journalId}
              </text>
              <text x={R_X + R_W - 14} y={JNL_Y + 36 + i * 26} textAnchor="end" className={styles.jnlStatus}>
                POSTED ✓
              </text>
            </g>
          ))}
          {/* RETAINED badge */}
          <rect x={R_X + R_W - 88} y={JNL_Y + JNL_H - 26} width={76} height={16} rx={8}
            fill="#00A35C" opacity={0.12} />
          <text x={R_X + R_W - 50} y={JNL_Y + JNL_H - 14} textAnchor="middle" className={styles.retainedBadge}>
            RETAINED
          </text>
        </g>
      )}

      {/* ── Query bar ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isQueryDone && (
          <motion.g key="queryBar"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING.default}
          >
            <rect x={Q_X} y={Q_Y} width={Q_W} height={Q_H} rx={10}
              fill="#FFEAE5" stroke="#C82430" strokeWidth={1.5} />
            <rect x={Q_X} y={Q_Y} width={6} height={Q_H} rx={6} fill="#C82430" />
            <text x={Q_X + 22} y={Q_Y + 19} className={styles.queryLabel}>FIND</text>
            <text x={Q_X + 70} y={Q_Y + 19} className={styles.queryCode}>
              {'db.customers.find({ nationalId: "SE-8507-2193-K" })'}
            </text>
            <text x={Q_X + 22} y={Q_Y + 38} className={styles.querySub}>
              ↳ driver cannot encrypt predicate — DEK-FRIDA-001 not found · query aborted · 0 documents returned
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Idle hint */}
      {!isActive && (
        <text x={W / 2} y={CARD_Y + KV_H / 2 + 8} textAnchor="middle"
          className={styles.idleHint} opacity={0.28}>
          Press Simulate →
        </text>
      )}
    </svg>
  );
}
