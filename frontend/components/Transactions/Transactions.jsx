"use client";

// Transactions.jsx
//
// Phase 5.1 (BIAN-shape adapter):
//   - Each `transaction` object is the raw BIAN ledger leg returned by
//     `/CurrentAccountFulfillmentArrangement/CurrentAccountTransaction/Request`,
//     plus a small set of underscore-prefixed display helpers (`_isInternal`,
//     `_isIncoming`, `_isOutgoing`, `_otherSideName`, `_selfUserName`,
//     `_displayLabel`, `_paymentMethod`) injected by `lib/adapters/bian-to-ui.js`.
//   - The expand-JSON panel now shows the actual BIAN model.

import { useState } from "react";
import Icon from "@leafygreen-ui/icon";
import { Subtitle, Body } from "@leafygreen-ui/typography";
import IconButton from "@leafygreen-ui/icon-button";
import Popover from "@leafygreen-ui/popover";
import Code from "@leafygreen-ui/code";

import styles from "./Transactions.module.css";

const Transactions = ({ transactions = [] }) => {
  const [expandedTransactionIndex, setExpandedTransactionIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Group BIAN legs by `TransactionBookingDate`. The date is a single ISO-string
  // field on the leg (not the legacy `TransactionDates[]` array).
  const groupTransactionsByDate = (transactionsArray) => {
    if (!Array.isArray(transactionsArray)) {
      console.warn("Invalid transactions array:", transactionsArray);
      return {};
    }

    const today = new Date().toLocaleDateString();

    return transactionsArray.reduce((acc, transaction) => {
      const bookingDate = transaction.TransactionBookingDate;
      if (!bookingDate) {
        console.warn("Missing TransactionBookingDate for transaction:", transaction);
        return acc;
      }
      const local = new Date(bookingDate).toLocaleDateString();
      const displayDate = local === today ? "Today" : local;

      if (!acc[displayDate]) acc[displayDate] = [];
      acc[displayDate].push(transaction);

      return acc;
    }, {});
  };

  // Group transactions by date
  const groupedTransactions = groupTransactionsByDate(transactions);
  let globalIndex = 0; // Initialize unique index

  // Render: Main component
  return (
    <div className={styles.transactionsContainer}>
      {Object.keys(groupedTransactions).length === 0 ? (
        <p>No transactions on this account</p>
      ) : (
        Object.entries(groupedTransactions).map(([date, transactions]) => (
          <div key={date} className={styles.transactionDateGroup}>
            <Subtitle className={styles.transactionDateTitle}>{date}</Subtitle> {/* Date Title */}

            {transactions.map((transaction) => {
              const isInternal = !!transaction._isInternal;
              const isIncoming = !!transaction._isIncoming;
              const displayLabel = transaction._displayLabel || "Transaction";
              const paymentMethod = transaction._paymentMethod;

              const currentIndex = globalIndex++; // Globally unique index

              const transactionIconClass = isInternal
                ? styles.neutral
                : isIncoming
                ? styles.arrowDown
                : styles.arrowUp;

              const transactionIconGlyph = isInternal
                ? "MultiDirectionArrow"
                : isIncoming
                ? "ArrowDown"
                : "ArrowUp";

              // For non-internal: row title is the OTHER side (counterparty for outgoing,
              // sender for incoming). For internal: show self user (sender == receiver).
              const rowTitle = isInternal
                ? transaction._selfUserName || "Unknown User"
                : transaction._otherSideName || "Unknown";

              // Type-line shows the payment method for digital payments, otherwise the
              // adapter-derived label (`InternalTransfer`/`AccountTransfer`/`DigitalPayment`).
              const typeLine =
                displayLabel === "DigitalPayment"
                  ? paymentMethod || "Unknown Payment Method"
                  : displayLabel;

              return (
                <div
                  key={transaction.TransactionReference || currentIndex}
                  className={styles.transactionSection}
                >
                  <div className={styles.transactionRow}>
                    {/* Icon for Transaction Direction */}
                    <div className={`${styles.transactionIcon} ${transactionIconClass}`}>
                      <Icon glyph={transactionIconGlyph} size="large" />
                    </div>

                    {/* Transaction Details */}
                    <div className={styles.transactionDetails}>
                      <div className={styles.transactionName}>
                        <Body className={styles.transactionName}>{rowTitle}</Body>
                      </div>
                      <div className={styles.transactionType}>
                        <Body className={styles.transactionType}>{typeLine}</Body>
                      </div>
                    </div>

                    {/* Transaction Amount */}
                    <div
                      className={`${styles.transactionAmount} ${
                        isInternal
                          ? styles.same
                          : isIncoming
                          ? styles.positive
                          : styles.negative
                      }`}
                    >
                      <Body className={styles.transactionAmount}>
                        {isInternal
                          ? `${transaction.TransactionAmount || 0}$`
                          : isIncoming
                          ? `+${transaction.TransactionAmount || 0}$`
                          : `-${transaction.TransactionAmount || 0}$`}
                      </Body>
                    </div>

                    {/* Expand/Collapse Button */}
                    <div className={styles.transactionActions}>
                      <IconButton
                        className={styles.actionButton}
                        onClick={() =>
                          setExpandedTransactionIndex(
                            expandedTransactionIndex === currentIndex ? null : currentIndex
                          )
                        }
                        aria-label="Expand"
                        onMouseEnter={() => setHoveredIndex(currentIndex)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {expandedTransactionIndex === currentIndex ? (
                          <Icon glyph="Minus" />
                        ) : (
                          <Icon glyph="Plus" />
                        )}
                        <Popover
                          active={hoveredIndex === currentIndex}
                          align="top"
                          justify="middle"
                          usePortal={true}
                        >
                          <Body className={styles.popoverBody}>Expand</Body>
                        </Popover>
                      </IconButton>
                    </div>
                  </div>

                  {/* Expanded Transaction Details — raw BIAN leg shape */}
                  {expandedTransactionIndex === currentIndex && (
                    <div className={styles.expandableSection}>
                      <Code language={"json"} style={{ width: "100%" }}>
                        {JSON.stringify(transaction, null, 2)}
                      </Code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};

export default Transactions;
