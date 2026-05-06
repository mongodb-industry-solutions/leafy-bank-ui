"use client";

import React, { useEffect } from "react";
import Card from "@leafygreen-ui/card";
import { Avatar, Format } from "@leafygreen-ui/avatar";
import { ProgressBar } from "@leafygreen-ui/progress-bar";
import { Subtitle, Body, Overline, InlineCode } from "@leafygreen-ui/typography";
import Icon from "@leafygreen-ui/icon";
import { motion, useSpring, useTransform } from "motion/react";
import { SPRING } from "./motionConfig";
import styles from "./AccountBalanceCards.module.css";

const fmtMoney = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

const fmtSigned = (delta) => {
  const s = fmtMoney(Math.abs(delta));
  return `${delta >= 0 ? "+" : "−"}${s}`;
};

function AccountCard({ accountId, displayName, before, current, ceiling, side }) {
  // Spring-driven balance numeral. Settles into target via natural physics.
  const springed = useSpring(current, SPRING.numeral);
  const formatted = useTransform(springed, (n) => fmtMoney(n));
  useEffect(() => { springed.set(current); }, [current, springed]);

  const delta = current - before;
  const isCredit = side === "credit";
  const isDirty = before !== current;

  // Show progress as % of ceiling — normalized so both cards read on same scale
  const ratio = ceiling > 0 ? Math.max(0, Math.min(100, (current / ceiling) * 100)) : 0;
  const beforeRatio = ceiling > 0 ? Math.max(0, Math.min(100, (before / ceiling) * 100)) : 0;

  const tone = isCredit ? "credit" : "debit";

  return (
    <Card className={`${styles.card} ${styles[`card_${tone}`]}`}>
      {/* Col 1 — Identity */}
      <div className={styles.head}>
        <Avatar
          size="default"
          format={Format.Text}
          text={displayName?.[0] || "?"}
          className={styles.avatar}
        />
        <div className={styles.headText}>
          <Subtitle className={styles.name}>{displayName}</Subtitle>
          <div className={styles.metaRow}>
            <InlineCode className={styles.acctId}>{accountId}</InlineCode>
            <span className={styles.dot} aria-hidden="true">·</span>
            <Body className={styles.metaTag}>Customer Deposits · 2100</Body>
          </div>
        </div>
      </div>

      {/* Col 2 — Big balance numeral with overline (spring-driven) */}
      <div className={styles.balanceCol}>
        <Overline className={styles.overline}>Current balance</Overline>
        <motion.span className={styles.balance} data-tone={tone}>
          {formatted}
        </motion.span>
      </div>

      {/* Col 3 — Progress bar + before→after row */}
      <div className={styles.progressCol}>
        <div className={styles.progressRow}>
          <ProgressBar
            value={ratio}
            maxValue={100}
            variant={isCredit ? "success" : "info"}
            aria-label={`${displayName} balance ratio`}
            className={styles.progress}
          />
          <div className={styles.progressMarks} aria-hidden="true">
            <span
              className={styles.beforeMark}
              style={{ left: `${beforeRatio}%` }}
              title={`before: ${fmtMoney(before)}`}
            />
          </div>
        </div>
        <div className={styles.beforeRow}>
          <Body className={styles.beforeLabel}>before</Body>
          <Body className={styles.beforeAmt}>{fmtMoney(before)}</Body>
          <Icon glyph="ArrowRight" size="small" className={styles.beforeArrow} />
          <Body className={styles.afterAmt} data-tone={tone}>
            {fmtMoney(current)}
          </Body>
        </div>
      </div>

      {/* Col 4 — Delta chip (spring-popped on appearance) */}
      {isDirty ? (
        <motion.span
          key={`${accountId}-${delta}`}
          className={[
            styles.deltaChip,
            delta >= 0 ? styles.deltaPos : styles.deltaNeg,
          ].join(" ")}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING.hero}
          aria-live="polite"
        >
          <Icon
            glyph={delta >= 0 ? "ArrowUp" : "ArrowDown"}
            size="small"
            className={styles.deltaIcon}
          />
          {fmtSigned(delta)}
        </motion.span>
      ) : (
        <span aria-hidden="true" />
      )}
    </Card>
  );
}

const AccountBalanceCards = ({ balances }) => {
  const ids = Object.keys(balances || {});
  if (ids.length < 2) {
    return (
      <div className={styles.row} aria-label="Account balances — empty state">
        <Card className={styles.empty}>
          <Body className={styles.emptyText}>
            Press <strong>Simulate</strong> to see Frida and Bo's account balances react in real time as the journal commits and the change stream fans out to projection writers.
          </Body>
        </Card>
      </div>
    );
  }

  const ceiling = balances[ids[0]]?.ceiling || balances[ids[1]]?.ceiling || 1;

  return (
    <div className={styles.row}>
      <AccountCard
        accountId={ids[0]}
        displayName={balances[ids[0]].displayName}
        before={balances[ids[0]].before}
        current={balances[ids[0]].current}
        ceiling={ceiling}
        side="debit"
      />
      <AccountCard
        accountId={ids[1]}
        displayName={balances[ids[1]].displayName}
        before={balances[ids[1]].before}
        current={balances[ids[1]].current}
        ceiling={ceiling}
        side="credit"
      />
    </div>
  );
};

export default AccountBalanceCards;
