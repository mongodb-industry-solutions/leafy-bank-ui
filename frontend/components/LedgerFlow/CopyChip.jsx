"use client";

import React, { useCallback, useState } from "react";
import styles from "./CopyChip.module.css";

const CopyChip = ({ label, value, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // swallow — chip simply doesn't flash on failure
    }
  }, [value]);

  return (
    <button
      type="button"
      className={`${styles.chip} ${copied ? styles.copied : ""}`}
      onClick={handleCopy}
      title={title || `Copy ${label}`}
      aria-label={`Copy ${label}: ${value}`}
    >
      {label && <span className={styles.label}>{label}</span>}
      <span className={styles.value}>{value}</span>
      <span className={styles.icon} aria-hidden="true">
        {copied ? "✓" : "⧉"}
      </span>
    </button>
  );
};

export default CopyChip;
