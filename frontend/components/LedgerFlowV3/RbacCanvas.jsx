"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../LedgerFlow/motionConfig";
import styles from "./RbacCanvas.module.css";

const W = 1600, H = 440;
const TABLE_X = 30, TABLE_W = 930;
const PANEL_X = 978, PANEL_W = 592, PANEL_Y = 36, PANEL_H = 396;

// Column x positions within the table
const C1 = TABLE_X + 8;    // Role name
const C2 = TABLE_X + 218;  // Principal
const C3 = TABLE_X + 376;  // Capabilities
const C4 = TABLE_X + 758;  // Scope

const ROW_H = 48;
const HEADER_Y = 40;
const FIRST_ROW_Y = HEADER_Y + 34;

const ROLES = [
  { role: "lbLedgerWriter",   principal: "payment-svc",   cap: "INSERT journalEntries · paymentInstructions", scope: "write gate",  scopeColor: "#00684A", scopeFill: "#E3FCF7", scopeStroke: "#00A35C" },
  { role: "lbLedgerReader",   principal: "reporting-svc", cap: "READ journalEntries · accountBalances",        scope: "read-only",   scopeColor: "#016BF8", scopeFill: "#EBF4FF", scopeStroke: "#A5C7FF" },
  { role: "lbCDCDaemon",      principal: "cdc-tier-svc",  cap: "changeStream journalEntries",                  scope: "CDC only",    scopeColor: "#016BF8", scopeFill: "#EBF4FF", scopeStroke: "#A5C7FF" },
  { role: "lbReconciler",     principal: "reconcile-svc", cap: "READ journal · WRITE reconciliation*",         scope: "reconcile",   scopeColor: "#5C3DA4", scopeFill: "#F0EDFF", scopeStroke: "#B8A9FF" },
  { role: "lbErasureOfficer", principal: "GDPR workflow", cap: "WRITE customers(DEK) · READ auditLog",         scope: "GDPR",        scopeColor: "#944F01", scopeFill: "#FDE7C8", scopeStroke: "#F5C16C" },
  { role: "lbAuditor",        principal: "compliance",    cap: "READ all collections + auditLog",              scope: "read-all",    scopeColor: "#5C6C75", scopeFill: "#F2F3F4", scopeStroke: "#C1C7C6" },
  { role: "lbBreakGlass",     principal: "on-call SRE",   cap: "full access · 4h TTL · 2-person approval",    scope: "emergency",   scopeColor: "#C03C0C", scopeFill: "#FEF3CD", scopeStroke: "#944F01" },
];

const BLAST_CHECKS = [
  { label: "INSERT journalEntries",      result: true  },
  { label: "DELETE journalEntries",      result: false },
  { label: "ALTER $expr validators",     result: false },
  { label: "READ customers (DEK fields)",result: false },
  { label: "READ reconciliationRuns",    result: false },
  { label: "READ auditLog",             result: false },
];

const BREAKGLASS_ROWS = [
  { key: "TTL",       val: "4 hours · auto-expire" },
  { key: "approval",  val: "2-person required" },
  { key: "ticket",    val: "Jira/ServiceNow · required" },
  { key: "scope",     val: "all collections during window" },
  { key: "auditLog",  val: "every grant event logged" },
  { key: "self-cover",val: "cannot modify auditLog" },
];

const WORM_MECHANISMS = [
  { title: "S3 Object Lock",    sub: "Compliance mode · 7yr retention", color: "#944F01", fill: "#FDE7C8", stroke: "#F5C16C" },
  { title: "siem-worm",         sub: "append-only SIEM · hash chain",   color: "#016BF8", fill: "#EBF4FF", stroke: "#A5C7FF" },
  { title: "syslog-immutable",  sub: "syslog-ng → append-only volume",  color: "#5C3DA4", fill: "#F0EDFF", stroke: "#B8A9FF" },
  { title: "blockchain-anchor", sub: "Merkle root · public chain",      color: "#00684A", fill: "#E3FCF7", stroke: "#00A35C" },
];

function RoleRow({ role, y, visible, highlight }) {
  const bw = 84;
  return (
    <AnimatePresence>
      {visible && (
        <motion.g
          key={role.role}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ ...SPRING.default }}
        >
          <rect x={TABLE_X} y={y} width={TABLE_W} height={ROW_H - 2} rx={0}
            fill={highlight ? "#F9FBFA" : "transparent"} />
          {highlight && (
            <rect x={TABLE_X} y={y} width={4} height={ROW_H - 2} fill={role.scopeColor} opacity={0.6} />
          )}
          <text x={C1} y={y + 18} className={styles.roleLabel} fill={role.scopeColor}>
            {role.role}
          </text>
          <text x={C2} y={y + 18} className={styles.roleCell}>{role.principal}</text>
          <text x={C3} y={y + 18} className={styles.roleCell}>{role.cap}</text>
          {/* Scope badge */}
          <rect x={C4} y={y + 6} width={bw} height={20} rx={10}
            fill={role.scopeFill} stroke={role.scopeStroke} strokeWidth={1} />
          <text x={C4 + bw / 2} y={y + 19} textAnchor="middle"
            className={styles.scopeBadge} fill={role.scopeColor}>
            {role.scope}
          </text>
        </motion.g>
      )}
    </AnimatePresence>
  );
}

function BlastPanel({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.g key="blast"
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          transition={{ ...SPRING.default, delay: 0.1 }}>
          <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx={10}
            fill="#FEF3CD" stroke="#944F01" strokeWidth={1.5} />
          <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={8} rx={4} fill="#C03C0C" />
          <text x={PANEL_X + 14} y={PANEL_Y + 30} className={styles.panelTitle} fill="#C03C0C">
            lbLedgerWriter COMPROMISED
          </text>
          <text x={PANEL_X + 14} y={PANEL_Y + 48} className={styles.panelSub}>
            blast radius is bounded by least privilege
          </text>
          <line x1={PANEL_X + 14} y1={PANEL_Y + 60} x2={PANEL_X + PANEL_W - 14} y2={PANEL_Y + 60}
            stroke="#F5C16C" strokeWidth={1} />
          {BLAST_CHECKS.map((c, i) => (
            <motion.g key={c.label}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.06 }}>
              <text x={PANEL_X + 14} y={PANEL_Y + 84 + i * 44}
                className={styles.checkRow} fill={c.result ? "#C03C0C" : "#5C6C75"}>
                {c.result ? "✓ CAN: " : "✗ CANNOT: "}{c.label}
              </text>
              <text x={PANEL_X + 14} y={PANEL_Y + 100 + i * 44}
                className={styles.panelSub}>
                {c.result ? "attacker can forge entries" : "access denied · no privilege"}
              </text>
            </motion.g>
          ))}
        </motion.g>
      )}
    </AnimatePresence>
  );
}

function BreakGlassPanel({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.g key="breakglass"
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          transition={{ ...SPRING.default, delay: 0.1 }}>
          <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx={10}
            fill="#FEF3CD" stroke="#944F01" strokeWidth={1.5} />
          <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={8} rx={4} fill="#944F01" />
          <text x={PANEL_X + 14} y={PANEL_Y + 30} className={styles.panelTitle} fill="#944F01">
            breakGlassAdmin POLICY
          </text>
          <text x={PANEL_X + 14} y={PANEL_Y + 48} className={styles.panelSub}>
            never permanently assigned · created on demand
          </text>
          <line x1={PANEL_X + 14} y1={PANEL_Y + 60} x2={PANEL_X + PANEL_W - 14} y2={PANEL_Y + 60}
            stroke="#F5C16C" strokeWidth={1} />
          {BREAKGLASS_ROWS.map((r, i) => (
            <motion.g key={r.key}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.06 }}>
              <text x={PANEL_X + 14} y={PANEL_Y + 82 + i * 50}
                className={styles.policyKey} fill="#944F01">{r.key}</text>
              <text x={PANEL_X + 130} y={PANEL_Y + 82 + i * 50}
                className={styles.policyVal}>{r.val}</text>
              <line x1={PANEL_X + 14} y1={PANEL_Y + 94 + i * 50}
                x2={PANEL_X + PANEL_W - 14} y2={PANEL_Y + 94 + i * 50}
                stroke="#F5C16C" strokeWidth={0.8} opacity={0.5} />
            </motion.g>
          ))}
        </motion.g>
      )}
    </AnimatePresence>
  );
}

function OcsfPanel({ visible }) {
  const CODE_LINES = [
    { t: "comment", v: "# mongod.conf — enable full authorization audit" },
    { t: "key",     v: "security:" },
    { t: "sub",     v: "  auditLog:" },
    { t: "key",     v: "    destination: ", v2: "file" },
    { t: "key",     v: "    format: ", v2: "JSON" },
    { t: "key",     v: "    filter: { atype: { $in: [" },
    { t: "val",     v: '      "authCheck"' },
    { t: "val",     v: '      "authCheckSuccess"' },
    { t: "key",     v: "    ]}}" },
    { t: "comment", v: "# OCSF schema 4002 — AuthZ Activity" },
    { t: "key",     v: "auditAuthorizationSuccess: ", v2: "true" },
    { t: "comment", v: "# → fluentd → SIEM (Splunk / CrowdStrike)" },
  ];
  return (
    <AnimatePresence>
      {visible && (
        <motion.g key="ocsf"
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          transition={{ ...SPRING.default, delay: 0.1 }}>
          <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx={10}
            fill="#F2F3F4" stroke="#C1C7C6" strokeWidth={1.5} />
          <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={8} rx={4} fill="#016BF8" />
          <text x={PANEL_X + 14} y={PANEL_Y + 30} className={styles.panelTitle} fill="#016BF8">
            OCSF AUDIT CONFIGURATION
          </text>
          <text x={PANEL_X + 14} y={PANEL_Y + 48} className={styles.panelSub}>
            every authorized operation emitted · not just failures
          </text>
          <rect x={PANEL_X + 10} y={PANEL_Y + 58} width={PANEL_W - 20} height={PANEL_H - 68} rx={6}
            fill="#1E2A35" />
          {CODE_LINES.map((line, i) => (
            <motion.text key={i} x={PANEL_X + 22} y={PANEL_Y + 82 + i * 26}
              className={line.t === "comment" ? styles.codeComment : line.t === "val" ? styles.codeKeyword : styles.codeText}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.04 }}>
              {line.v}{line.v2 && <tspan fill="#F59B00">{line.v2}</tspan>}
            </motion.text>
          ))}
        </motion.g>
      )}
    </AnimatePresence>
  );
}

function WormPanel({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.g key="worm"
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          transition={{ ...SPRING.default, delay: 0.1 }}>
          <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx={10}
            fill="#FAFBFA" stroke="#E8EDEB" strokeWidth={1.5} />
          <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={8} rx={4} fill="#00684A" />
          <text x={PANEL_X + 14} y={PANEL_Y + 30} className={styles.panelTitle} fill="#00684A">
            WORM TAMPER EVIDENCE
          </text>
          <text x={PANEL_X + 14} y={PANEL_Y + 48} className={styles.panelSub}>
            four certified mechanisms · pick what fits your stack
          </text>
          <line x1={PANEL_X + 14} y1={PANEL_Y + 60} x2={PANEL_X + PANEL_W - 14} y2={PANEL_Y + 60}
            stroke="#E8EDEB" strokeWidth={1} />

          {/* 2×2 grid */}
          {WORM_MECHANISMS.map((m, i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const bx = PANEL_X + 14 + col * (PANEL_W / 2 - 10);
            const by = PANEL_Y + 72 + row * 154;
            const bw = PANEL_W / 2 - 24, bh = 140;
            return (
              <motion.g key={m.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...SPRING.default, delay: 0.15 + i * 0.08 }}
                style={{ transformOrigin: `${bx + bw / 2}px ${by + bh / 2}px` }}>
                <rect x={bx} y={by} width={bw} height={bh} rx={8}
                  fill={m.fill} stroke={m.stroke} strokeWidth={1.2} />
                <rect x={bx} y={by} width={bw} height={6} rx={3} fill={m.color} />
                <text x={bx + 12} y={by + 26} className={styles.wormTitle} fill={m.color}>
                  {m.title}
                </text>
                <text x={bx + 12} y={by + 44} className={styles.wormSub}>
                  {m.sub}
                </text>
                <text x={bx + 12} y={by + 68} className={styles.wormSub}>
                  RFC 3161 compatible
                </text>
              </motion.g>
            );
          })}
        </motion.g>
      )}
    </AnimatePresence>
  );
}

function IntroPanel({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.g key="intro"
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          transition={{ ...SPRING.default, delay: 0.15 }}>
          <rect x={PANEL_X} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx={10}
            fill="#F2F3F4" stroke="#E8EDEB" strokeWidth={1.5} />
          <text x={PANEL_X + 14} y={PANEL_Y + 32} className={styles.panelTitle} fill="#001E2B">
            7 ROLES · LEAST PRIVILEGE
          </text>
          <text x={PANEL_X + 14} y={PANEL_Y + 50} className={styles.panelSub}>
            every principal gets exactly one role
          </text>
          {[
            "Service accounts: least-privilege scoped to collection + operation",
            "No default admin access for any service account",
            "Human operators: read-only by default",
            "breakGlassAdmin: demand-created · 4h TTL · audited",
          ].map((line, i) => (
            <motion.text key={i} x={PANEL_X + 14} y={PANEL_Y + 90 + i * 56}
              className={styles.panelSub}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.06 }}>
              {"› " + line}
            </motion.text>
          ))}
        </motion.g>
      )}
    </AnimatePresence>
  );
}

export default function RbacCanvas({ state }) {
  const rbac = state?.rbac || {};
  const reached = (s) => !!rbac.reachedStages?.[s];
  const isActive = rbac.status !== "IDLE";

  const rolesVisible     = reached("RBAC_ROLES");
  const blastVisible     = reached("RBAC_BLAST_RADIUS");
  const breakGlassVisible = reached("RBAC_BREAKGLASS");
  const ocsfVisible      = reached("RBAC_OCSF");
  const wormVisible      = reached("RBAC_WORM");

  const currentStage = rbac.currentStage;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>

      <rect width={W} height={H} fill="#FAFBFA" />

      {/* Header bar */}
      <rect x={0} y={0} width={W} height={32} fill="#F9FBFA" />
      <line x1={0} y1={32} x2={W} y2={32} stroke="#E8EDEB" strokeWidth={1} />
      {isActive ? (
        <text x={40} y={20} className={styles.headerText}>
          RBAC · 7 roles · least privilege · breakGlass 4h TTL · OCSF 4002 · WORM audit
        </text>
      ) : (
        <text x={W / 2} y={20} textAnchor="middle" className={styles.headerText} opacity={0.4}>
          RBAC & AUDIT · Press Simulate to explore
        </text>
      )}

      {/* Vertical divider */}
      {isActive && (
        <line x1={PANEL_X - 8} y1={36} x2={PANEL_X - 8} y2={H - 8}
          stroke="#E8EDEB" strokeWidth={1} />
      )}

      {/* Table header */}
      {rolesVisible && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <rect x={TABLE_X} y={HEADER_Y} width={TABLE_W} height={28} rx={0}
            fill="#F2F3F4" />
          <text x={C1} y={HEADER_Y + 17} className={styles.colHeader}>ROLE</text>
          <text x={C2} y={HEADER_Y + 17} className={styles.colHeader}>PRINCIPAL</text>
          <text x={C3} y={HEADER_Y + 17} className={styles.colHeader}>CAPABILITIES</text>
          <text x={C4} y={HEADER_Y + 17} className={styles.colHeader}>SCOPE</text>
        </motion.g>
      )}

      {/* Role rows */}
      {ROLES.map((role, i) => (
        <RoleRow
          key={role.role}
          role={role}
          y={FIRST_ROW_Y + i * ROW_H}
          visible={rolesVisible}
          highlight={
            (blastVisible && role.role === "lbLedgerWriter" && !breakGlassVisible) ||
            (breakGlassVisible && !ocsfVisible && role.role === "lbBreakGlass")
          }
        />
      ))}

      {/* Row separators */}
      {rolesVisible && ROLES.map((_, i) => (
        <line key={i}
          x1={TABLE_X} y1={FIRST_ROW_Y + (i + 1) * ROW_H - 2}
          x2={TABLE_X + TABLE_W} y2={FIRST_ROW_Y + (i + 1) * ROW_H - 2}
          stroke="#E8EDEB" strokeWidth={0.8} opacity={0.7} />
      ))}

      {/* Right panel — AnimatePresence switches per stage */}
      <AnimatePresence mode="wait">
        {wormVisible && <WormPanel key="worm-p" visible />}
        {ocsfVisible && !wormVisible && <OcsfPanel key="ocsf-p" visible />}
        {breakGlassVisible && !ocsfVisible && <BreakGlassPanel key="bg-p" visible />}
        {blastVisible && !breakGlassVisible && <BlastPanel key="blast-p" visible />}
        {rolesVisible && !blastVisible && <IntroPanel key="intro-p" visible />}
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
