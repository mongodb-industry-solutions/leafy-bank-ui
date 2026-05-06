"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../LedgerFlow/motionConfig";
import { FRIDA_KYC } from "./onboardingFixtures";
import styles from "./OnboardingCanvas.module.css";

// ─── Layout ───────────────────────────────────────────────────────────────────
const W = 1600, H = 440;

const CARD_Y = 52, CARD_H = 282;
const L_X = 50,  CARD_W = 410;
const R_X = 1140, CARD_W_R = 410;
const ENC_X = 530, ENC_W = 540;

// DEK box inside encryption zone
const DEK_W = 290, DEK_H = 54;
const DEK_X = ENC_X + (ENC_W - DEK_W) / 2;
const DEK_Y = CARD_Y + 68;

// KMS box
const KMS_W = 290, KMS_H = 46;
const KMS_X = ENC_X + (ENC_W - KMS_W) / 2;
const KMS_Y = DEK_Y + DEK_H + 52;

// Field rows
const FIELD_ROWS = [
  { label: "nationalId",     plain: FRIDA_KYC.nationalId,     y: CARD_Y + 148 },
  { label: "taxId",          plain: FRIDA_KYC.taxId,          y: CARD_Y + 180 },
  { label: "passportNumber", plain: FRIDA_KYC.passportNumber, y: CARD_Y + 214 },
];

const PLAIN_ROWS = [
  { label: "customerId", value: "CUST-FRIDA-001",   y: CARD_Y + 46 },
  { label: "fullName",   value: FRIDA_KYC.fullName, y: CARD_Y + 74 },
  { label: "email",      value: FRIDA_KYC.email,    y: CARD_Y + 102 },
];

// Query bar
const Q_Y = 358, Q_H = 56, Q_X = 50, Q_W = 1500;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cipherPreview(label) {
  return { nationalId: "BhPxK3m9qR4T…", taxId: "Bh7mN2kLqT9w…", passportNumber: "BhZnT4kLqM9w…" }[label] || "Bh…";
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function LayerCard({ x, w, label, sublabel, show, strokeColor, fillColor }) {
  return (
    <g>
      <rect x={x} y={CARD_Y} width={w} height={CARD_H} rx={12}
        fill="white" stroke={show ? strokeColor : "#E8EDEB"} strokeWidth={1.5} />
      <rect x={x} y={CARD_Y} width={w} height={5} rx={4} fill={show ? fillColor : "#E8EDEB"} opacity={0.6} />
      <text x={x + w / 2} y={CARD_Y + 19} textAnchor="middle" className={styles.cardHeader} fill={show ? strokeColor : "#889397"}>
        {label}
      </text>
      <text x={x + w / 2} y={CARD_Y + 33} textAnchor="middle" className={styles.cardSub}>
        {sublabel}
      </text>
      {show && (
        <line x1={x + 16} y1={CARD_Y + 122} x2={x + w - 16} y2={CARD_Y + 122}
          stroke="#E8EDEB" strokeWidth={1} strokeDasharray="4 3" />
      )}
    </g>
  );
}

function PlainRow({ x, y, label, value, show }) {
  if (!show) return null;
  return (
    <g>
      <text x={x + 18} y={y} className={styles.fieldKey}>{label}:</text>
      <text x={x + 132} y={y} className={styles.fieldVal}>
        {value.length > 22 ? value.slice(0, 22) + "…" : value}
      </text>
    </g>
  );
}

function EncLeftRow({ x, y, label, plain, kycVisible, locked }) {
  return (
    <g>
      {/* Lock icon */}
      <motion.g animate={{ opacity: locked ? 1 : 0.2 }} transition={SPRING.default}>
        <rect x={x + 14} y={y - 9} width={10} height={8} rx={2}
          fill="none" stroke={locked ? "#016BF8" : "#C1C7C6"} strokeWidth={1.2} />
        <path d={`M${x + 16},${y - 9} a3,3 0 0,1 6,0`}
          fill="none" stroke={locked ? "#016BF8" : "#C1C7C6"} strokeWidth={1.2} />
        <rect x={x + 17} y={y - 4} width={4} height={4} rx={1}
          fill={locked ? "#016BF8" : "#C1C7C6"} />
      </motion.g>
      <text x={x + 30} y={y} className={styles.fieldKey} fill={locked ? "#016BF8" : "#5C6C75"}>
        {label}:
      </text>
      {kycVisible && (
        <text x={x + 140} y={y} className={styles.fieldVal}>{plain}</text>
      )}
    </g>
  );
}

function EncRightRow({ x, y, label, show }) {
  if (!show) return null;
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Lock icon (always locked on right) */}
      <rect x={x + 14} y={y - 9} width={10} height={8} rx={2}
        fill="none" stroke="#016BF8" strokeWidth={1.2} />
      <path d={`M${x + 16},${y - 9} a3,3 0 0,1 6,0`}
        fill="none" stroke="#016BF8" strokeWidth={1.2} />
      <rect x={x + 17} y={y - 4} width={4} height={4} rx={1} fill="#016BF8" />
      <text x={x + 30} y={y} className={styles.fieldKey} fill="#016BF8">{label}:</text>
      {/* Ciphertext */}
      <text x={x + 140} y={y - 1} className={styles.cipherBrace}>{"{ "}</text>
      <text x={x + 156} y={y - 1} className={styles.cipherKey}>$binary</text>
      <text x={x + 210} y={y - 1} className={styles.cipherBrace}>{": "}</text>
      <text x={x + 222} y={y - 1} className={styles.cipherVal}>{cipherPreview(label)}</text>
      <text x={x + 140} y={y + 13} className={styles.cipherSub}>subType: "06" · FLE2</text>
    </motion.g>
  );
}

// ─── Main canvas ──────────────────────────────────────────────────────────────
export default function OnboardingCanvas({ state }) {
  const ob = state?.onboarding || {};
  const reached = (s) => !!ob.reachedStages?.[s];
  const isActive = ob.status !== "IDLE";

  const kycVisible   = reached("ONBOARD_KYC_CAPTURED");
  const dekVisible   = reached("ONBOARD_DEK_GENERATED");
  const kmsVisible   = reached("ONBOARD_DEK_WRAPPED");
  const encrypted    = reached("ONBOARD_FIELDS_ENCRYPTED");
  const written      = reached("ONBOARD_CUSTOMER_WRITTEN");
  const queryVisible = reached("ONBOARD_QUERY_DEMO");

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
      <defs>
        <marker id="obArrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#016BF8" />
        </marker>
      </defs>

      <rect width={W} height={H} fill="#FAFBFA" />

      {/* Header strip */}
      <rect x={0} y={0} width={W} height={38} fill="#F9FBFA" />
      <line x1={0} y1={38} x2={W} y2={38} stroke="#E8EDEB" strokeWidth={1} />
      {isActive ? (
        <text x={40} y={23} className={styles.headerText}>
          ONBOARDING · CUST-FRIDA-001 · Queryable Encryption · collections: keyVault · customers
        </text>
      ) : (
        <text x={W / 2} y={23} textAnchor="middle" className={styles.headerText} opacity={0.4}>
          ONBOARDING · QUERYABLE ENCRYPTION · Press Simulate to run
        </text>
      )}

      {/* ── Left card: App layer ─────────────────────────────────────────── */}
      <LayerCard x={L_X} w={CARD_W} label="APP LAYER" sublabel="mongodb driver · client-side"
        show={kycVisible} strokeColor="#944F01" fillColor="#FDE7C8" />
      {PLAIN_ROWS.map((r) => <PlainRow key={r.label} x={L_X} y={r.y} label={r.label} value={r.value} show={kycVisible} />)}
      {FIELD_ROWS.map((r) => (
        <EncLeftRow key={r.label} x={L_X} y={r.y} label={r.label} plain={r.plain}
          kycVisible={kycVisible} locked={encrypted} />
      ))}

      {/* ── Centre: Encryption zone ──────────────────────────────────────── */}
      <motion.rect
        x={ENC_X} y={CARD_Y} width={ENC_W} height={CARD_H} rx={12}
        fill="#F5F7FA"
        animate={{ stroke: dekVisible ? "#016BF8" : "#E8EDEB", opacity: isActive ? 1 : 0.45 }}
        strokeWidth={1}
        transition={SPRING.default}
      />
      <text x={ENC_X + ENC_W / 2} y={CARD_Y + 20} textAnchor="middle" className={styles.encTitle}>
        QUERYABLE ENCRYPTION
      </text>
      <text x={ENC_X + ENC_W / 2} y={CARD_Y + 34} textAnchor="middle" className={styles.encSub}>
        driver intercepts · encrypts before network
      </text>

      {/* DEK badge */}
      <AnimatePresence>
        {dekVisible && (
          <motion.g key="dek"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ transformOrigin: `${DEK_X + DEK_W / 2}px ${DEK_Y + DEK_H / 2}px` }}
            transition={SPRING.default}
          >
            <rect x={DEK_X} y={DEK_Y} width={DEK_W} height={DEK_H} rx={10}
              fill="#E1F7FF" stroke="#016BF8" strokeWidth={1.5} />
            {/* Simple key icon */}
            <g transform={`translate(${DEK_X + 22},${DEK_Y + DEK_H / 2 - 1})`}>
              <circle cx={0} cy={0} r={8} fill="none" stroke="#016BF8" strokeWidth={1.8} />
              <line x1={7} y1={-2} x2={20} y2={-2} stroke="#016BF8" strokeWidth={1.8} />
              <line x1={17} y1={-2} x2={17} y2={2} stroke="#016BF8" strokeWidth={1.5} />
              <line x1={13} y1={-2} x2={13} y2={2} stroke="#016BF8" strokeWidth={1.5} />
            </g>
            <text x={DEK_X + DEK_W / 2 + 12} y={DEK_Y + 22} textAnchor="middle" className={styles.dekLabel}>
              DEK-FRIDA-001
            </text>
            <text x={DEK_X + DEK_W / 2 + 12} y={DEK_Y + 38} textAnchor="middle" className={styles.dekSub}>
              per-customer · generated client-side
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Arrow DEK → KMS */}
      <AnimatePresence>
        {kmsVisible && (
          <motion.g key="arrow"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <line
              x1={DEK_X + DEK_W / 2} y1={DEK_Y + DEK_H + 4}
              x2={KMS_X + KMS_W / 2} y2={KMS_Y - 6}
              stroke="#016BF8" strokeWidth={1.5} strokeDasharray="5 3"
              markerEnd="url(#obArrowBlue)"
            />
            <text x={DEK_X + DEK_W / 2 + 16} y={DEK_Y + DEK_H + 26} className={styles.wrapLabel}>
              wrapped by
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* KMS box */}
      <AnimatePresence>
        {kmsVisible && (
          <motion.g key="kms"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ transformOrigin: `${KMS_X + KMS_W / 2}px ${KMS_Y + KMS_H / 2}px` }}
            transition={SPRING.default}
          >
            <rect x={KMS_X} y={KMS_Y} width={KMS_W} height={KMS_H} rx={10}
              fill="#E3FCF7" stroke="#00A35C" strokeWidth={1.5} />
            {/* Shield icon */}
            <g transform={`translate(${KMS_X + 20},${KMS_Y + KMS_H / 2 - 1})`}>
              <path d="M0,-9 L8,-9 L8,3 Q8,9 0,11 Q-8,9 -8,3 L-8,-9 Z"
                fill="none" stroke="#00684A" strokeWidth={1.5} />
              <path d="M-3,1 L0,4 L4,-3" fill="none" stroke="#00684A" strokeWidth={1.8} strokeLinecap="round" />
            </g>
            <text x={KMS_X + KMS_W / 2 + 12} y={KMS_Y + 17} textAnchor="middle" className={styles.kmsLabel}>
              KMS Master Key
            </text>
            <text x={KMS_X + KMS_W / 2 + 12} y={KMS_Y + 33} textAnchor="middle" className={styles.kmsSub}>
              vault.leafybank.internal · master-001
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* ── Encryption flow lines ────────────────────────────────────────── */}
      {FIELD_ROWS.map((r, i) => (
        <motion.line
          key={r.label}
          x1={L_X + CARD_W + 4} y1={r.y - 4}
          x2={R_X - 4} y2={r.y - 4}
          stroke="#016BF8" strokeWidth={1.2} strokeDasharray="8 4"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: encrypted ? 0.5 : 0, pathLength: encrypted ? 1 : 0 }}
          transition={{ duration: 0.85, delay: i * 0.2, ease: "easeInOut" }}
        />
      ))}

      {/* ── Right card: MongoDB storage ──────────────────────────────────── */}
      <LayerCard x={R_X} w={CARD_W_R} label="MONGODB STORAGE" sublabel="customers · ciphertext on disk"
        show={written} strokeColor="#00684A" fillColor="#C0FAE6" />
      {PLAIN_ROWS.map((r) => <PlainRow key={r.label} x={R_X} y={r.y} label={r.label} value={r.value} show={written} />)}
      {FIELD_ROWS.map((r) => (
        <EncRightRow key={r.label} x={R_X} y={r.y} label={r.label} show={written} />
      ))}

      {/* FLE2 badge on right card */}
      <AnimatePresence>
        {written && (
          <motion.g key="fle2badge"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <rect x={R_X + CARD_W_R - 108} y={CARD_Y + CARD_H - 27} width={94} height={17} rx={8}
              fill="#016BF8" opacity={0.1} />
            <text x={R_X + CARD_W_R - 61} y={CARD_Y + CARD_H - 14} textAnchor="middle" className={styles.subtypePill}>
              subType: "06" · FLE2
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* ── Query bar ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {queryVisible && (
          <motion.g key="queryBar"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING.default}
          >
            <rect x={Q_X} y={Q_Y} width={Q_W} height={Q_H} rx={10}
              fill="#E1F7FF" stroke="#016BF8" strokeWidth={1.5} />
            <rect x={Q_X} y={Q_Y} width={6} height={Q_H} rx={6} fill="#016BF8" />
            <text x={Q_X + 22} y={Q_Y + 19} className={styles.queryLabel}>FIND</text>
            <text x={Q_X + 72} y={Q_Y + 19} className={styles.queryCode}>
              {'db.customers.find({ nationalId: "SE-8507-2193-K" })'}
            </text>
            <text x={Q_X + 22} y={Q_Y + 40} className={styles.querySub}>
              ↳ driver encrypts predicate · server compares ciphertexts · 1 document matched ✓ · plaintext never leaves app
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Idle hint */}
      {!isActive && (
        <motion.text
          x={W / 2} y={CARD_Y + CARD_H / 2 + 8}
          textAnchor="middle"
          className={styles.idleHint}
          animate={{ opacity: [0.28, 0.55, 0.28] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          Press Simulate →
        </motion.text>
      )}
    </svg>
  );
}
