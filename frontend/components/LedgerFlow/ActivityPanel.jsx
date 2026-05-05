"use client";

import React, { useMemo } from "react";
import { Body, Subtitle } from "@leafygreen-ui/typography";
import Badge from "@leafygreen-ui/badge";
import Code from "@leafygreen-ui/code";
import { STAGES } from "./ledgerFixtures";
import CopyChip from "./CopyChip";
import styles from "./ActivityPanel.module.css";

const fmtMoney = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

function stageBadge({ stageKey, currentStage, reachedStages, status }) {
  const reached = !!reachedStages[stageKey];
  const isCurrent = currentStage === stageKey;
  if (stageKey === "RECONCILE_SKIPPED" && reached) {
    return <Badge variant="yellow">Skipped — MVP</Badge>;
  }
  if (stageKey === "SETTLED" && status === "SETTLED") {
    return <Badge variant="green">Settled</Badge>;
  }
  if (reached) return <Badge variant="green">Posted</Badge>;
  if (isCurrent) return <Badge variant="blue">In flight</Badge>;
  return <Badge variant="lightgray">Pending</Badge>;
}

function StageTimeline({ currentStage, reachedStages, status }) {
  return (
    <div className={styles.timeline}>
      <Subtitle className={styles.sectionHeading}>Pipeline</Subtitle>
      <ol className={styles.stageList}>
        {STAGES.map((s) => {
          const reached = !!reachedStages[s.key];
          const isCurrent = currentStage === s.key;
          const isSkipped = s.key === "RECONCILE_SKIPPED";
          return (
            <li
              key={s.key}
              className={[
                styles.stageRow,
                reached ? styles.reached : "",
                isCurrent ? styles.current : "",
                isSkipped && reached ? styles.skipped : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.stageLabel}>{s.label}</span>
              <span className={styles.stageBadge}>
                {stageBadge({ stageKey: s.key, currentStage, reachedStages, status })}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function BalancesTicker({ balances }) {
  const entries = Object.entries(balances || {});
  return (
    <div className={styles.balances}>
      <Subtitle className={styles.sectionHeading}>Balances</Subtitle>
      {entries.length === 0 ? (
        <Body className={styles.emptyHint}>No active payment.</Body>
      ) : (
        <ul className={styles.balanceList}>
          {entries.map(([accountId, b]) => {
            const delta = b.current - b.before;
            const direction = delta === 0 ? "flat" : delta > 0 ? "up" : "down";
            return (
              <li key={accountId} className={styles.balanceRow}>
                <div className={styles.balanceWho}>
                  <span className={styles.balanceName}>{b.displayName}</span>
                  <span className={styles.balanceAcct}>{accountId}</span>
                </div>
                <div className={styles.balanceNumbers}>
                  <span className={styles.balanceBefore}>{fmtMoney(b.before)}</span>
                  <span className={`${styles.balanceArrow} ${styles[`arrow_${direction}`]}`}>
                    {direction === "up" ? "▲" : direction === "down" ? "▼" : "—"}
                  </span>
                  <span className={`${styles.balanceCurrent} ${styles[`tick_${direction}`]}`}>
                    {fmtMoney(b.current)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DocumentInspector({ documents, identifiers }) {
  const payload = useMemo(() => {
    if (documents.journalEntry) return documents.journalEntry;
    if (documents.subLedgerEntries.length > 0) {
      return { subLedgerEntries: documents.subLedgerEntries };
    }
    return null;
  }, [documents]);

  return (
    <div className={styles.inspector}>
      <div className={styles.inspectorHead}>
        <Subtitle className={styles.sectionHeading}>Document inspector</Subtitle>
        {identifiers.journalId && (
          <CopyChip label="" value={identifiers.journalId} title="Copy journalId" />
        )}
      </div>
      {!payload ? (
        <div className={styles.placeholder}>
          Awaiting first posting — JSON renders here as the journal materializes.
        </div>
      ) : (
        <div className={styles.codeWrap}>
          <Code language="json" copyable={false} darkMode>
            {JSON.stringify(payload, null, 2)}
          </Code>
        </div>
      )}
    </div>
  );
}

const ActivityPanel = ({ state }) => {
  const { currentStage, reachedStages, status, balances, documents, identifiers } = state;
  return (
    <div className={styles.panel}>
      <StageTimeline
        currentStage={currentStage}
        reachedStages={reachedStages}
        status={status}
      />
      <BalancesTicker balances={balances} />
      <DocumentInspector documents={documents} identifiers={identifiers} />
    </div>
  );
};

export default ActivityPanel;
