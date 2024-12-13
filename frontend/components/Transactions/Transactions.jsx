"use client";

// Transactions.jsx

import { useState } from "react";
import Icon from '@leafygreen-ui/icon';
import { Subtitle } from '@leafygreen-ui/typography';
import IconButton from '@leafygreen-ui/icon-button';
import Popover from '@leafygreen-ui/popover';
import { Body } from '@leafygreen-ui/typography';
import Code from '@leafygreen-ui/code';

import styles from './Transactions.module.css';

const Transactions = ({ transactions = [], selectedUserId }) => { // Initialize default empty array

    const [expandedTransactionIndex, setExpandedTransactionIndex] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // Utility function to group transactions by date
    const groupTransactionsByDate = (transactionsArray) => {
        // Ensure we are dealing with an actual array
        if (!Array.isArray(transactionsArray)) return {};

        const today = new Date().toLocaleDateString();
        return transactionsArray.reduce((acc, transaction) => {
            const notifiedDateObj = transaction.TransactionDates.find(
                dateObj => dateObj.TransactionDateType === 'TransactionNotifiedDate'
            );

            if (!notifiedDateObj) return acc;
            const notifiedDate = new Date(notifiedDateObj.TransactionDate).toLocaleDateString();
            const displayDate = notifiedDate === today ? 'Today' : notifiedDate;
            if (!acc[displayDate]) {
                acc[displayDate] = [];
            }
            acc[displayDate].push(transaction);
            return acc;
        }, {});
    };

    // Group transactions by date
    const groupedTransactions = groupTransactionsByDate(transactions);

    // Initialize a unique transaction index that increments across all groups
    let globalIndex = 0;

    return (
        <div className={styles.transactionsContainer}>
            {Object.keys(groupedTransactions).length === 0 ? (
                <p>No transactions on this account</p>
            ) : (
                Object.entries(groupedTransactions).map(([date, transactions]) => (
                    <div key={date} className={styles.transactionDateGroup}>
                        <Subtitle className={styles.transactionDateTitle}>{date}</Subtitle> {/* Title with the date */}

                        {transactions.map((transaction) => {
                            const transactionType = transaction.TransactionDetails.TransactionType;
                            const transactionPaymentMethod = transaction.TransactionDetails.TransactionPaymentMethod;

                            const isIncoming = transaction.TransactionReferenceData.TransactionReceiver.UserId === selectedUserId;

                            const currentIndex = globalIndex++;  // Get a globally unique index

                            return (
                                <div key={transaction._id || currentIndex} className={styles.transactionSection}>
                                    <div className={styles.transactionRow}>
                                        <div className={`${styles.transactionIcon} ${isIncoming ? styles.arrowDown : styles.arrowUp}`}>
                                            <Icon glyph={isIncoming ? 'ArrowDown' : 'ArrowUp'} size="large" />
                                        </div>

                                        <div className={styles.transactionDetails}>
                                            <div className={styles.transactionName}>
                                                <Body className={styles.transactionName}>
                                                    {isIncoming
                                                        ? transaction.TransactionReferenceData.TransactionSender.UserName
                                                        : transaction.TransactionReferenceData.TransactionReceiver.UserName}
                                                </Body>
                                            </div>
                                            <div className={styles.transactionType}>
                                                <Body className={styles.transactionType}>
                                                    {transactionType === 'DigitalPayment'
                                                        ? transactionPaymentMethod
                                                        : transactionType}
                                                </Body>
                                            </div>
                                        </div>

                                        <div className={`${styles.transactionAmount} ${isIncoming ? styles.positive : styles.negative}`}>
                                            <Body className={styles.transactionAmount}>
                                                {isIncoming
                                                    ? `+${transaction.TransactionAmount}$`
                                                    : `-${transaction.TransactionAmount}$`}
                                            </Body>
                                        </div>

                                        <div className={styles.transactionActions}>
                                            <IconButton
                                                className={styles.actionButton}
                                                onClick={() => {
                                                    setExpandedTransactionIndex(expandedTransactionIndex === currentIndex ? null : currentIndex);
                                                }}
                                                aria-label="Expand"
                                                onMouseEnter={() => setHoveredIndex(currentIndex)}
                                                onMouseLeave={() => setHoveredIndex(null)}
                                            >
                                                {expandedTransactionIndex === currentIndex ? <Icon glyph="Minus" /> : <Icon glyph="Plus" />}
                                                <Popover active={hoveredIndex === currentIndex} align="top" justify="middle" usePortal={true}>
                                                    <Body className={styles.popoverBody}>Expand</Body>
                                                </Popover>
                                            </IconButton>
                                        </div>
                                    </div>

                                    {expandedTransactionIndex === currentIndex && (
                                        <div className={styles.expandableSection}>
                                            <Code language={'json'} style={{ width: '100%' }}>
                                                {JSON.stringify(transaction, null, 3)}
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
