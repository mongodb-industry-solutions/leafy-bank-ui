"use client";

// Transactions.jsx

import { useState, useEffect } from "react";
import Icon from "@leafygreen-ui/icon";
import { Subtitle, Body } from "@leafygreen-ui/typography";
import IconButton from "@leafygreen-ui/icon-button";
import Popover from "@leafygreen-ui/popover";
import Code from "@leafygreen-ui/code";

import styles from "./Transactions.module.css";

const Transactions = ({ transactions = [] }) => {
  const [expandedTransactionIndex, setExpandedTransactionIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch selectedUser from localStorage
  useEffect(() => {
    const userString = localStorage.getItem("selectedUser"); // Ensure the key matches how you store it
    const user = userString ? JSON.parse(userString) : null;

    if (user && user.id) {
      setSelectedUser(user);
    } else {
      console.warn("selectedUser not found or invalid in localStorage");
    }
  }, []);

  // Utility: Group transactions by date
  const groupTransactionsByDate = (transactionsArray) => {
    if (!Array.isArray(transactionsArray)) {
      console.warn("Invalid transactions array:", transactionsArray);
      return {};
    }

    const today = new Date().toLocaleDateString();

    return transactionsArray.reduce((acc, transaction) => {
      const notifiedDateObj = transaction.TransactionDates?.find(
        (dateObj) => dateObj.TransactionDateType === "TransactionNotifiedDate"
      );

      if (!notifiedDateObj) {
        console.warn("Missing TransactionNotifiedDate for transaction:", transaction);
        return acc;
      }
      const notifiedDate = new Date(notifiedDateObj.TransactionDate).toLocaleDateString();
      const displayDate = notifiedDate === today ? "Today" : notifiedDate;

      if (!acc[displayDate]) acc[displayDate] = [];
      acc[displayDate].push(transaction);

      return acc;
    }, {});
  };

  // Utility: Determine if a transaction is incoming
  const isTransactionIncoming = (transaction, selectedUserId) => {
    if (!transaction || !selectedUserId) {
      console.warn("Transaction or SelectedUserId is missing:", transaction, selectedUserId);
      return false;
    }

    const receiverId = transaction.TransactionReferenceData?.TransactionReceiver?.UserId;
    const senderId = transaction.TransactionReferenceData?.TransactionSender?.UserId;

    // A transaction is incoming if the receiver matches the selected user
    return receiverId === selectedUserId && senderId !== selectedUserId;
  };

  // Utility: Determine if a transaction is internal
  const isTransactionInternal = (transaction) => {
    const senderId = transaction.TransactionReferenceData?.TransactionSender?.UserId;
    const receiverId = transaction.TransactionReferenceData?.TransactionReceiver?.UserId;

    return senderId === receiverId; // Internal if sender and receiver are the same
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
              const transactionType = transaction.TransactionDetails?.TransactionType;
              const transactionPaymentMethod = transaction.TransactionDetails?.TransactionPaymentMethod;
              const isInternal = isTransactionInternal(transaction);
              const isIncoming = !isInternal && selectedUser
                ? isTransactionIncoming(transaction, selectedUser.id)
                : false;

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

              return (
                <div key={transaction._id || currentIndex} className={styles.transactionSection}>
                  <div className={styles.transactionRow}>
                    {/* Icon for Transaction Direction */}
                    <div className={`${styles.transactionIcon} ${transactionIconClass}`}>
                      <Icon glyph={transactionIconGlyph} size="large" />
                    </div>

                    {/* Transaction Details */}
                    <div className={styles.transactionDetails}>
                      <div className={styles.transactionName}>
                        <Body className={styles.transactionName}>
                          {isInternal
                            ? transaction.TransactionReferenceData?.TransactionSender?.UserName || "Unknown User"
                            : isIncoming
                            ? transaction.TransactionReferenceData?.TransactionSender?.UserName || "Unknown Sender"
                            : transaction.TransactionReferenceData?.TransactionReceiver?.UserName || "Unknown Receiver"}
                        </Body>
                      </div>
                      <div className={styles.transactionType}>
                        <Body className={styles.transactionType}>
                          {isInternal
                            ? "InternalTransfer"
                            : transactionType === "DigitalPayment"
                            ? transactionPaymentMethod || "Unknown Payment Method"
                            : transactionType || "Unknown Type"}
                        </Body>
                      </div>
                    </div>

                    {/* Transaction Amount */}
                    <div
                      className={`${styles.transactionAmount} ${
                        isInternal
                          ? styles.neutral
                          : isIncoming
                          ? styles.positive
                          : styles.negative
                      }`}
                    >
                      <Body className={styles.transactionAmount}>
                        {isInternal
                          ? `${transaction.TransactionAmount || 0}$` // No sign for internal
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

                  {/* Expanded Transaction Details */}
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
