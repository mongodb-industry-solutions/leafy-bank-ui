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
          ? { rotate: [0, -6, 4, -2, 0], scale: [1, 1.04, 1] }
          : { rotate: 0, scale: 1 }
      }
      transition={balanced ? { duration: 0.55, ease: [0.2, 0.7, 0.3, 1] } : SPRING.default}
    >
      <motion.span
        className={styles.dot}
        aria-hidden="true"
        animate={
          balanced
            ? { boxShadow: ["0 0 0 0 rgba(0,237,100,0.0)", "0 0 0 10px rgba(0,237,100,0.0)"], scale: [1, 1.4, 1] }
            : {}
        }
        transition={{ duration: 0.6 }}
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
