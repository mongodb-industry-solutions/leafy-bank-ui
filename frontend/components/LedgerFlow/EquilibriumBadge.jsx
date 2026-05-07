"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "./motionConfig";
import styles from "./EquilibriumBadge.module.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n || 0);

const EquilibriumBadge = ({ debit = 0, credit = 0, active = false }) => {
  const balanced = active && debit > 0 && Math.abs(debit - credit) < 0.005;
  const cls = [
    styles.badge,
    active ? styles.active : "",
    balanced ? styles.balanced : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div
      className={cls}
      role="status"
      aria-live="polite"
      animate={
        balanced
          ? {
              y: [0, -5, 1.5, 0],
              scale: [1, 1.05, 0.98, 1],
              boxShadow: [
                "0px 2px 4px 1px rgba(0,30,43,0.10)",
                "0px 4px 22px 3px rgba(0,164,74,0.38)",
                "0px 2px 8px 1px rgba(0,163,92,0.22)",
              ],
            }
          : { y: 0, scale: 1, boxShadow: "0px 2px 4px 1px rgba(0,30,43,0.10)" }
      }
      transition={balanced ? { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } : SPRING.default}
    >
      <motion.span
        className={styles.dot}
        aria-hidden="true"
        animate={
          balanced
            ? {
                scale: [1, 1.9, 0.85, 1],
                boxShadow: [
                  "0 0 6px rgba(0,237,100,0.6)",
                  "0 0 20px rgba(0,237,100,0.85)",
                  "0 0 8px rgba(0,237,100,0.70)",
                ],
              }
            : {}
        }
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      />
      <span className={styles.label}>Equilibrium</span>
      <span className={styles.valDr}>{fmt(debit)}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={balanced ? "eq" : "neq"}
          className={styles.op}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={SPRING.default}
        >
          {balanced ? "=" : "≠"}
        </motion.span>
      </AnimatePresence>
      <span className={styles.valCr}>{fmt(credit)}</span>
      <span className={styles.check} aria-hidden="true">{balanced ? "✓" : "·"}</span>
    </motion.div>
  );
};

export default EquilibriumBadge;
